const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    try {
        console.log("Connecting to:", process.env.DB_HOST, "User:", process.env.DB_USER, "DB:", process.env.DB_NAME);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log("Connected. Starting migration...");
        const columns = [
            { name: 'faculty_id', type: 'INT NULL' },
            { name: 'faculty_name', type: 'VARCHAR(255) NULL' },
            { name: 'session_mode', type: 'VARCHAR(50) DEFAULT "Online"' }
        ];

        for (const col of columns) {
            try {
                await connection.query(`ALTER TABLE mentor_timetable ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added column: ${col.name}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column ${col.name} already exists.`);
                } else {
                    console.error(`Error adding ${col.name}:`, e.message);
                }
            }
        }
        
        console.log("Migration completed.");
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
