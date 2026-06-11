const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  console.log('Trying with env password...');
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'mashmagic'
    });
  } catch (e) {
    console.log('Failed, trying with empty password...');
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: '',
      database: process.env.DB_NAME || 'mashmagic'
    });
  }

  try {
    console.log('Adding mentorship_completed column...');
    await conn.query('ALTER TABLE students ADD COLUMN mentorship_completed TINYINT(1) DEFAULT 0');
    console.log('Column added successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Error adding column:', error.message);
    }
  } finally {
    conn.end();
  }
}
run();
