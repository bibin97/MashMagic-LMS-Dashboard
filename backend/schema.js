const db = require('./config/db');

async function run() {
    try {
        const [rows] = await db.query('DESCRIBE timetable;');
        console.table(rows);
        
        await db.end();
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
