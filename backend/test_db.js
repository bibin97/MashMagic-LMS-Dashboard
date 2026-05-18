const db = require('./config/db');

async function test() {
    try {
        const [mentors] = await db.query("SELECT id, name FROM users WHERE name LIKE '%Safa%'");
        console.log('Mentors:', mentors);

        if (mentors.length > 0) {
            const [students] = await db.query(
                "SELECT id, name, enrollment_type, badge, onboarding_status, status FROM students WHERE mentor_id = ?",
                [mentors[0].id]
            );
            console.table(students);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

test();
