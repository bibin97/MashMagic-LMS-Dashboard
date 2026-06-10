require('dotenv').config({path: __dirname + '/.env'});
const mysql = require('mysql2/promise');

async function run() {
    try {
        const c = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        const [r] = await c.query('SELECT id, name, email, contact, registration_number, user_id FROM students WHERE name LIKE "%JOEL%" LIMIT 10');
        console.log("Students:", r);

        const [r2] = await c.query('SELECT COUNT(*) as c, name FROM students GROUP BY name HAVING c > 1');
        console.log("Duplicates:", r2);
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
