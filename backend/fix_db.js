const db = require('./config/db');

async function fixDb() {
    try {
        console.log('Altering aoe_demo_schedules...');
        await db.query('ALTER TABLE aoe_demo_schedules MODIFY COLUMN faculty_id INT NULL');
        console.log('Success');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
fixDb();
