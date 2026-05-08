require('../backend/node_modules/dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const db = require('../backend/config/db');

async function check() {
    try {
        const table = 'mentor_session_logs';
        console.log(`\n--- ${table} Schema ---`);
        const [cols] = await db.query(`DESC ${table}`);
        console.table(cols);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
