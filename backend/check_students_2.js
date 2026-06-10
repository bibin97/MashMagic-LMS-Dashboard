const db = require('./config/db');

async function run() {
    try {
        const [r] = await db.query('SELECT id, name, email, contact, registration_number, user_id FROM students WHERE name LIKE "%JOEL%" LIMIT 10');
        console.log("Students:", r);

        const [r2] = await db.query('SELECT COUNT(*) as c, name FROM students GROUP BY name HAVING c > 1');
        console.log("Duplicates:", r2);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
