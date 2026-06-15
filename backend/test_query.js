const db = require('./config/db');

async function test() {
    try {
        const query = `
            SELECT s.*, m.name as mentor_name, 
            COALESCE(
                (SELECT GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') 
                 FROM faculty_schedules fs 
                 JOIN faculties u ON fs.faculty_id = u.id 
                 WHERE fs.student_id = s.id),
                s.faculty_name
            ) as faculty_name 
            FROM students s 
            LEFT JOIN mentors m ON s.mentor_id = m.id 
            WHERE s.id = 463
        `;
        const [res] = await db.query(query);
        console.log("SUCCESS:", res);
    } catch (e) {
        console.error("ERROR:", e);
    }
    process.exit();
}
test();
