const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

(async () => {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const id = 1;

        console.log("Testing students");
        const [studentRows] = await db.query(`SELECT s.*, m.name as mentor_name FROM students s LEFT JOIN mentors m ON s.mentor_id = m.id WHERE s.id = ?`, [id]);
        
        console.log("Testing exams");
        await db.query('SELECT subject, exam_name, score, total_marks FROM student_exams WHERE student_id = ?', [id]);
        
        console.log("Testing subjects");
        await db.query('SELECT subject_name, allocated_hours, historical_consumed_hours FROM student_subjects WHERE student_id = ?', [id]);
        
        console.log("Testing parent meetings");
        await db.query('SELECT notes, status FROM ah_parent_meetings WHERE student_id = ? ORDER BY date DESC LIMIT 3', [id]);
        
        console.log("All Select Queries Success");

        db.end();
    } catch(e) {
        console.error("DB Error:", e.message);
    }
})();
