import pool from '../config/database.js';

export async function getCart(req, res) {
  try {
    const userId = req.user.id;

    const [cartItems] = await pool.query(
      `SELECT c.*, p.name, p.price, p.images 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [userId]
    );

    const parsedItems = cartItems.map(item => {
      let images = [];
      
      // Safe JSON parsing for images
      try {
        if (item.images) {
          if (typeof item.images === 'string') {
            images = JSON.parse(item.images);
          } else {
            images = item.images; // Already parsed by MySQL
          }
        }
      } catch (e) {
        console.warn(`Invalid JSON in images for cart item ${item.id}:`, item.images);
        images = [];
      }

      return {
        ...item,
        price: parseFloat(item.price),  // ✅ Convert price to number
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
    const { product_id, quantity, size, color } = req.body;

    // Check if product exists and has stock
    const [products] = await pool.query('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (products[0].stock < quantity) {
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
      if (products[0].stock < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      await pool.query(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)',
        [userId, product_id, quantity, size, color]
      );
    }

    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    // Check if cart item exists and belongs to user
    const [cartItems] = await pool.query(
      'SELECT c.*, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.user_id = ?',
      [id, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItems[0].stock < quantity) {
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
