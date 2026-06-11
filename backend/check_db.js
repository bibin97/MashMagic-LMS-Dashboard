const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mashmagic'
  });
  
  const [rows] = await connection.query('DESCRIBE students');
  console.log(rows.map(r => r.Field).join(', '));
  connection.end();
}
run();
