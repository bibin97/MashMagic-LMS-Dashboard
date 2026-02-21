const db = require('./config/db');

async function test2() {
    try {
        const [students] = await db.query('SELECT id, name, course, grade, mentor_id, onboarding_status FROM students');
        console.log("Success 2!", students.length);
    } catch (e) {
        console.error("DB Error:", e);
    }
    process.exit();
}
test2();
