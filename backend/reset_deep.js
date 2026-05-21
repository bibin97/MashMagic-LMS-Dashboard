require('dotenv').config();
const mysql = require('mysql2/promise');

async function resetToDeep() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mashmagic'
    });

    try {
        console.log("Setting all students to High priority (DEEP session)...");
        const [result1] = await connection.query("UPDATE students SET priority_category = 'High'");
        console.log(`Updated ${result1.affectedRows} students.`);

        console.log("Clearing today's testing assignments so they regenerate perfectly...");
        const [result2] = await connection.query("DELETE FROM daily_assignments");
        console.log(`Cleared ${result2.affectedRows} daily assignments.`);
        
        console.log("Success! Everyone will start fresh in DEEP today.");
    } catch (e) {
        console.log("Error:", e.message);
    }

    connection.end();
}

resetToDeep();
