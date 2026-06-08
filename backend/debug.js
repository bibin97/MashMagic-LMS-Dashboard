const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [users] = await db.query('SELECT * FROM users WHERE role="faculty" AND name IN ("Afna", "Pooja Sunil")');
        console.log(`Found ${users.length} users to test.`);
        
        for (const f of users) {
            try {
                await db.query(`
                    INSERT INTO faculties (id, name, email, phone_number, status, subject) 
                    VALUES (?, ?, ?, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), email = VALUES(email), phone_number = VALUES(phone_number), status = VALUES(status), subject = VALUES(subject)
                `, [f.id, f.name, f.email, f.phone_number, f.status, f.subject || null]);
                console.log(`Successfully inserted ${f.name}`);
            } catch (err) {
                console.error(`Error inserting ${f.name}:`, err.message);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
    }
}
run();
