const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join('backend', '.env') });

async function check() {
    const db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // 1. Check duplicate students
    const [dupStudents] = await db.query(`
        SELECT name, contact, count(*) as c 
        FROM students 
        GROUP BY name, contact 
        HAVING c > 1
    `);
    console.log('Duplicate students:', dupStudents);

    // 2. Check Pooja Sunil
    const [poojaUsers] = await db.query("SELECT id, name, role, status, email, phone_number FROM users WHERE name LIKE '%pooja%'");
    console.log('Pooja in users:', poojaUsers);

    const [poojaFaculties] = await db.query("SELECT id, name, email, phone_number, status FROM faculties WHERE name LIKE '%pooja%'");
    console.log('Pooja in faculties:', poojaFaculties);

    process.exit(0);
}
check();
