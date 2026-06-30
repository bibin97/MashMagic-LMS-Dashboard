const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const id = 1;

        // 1. Fetch student info
        const [studentRows] = await db.query(`
            SELECT s.*, m.name as mentor_name 
            FROM students s 
            LEFT JOIN mentors m ON s.mentor_id = m.id 
            WHERE s.id = ?`, [id]
        );
        console.log("Student fetch ok.");

        const [exams] = await db.query('SELECT subject, exam_name, score, total_marks FROM student_exams WHERE student_id = ?', [id]);
        console.log("Exams fetch ok.");

        const [subjects] = await db.query('SELECT subject_name, allocated_hours, historical_consumed_hours FROM student_subjects WHERE student_id = ?', [id]);
        console.log("Subjects fetch ok.");

        const [meetings] = await db.query('SELECT notes, status FROM ah_parent_meetings WHERE student_id = ? ORDER BY date DESC LIMIT 3', [id]);
        console.log("Meetings fetch ok.");

        const reportData = {test: 1};

        await db.query(
            'INSERT INTO student_growth_reports (student_id, report_data) VALUES (?, ?)',
            [id, JSON.stringify(reportData)]
        );
        console.log("Insert ok.");

        await db.query('UPDATE students SET performance_status = ? WHERE id = ?', ['Excellent', id]);
        console.log("Update ok.");

        db.end();
    } catch(e) {
        console.error("DB Error:", e.message);
    }
})();
