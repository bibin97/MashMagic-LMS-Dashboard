const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.query("SELECT id, name, subjects_json FROM students WHERE name LIKE '%Amina%'");
        console.log(JSON.stringify(rows, null, 2));
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
run();
