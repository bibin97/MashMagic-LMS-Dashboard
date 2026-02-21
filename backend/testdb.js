const db = require('./config/db');

async function test() {
    try {
        const query = `
            SELECT 
                s.id as student_id,
                s.name as student_name,
                s.onboarding_status,
                u.name as mentor_name,
                (SELECT MAX(date) FROM student_interaction_logs WHERE student_id = s.id) AS last_interaction_date,
                (SELECT COUNT(*) FROM student_interaction_logs WHERE student_id = s.id) AS total_interaction_count,
                (SELECT COUNT(*) FROM student_verification WHERE student_id = s.id) AS total_check_count
            FROM students s
            LEFT JOIN users u ON s.mentor_id = u.id
        `;
        const [students] = await db.query(query);
        console.log("Success!", students.length);
    } catch (e) {
        console.error("DB Error:", e);
    }
    process.exit();
}
test();
