const mysql = require('mysql2').promise();
require('dotenv').config({ path: './backend/.env' });

async function check() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const [u] = await db.query('SELECT role, status, count(*) as count FROM users GROUP BY role, status');
    console.log("USERS SUMMARY:", u);

    const [m] = await db.query('SELECT status, count(*) as count FROM mentors GROUP BY status');
    console.log("MENTORS SUMMARY:", m);

    const [f] = await db.query('SELECT status, count(*) as count FROM faculties GROUP BY status');
    console.log("FACULTIES SUMMARY:", f);

    const [md] = await db.query('SELECT id, name, status FROM mentors LIMIT 5');
    console.log("MENTORS DATA:", md);

    const [fd] = await db.query('SELECT id, name, status FROM faculties LIMIT 5');
    console.log("FACULTIES DATA:", fd);

    await db.end();
}

check();
