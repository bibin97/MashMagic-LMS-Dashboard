const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function syncStatus() {
    try {
        const db = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log("Syncing faculties and mentors status with users table...");
        
        // Update faculties
        const [facultiesResult] = await db.query(`
            UPDATE faculties f
            JOIN users u ON f.id = u.id
            SET f.status = u.status
            WHERE u.role = 'faculty' AND f.status != u.status
        `);
        console.log(`Faculties updated: ${facultiesResult.affectedRows}`);

        // Update mentors
        const [mentorsResult] = await db.query(`
            UPDATE mentors m
            JOIN users u ON m.id = u.id
            SET m.status = u.status
            WHERE u.role = 'mentor' AND m.status != u.status
        `);
        console.log(`Mentors updated: ${mentorsResult.affectedRows}`);

        console.log("Sync complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error during sync:", error);
        process.exit(1);
    }
}

syncStatus();
