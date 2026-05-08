require('../backend/node_modules/dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const db = require('../backend/config/db');

async function check() {
    try {
        console.log("--- Listing Tables ---");
        const [tables] = await db.query("SHOW TABLES");
        console.table(tables);

        const expectedTables = ['student_interaction_logs', 'mentor_session_reports', 'mentor_session_logs', 'mentorship_logs', 'users', 'students'];
        for (const table of expectedTables) {
            try {
                console.log(`\n--- ${table} Schema ---`);
                const [cols] = await db.query(`DESC ${table}`);
                console.table(cols);
            } catch (e) {
                console.error(`Error describing ${table}:`, e.message);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error("Global Error:", e);
        process.exit(1);
    }
}

check();
