import pool from '../config/database.js';

export async function getCart(req, res) {
  try {
    const userId = req.user.id;

    const [cartItems] = await pool.query(
      `SELECT c.*, p.name, p.price as product_price, p.images 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [userId]
    );

    const parsedItems = cartItems.map(item => {
      let images = [];
      
      try {
        if (item.images) {
          if (typeof item.images === 'string') {
            images = JSON.parse(item.images);
          } else {
            images = item.images;
          }
        }
      } catch (e) {
        console.warn(`Invalid JSON in images for cart item ${item.id}:`, item.images);
        images = [];
      }

      return {
        ...item,
        price: item.price != null ? parseFloat(item.price) : (item.product_price ? parseFloat(item.product_price) : 0),
        images,
      };
    });

    res.json(parsedItems);
  } catch (error) {
    console.error('❌ Error in getCart:', error);  // ✅ Add logging
    res.status(500).json({ error: error.message });
  }
}

export async function addToCart(req, res) {
  try {
    const userId = req.user.id;
    const { product_id, quantity, size, color, price } = req.body;

    const [products] = await pool.query('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Variant-level stock check (critical for matchy_matchy products
    // where adult_36 and enfant_12 variants have independent stock)
    let variantResult = [];
    if (size && color) {
      [variantResult] = await pool.query(
        'SELECT stock FROM product_variants WHERE product_id = ? AND size = ? AND color = ?',
        [product_id, size, color]
      );
      if (!variantResult[0] || variantResult[0].stock < quantity) {
        return res.status(400).json({ error: 'Insufficient variant stock' });
      }
    } else if (products[0].stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
    const [existingItems] = await pool.query(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?',
      [userId, product_id, size, color]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      if (!size && !color && products[0].stock < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      if (size && color && (!variantResult[0] || variantResult[0].stock < newQuantity)) {
        return res.status(400).json({ error: 'Insufficient variant stock' });
      }
      await pool.query(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity, size, color, price) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, product_id, quantity, size, color, price || null]
      );
    }

    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function addItemsToCart(req, res) {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0 || items.some(item => (
      !item.product_id || !Number.isInteger(item.quantity) || item.quantity < 1 || !item.size || !item.color
    ))) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }

    const requested = items.reduce((counts, item) => {
      const key = `${item.product_id}:${item.size}:${item.color}`;
      counts[key] = (counts[key] || 0) + item.quantity;
      return counts;
    }, {});

    await connection.beginTransaction();
    for (const [key, requestedQuantity] of Object.entries(requested)) {
      const [productId, size, color] = key.split(':');
      const [variants] = await connection.query(
        'SELECT stock FROM product_variants WHERE product_id = ? AND size = ? AND color = ? FOR UPDATE',
        [productId, size, color]
      );
      const [cartQuantity] = await connection.query(
        'SELECT COALESCE(SUM(quantity), 0) AS quantity FROM cart WHERE user_id = ? AND product_id = ? AND size = ? AND color = ? FOR UPDATE',
        [userId, productId, size, color]
      );
      const currentQuantity = Number(cartQuantity[0]?.quantity || 0);
      if (!variants[0] || variants[0].stock < currentQuantity + requestedQuantity) {
        await connection.rollback();
        return res.status(400).json({ error: 'Insufficient variant stock' });
      }
    }

    for (const item of items) {
      const [existing] = await connection.query(
        'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND size = ? AND color = ? FOR UPDATE',
        [userId, item.product_id, item.size, item.color]
      );
      if (existing.length > 0) {
        await connection.query('UPDATE cart SET quantity = ?, price = COALESCE(?, price) WHERE id = ?', [existing[0].quantity + item.quantity, item.price || null, existing[0].id]);
      } else {
        await connection.query(
          'INSERT INTO cart (user_id, product_id, quantity, size, color, price) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, item.product_id, item.quantity, item.size, item.color, item.price || null]
        );
      }
    }
    await connection.commit();
    res.status(201).json({ message: 'Items added to cart' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
}

export async function updateCartItem(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const [cartItems] = await pool.query(
      `SELECT c.*, p.stock,
       (SELECT stock FROM product_variants pv WHERE pv.product_id = p.id AND pv.size = c.size AND pv.color = c.color) as variant_stock
       FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.user_id = ?`,
      [id, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const availableStock = cartItems[0].variant_stock != null ? cartItems[0].variant_stock : cartItems[0].stock;
    if (availableStock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, id]);

    res.json({ message: 'Cart item updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function removeFromCart(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify cart item belongs to user
    const [cartItems] = await pool.query(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await pool.query('DELETE FROM cart WHERE id = ?', [id]);

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
