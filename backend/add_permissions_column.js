const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: 'localhost', // Try localhost instead of 127.0.0.1
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

async function migrate() {
    try {
        console.log("Checking for permissions column...");
        const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'permissions'");
        
        if (columns.length === 0) {
            console.log("Adding permissions column to users table...");
            await db.query("ALTER TABLE users ADD COLUMN permissions JSON DEFAULT NULL AFTER badge");
            console.log("Column added successfully.");
        } else {
            console.log("Permissions column already exists.");
        }
        
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

migrate();
