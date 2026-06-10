const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mash_lms',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        await pool.query('ALTER TABLE aoe_demo_schedules ADD COLUMN meeting_link VARCHAR(255) DEFAULT NULL;');
        console.log("Column added successfully!");
        process.exit(0);
    } catch(err) {
        if(err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error("Error:", err);
        }
        process.exit(1);
    }
}
run();
