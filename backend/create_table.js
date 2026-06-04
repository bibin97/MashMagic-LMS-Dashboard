const db = require('./config/db');
require('dotenv').config();

const createTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS faculty_edit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                faculty_id INT NOT NULL,
                edited_by INT NOT NULL,
                edited_by_name VARCHAR(255),
                edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table created");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

createTable();
