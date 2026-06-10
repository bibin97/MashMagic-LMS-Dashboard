require('dotenv').config({path: './backend/.env'});
const mysql = require('mysql2/promise');

async function run() {
    try {
        const c = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [r] = await c.query('SELECT id, name, status, course_completed FROM students WHERE name LIKE "%aysha%"');
        console.log("Results for Aysha:", r);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
