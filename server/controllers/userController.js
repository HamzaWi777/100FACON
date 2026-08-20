import pool from '../config/database.js';

export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [users] = await pool.query(
      'SELECT id, full_name, email, phone, address, wilaya, role, created_at FROM users LIMIT ? OFFSET ?',
      [parseInt(limit), offset]
    );

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');

    res.json({
      users,
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
