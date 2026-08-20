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
    
    // Read and execute schema
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Split by ; and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
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