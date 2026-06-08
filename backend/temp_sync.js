require('dotenv').config({ path: './.env' });
const db = require('./config/db');

const testSync = async () => {
    try {
        const [fs] = await db.query('SELECT * FROM users WHERE role = "faculty"');
        console.log(`Found ${fs.length} faculties in users table`);
        let failed = 0;
        let success = 0;
        for (const f of fs) {
            try {
                await db.query('INSERT INTO faculties (id, name, email, phone_number, status, subject) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone_number = VALUES(phone_number), status = VALUES(status), subject = VALUES(subject)', [f.id, f.name, f.email, f.phone_number, f.status, f.subject || null]);
                success++;
            } catch (err) {
                console.error(`Error syncing faculty ${f.id} (${f.name}):`, err.message);
                failed++;
            }
        }
        console.log(`Sync complete. Success: ${success}, Failed: ${failed}`);
        process.exit(0);
    } catch (e) {
        console.error("Fatal error:", e);
        process.exit(1);
    }
};

testSync();
