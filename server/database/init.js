import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    // Fix for Windows path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const schemaPath = join(__dirname, 'schema.sql');
    
    // Execute schema
    const schema = readFileSync(schemaPath, 'utf-8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    // Idempotent migrations for new columns
    const migrations = [
      'ALTER TABLE products ADD COLUMN is_matchy_matchy TINYINT(1) DEFAULT 0',
      'ALTER TABLE products ADD COLUMN enfant_sizes JSON',
      'ALTER TABLE products ADD COLUMN enfant_price DECIMAL(10,2)',
      'ALTER TABLE products ADD COLUMN enfant_colors JSON',
      'ALTER TABLE cart ADD COLUMN price DECIMAL(10,2)',
      'ALTER TABLE products ADD COLUMN voilee TINYINT(1) DEFAULT 0',
      'ALTER TABLE cart ADD COLUMN voilee TINYINT(1) DEFAULT 0',
      'ALTER TABLE order_items ADD COLUMN voilee TINYINT(1) DEFAULT 0',
    ];
    // Backfill price for existing cart rows
    migrations.push('UPDATE cart c JOIN products p ON c.product_id = p.id SET c.price = p.price WHERE c.price IS NULL');
    for (const migration of migrations) {
      try {
        await connection.execute(migration);
      } catch (err) {
        console.log('Migration note:', err.sqlMessage || err.message);
      }
    }

    // Seed admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(
      'INSERT IGNORE INTO users (full_name, email, password, phone, address, wilaya, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Admin User', 'admin@store.com', hashedPassword, '0123456789', 'Admin Address', 'Algiers', 'admin']
    );

    connection.release();
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export default pool;