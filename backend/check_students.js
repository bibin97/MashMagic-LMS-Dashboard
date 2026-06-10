const db = require('./config/db.js');
async function check() {
    try {
        const [students] = await db.query(`SELECT id, name, mentor_id, user_id, contact FROM students WHERE name LIKE '%zayan%' OR name LIKE '%sidhan%'`);
        console.log('Students:', students);
        
        const [users] = await db.query(`SELECT id, name, role, email, phone_number FROM users WHERE name LIKE '%zayan%' OR name LIKE '%sidhan%'`);
        console.log('Users:', users);

        const [mentors] = await db.query(`SELECT id, name FROM users WHERE name LIKE '%Ramshu%'`);
        console.log('Mentors:', mentors);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
