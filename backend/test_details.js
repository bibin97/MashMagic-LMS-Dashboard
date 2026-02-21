const db = require('./config/db');

async function testDetails() {
    try {
        const mentorId = 19;
        console.log("Fetching details...");
        const [mentorProfile] = await db.query(
            'SELECT id, name, phone_number, place, status, createdAt as created_at FROM users WHERE id = ? AND role = "mentor"',
            [mentorId]
        );
        console.log("Profile", mentorProfile.length);

        const [assignedStudents] = await db.query(
            'SELECT id, name, grade, course, subject, onboarding_status FROM students WHERE mentor_id = ?',
            [mentorId]
        );
        console.log("Students", assignedStudents.length);

        const [interactionLogs] = await db.query(
            `SELECT sil.*, s.name as student_name 
             FROM student_interaction_logs sil 
             JOIN students s ON s.id = sil.student_id 
             WHERE sil.mentor_id = ? 
             ORDER BY sil.date DESC`,
            [mentorId]
        );
        console.log("Logs", interactionLogs.length);

        const [facultyLogs] = await db.query(
            `SELECT fil.*, s.name as student_name 
             FROM faculty_interaction_logs fil 
             JOIN students s ON s.id = fil.student_id 
             WHERE fil.mentor_id = ? 
             ORDER BY fil.date DESC`,
            [mentorId]
        );
        console.log("Fac Logs", facultyLogs.length);

        console.log("Done");
    } catch (e) {
        console.error("DB Error:", e);
    }
    process.exit();
}
testDetails();
