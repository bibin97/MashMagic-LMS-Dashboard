const db = require('./backend/config/db');

async function checkUser() {
    try {
        const email = 'masnunathottungal@gmail.com';
        console.log(`Checking DB for ${email}`);
        
        let [users] = await db.query('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
        console.log('users table:', users);

        let [mentors] = await db.query('SELECT id, name, email FROM mentors WHERE email = ?', [email]);
        console.log('mentors table:', mentors);

        let [students] = await db.query('SELECT id, name, email FROM students WHERE email = ?', [email]);
        console.log('students table:', students);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkUser();
