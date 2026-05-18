const mysql = require('mysql2/promise');

async function test() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'MashMagic2026!',
        database: 'mashmagic'
    });

    const [mentors] = await connection.query("SELECT id, name FROM users WHERE name LIKE '%Safa%'");
    console.log('Mentors:', mentors);

    if (mentors.length > 0) {
        const [students] = await connection.query(
            "SELECT id, name, enrollment_type, badge, onboarding_status, status FROM students WHERE mentor_id = ?",
            [mentors[0].id]
        );
        console.log('Students:', students);
    }

    await connection.end();
}

test().catch(console.error);
