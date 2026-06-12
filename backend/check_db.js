const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function run() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    const [rows] = await db.query('SHOW TABLES LIKE "student_subjects"');
    console.log('Tables:', rows);
    
    if(rows.length > 0) {
      const [data] = await db.query('SELECT * FROM student_subjects LIMIT 5');
      console.log('Data:', data);
    }
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
