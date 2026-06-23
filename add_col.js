require('dotenv').config();
const db = require('./backend/config/db');

async function run() {
    try {
        await db.query("ALTER TABLE students ADD COLUMN hours_edited BOOLEAN DEFAULT FALSE;");
        console.log("Column added successfully!");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error(e);
        }
    }
    process.exit(0);
}
run();
