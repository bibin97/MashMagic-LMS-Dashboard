require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'MashMagic2026!',
            database: process.env.DB_NAME || 'mashmagic'
        });
        await connection.query("ALTER TABLE students ADD COLUMN hours_edited BOOLEAN DEFAULT FALSE;");
        console.log("Column added successfully!");
        await connection.end();
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error(e);
        }
    }
    process.exit(0);
}
run();
