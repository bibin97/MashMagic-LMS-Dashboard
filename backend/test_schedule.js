const db = require('./config/db');

async function test() {
    try {
        const studentId = 481;
        const connection = await db.getConnection();
        const schedules = [
            {
                day_of_week: 'Monday',
                start_time: '10:00:00',
                end_time: '11:00:00',
                subject: 'English',
                faculty_id: 11
            }
        ];

        // ... logic from sscController to see what throws ...
        console.log("Testing connection...");
        const [rows] = await connection.query('SELECT 1');
        console.log("DB connection OK", rows);
        
        let subjectsUpdated = false;
        const [[student]] = await connection.query('SELECT subjects_json, mentor_id FROM students WHERE id = ?', [studentId]);
        let subjects = [];
        if (student && student.subjects_json) {
            try {
                subjects = typeof student.subjects_json === 'string' ? JSON.parse(student.subjects_json) : student.subjects_json;
            } catch (e) {}
        }
        console.log("Subjects parsed", subjects);

        const facId = 11;
        const s = schedules[0];
        
        console.log("Inserting faculty schedule");
        await connection.query(`
            INSERT INTO faculty_schedules (student_id, day_of_week, start_time, end_time, subject, faculty_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [studentId, s.day_of_week, s.start_time, s.end_time, s.subject, facId]);

        console.log("Insert ok.");
        connection.release();
    } catch (e) {
        console.error("Test failed", e);
    }
    process.exit(0);
}

test();
