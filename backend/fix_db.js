require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mashmagic'
    });

    try {
        console.log("Dropping old foreign key...");
        await connection.query('ALTER TABLE faculty_sessions DROP FOREIGN KEY faculty_sessions_ibfk_1');
        console.log("Old foreign key dropped!");
    } catch (e) {
        console.log("Error dropping (maybe already dropped):", e.message);
    }

    try {
        console.log("Adding new foreign key linked to faculties table...");
        await connection.query('ALTER TABLE faculty_sessions ADD CONSTRAINT faculty_sessions_faculty_id_fk FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE');
        console.log("New foreign key added successfully!");
    } catch (e) {
        console.log("Error adding new foreign key:", e.message);
    }

    connection.end();
}

fixDB();
