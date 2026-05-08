require('../backend/node_modules/dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const db = require('../backend/config/db');

async function check() {
    try {
        const tables = ['student_interaction_logs', 'mentor_session_reports', 'mentor_session_logs', 'mentorship_logs'];
        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            const [cols] = await db.query(`DESC ${table}`);
            console.table(cols);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
