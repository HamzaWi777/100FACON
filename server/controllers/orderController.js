import pool from '../config/database.js';

export async function createOrder(req, res) {
  try {
    const userId = req.user?.id || null;
    const { shipping_address, phone, wilaya, governorate, notes, guest_name, guest_email, guest_session_id, cartItems: bodyCartItems } = req.body;
    
    // Support both 'wilaya' and 'governorate' field names
    const location = governorate || wilaya;

    let cartItems = [];
    
    // Get cart items based on user type
    if (userId) {
      // Authenticated user cart from database
      const [items] = await pool.query(
        `SELECT c.*, p.price FROM cart c 
         JOIN products p ON c.product_id = p.id 
         WHERE c.user_id = ?`,
        [userId]
      );
      cartItems = items;
    } else if (bodyCartItems && Array.isArray(bodyCartItems)) {
      // Guest cart from request body (localStorage)
      cartItems = bodyCartItems;
    } else {
      return res.status(400).json({ error: 'Cart is empty or invalid session' });
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order with guest info if provided
    // Note: Using 'wilaya' for now as it exists in current database schema
    const [orderResult] = await pool.query(
      'INSERT INTO orders (user_id, guest_name, guest_email, total_price, shipping_address, phone, wilaya, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, guest_name || null, guest_email || null, totalPrice, shipping_address, phone, location, notes || null]
    );

    const orderId = orderResult.insertId;

    // Create order items and reduce product stock
for (const item of cartItems) {
  await pool.query(
    'INSERT INTO order_items (order_id, product_id, quantity, size, color, price) VALUES (?, ?, ?, ?, ?, ?)',
    [orderId, item.product_id, item.quantity, item.size, item.color, item.price]
  );

  // Reduce variant-level stock (size + color specific)
  if (item.size && item.color) {
    await pool.query(
      'UPDATE product_variants SET stock = GREATEST(0, stock - ?) WHERE product_id = ? AND size = ? AND color = ?',
      [item.quantity, item.product_id, item.size, item.color]
    );
  }

  // Recompute total stock on products table from sum of all variants
  await pool.query(
    'UPDATE products SET stock = (SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_id = ?) WHERE id = ?',
    [item.product_id, item.product_id]
  );
}

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      totalPrice,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getUserOrders(req, res) {
  try {
    const userId = req.user.id;

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getOrderById(req, res) {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { id } = req.params;

    // Get order - allow admin to see any order, user can only see their own
    // Use LEFT JOIN to include guest orders (user_id = NULL)
    let query = 'SELECT o.*, u.full_name, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?';
    const params = [id];
    
    if (!isAdmin) {
      query += ' AND o.user_id = ?';
      params.push(userId);
    }

    const [orders] = await pool.query(query, params);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const [items] = await pool.query(
      `SELECT oi.*, p.name, p.images FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [id]
    );

    const parsedItems = items.map(item => ({
      ...item,
      images: item.images ? (
        typeof item.images === 'string' && item.images.startsWith('[')
          ? JSON.parse(item.images)
          : [item.images]
      ) : [],
    }));

    res.json({
      ...orders[0],
      items: parsedItems,
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getAllOrders(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Use LEFT JOIN to include guest orders (user_id = NULL)
    let query = 'SELECT o.*, u.full_name, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [orders] = await pool.query(query, params);

    // For each order, fetch its items
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query(
          `SELECT oi.*, p.name FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order.id]
        );
        return {
          ...order,
          items: items,
          itemsCount: items.length,
          customerName: order.full_name || order.guest_name || 'Guest',
          customerEmail: order.email || order.guest_email || 'N/A'
        };
      })
    );

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countParams = [];
    
    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      orders: ordersWithItems,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    res.json({ message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
