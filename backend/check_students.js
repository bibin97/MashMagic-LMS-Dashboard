const mysql = require('mysql2/promise');

async function run() {
    try {
        const db = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'MashMagic2026!',
            database: 'mashmagic'
        });

        const [rows] = await db.query('SELECT id, name, status, onboarding_status, mentor_id, faculty_id FROM students WHERE id IN (201, 463, 483)');
        console.log("Students:", rows);

        const [tt] = await db.query('SELECT student_id, COUNT(*) as c FROM timetable WHERE student_id IN (201, 463, 483) GROUP BY student_id');
        console.log("Timetable count:", tt);
        
        await db.end();
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
