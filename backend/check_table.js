const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [rows] = await db.query("SHOW TABLES LIKE 'student_growth_reports'");
        console.log("student_growth_reports table exists:", rows.length > 0);
        db.end();
    } catch(e) {
        console.error('Error:', e.message);
    }
})();
