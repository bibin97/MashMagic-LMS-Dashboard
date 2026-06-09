const db = require('./config/db.js');
async function check() {
    try {
        const [dupStudents] = await db.query(`
            SELECT name, contact, count(*) as c 
            FROM students 
            GROUP BY name, contact 
            HAVING c > 1
        `);
        console.log('Duplicate students:', dupStudents);

        const [poojaUsers] = await db.query("SELECT id, name, role, status, email, phone_number FROM users WHERE name LIKE '%pooja%'");
        console.log('Pooja in users:', poojaUsers);

        const [poojaFaculties] = await db.query("SELECT id, name, email, phone_number, status FROM faculties WHERE name LIKE '%pooja%'");
        console.log('Pooja in faculties:', poojaFaculties);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
