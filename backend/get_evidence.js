const mysql = require('mysql2/promise');

async function run() {
    try {
        const db = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'mashmagic'
        });

        const studentIds = [201, 463, 483];
        const evidence = {};

        for (const id of studentIds) {
            evidence[id] = {};
            const [studentRows] = await db.query('SELECT id, name, status, onboarding_status, created_at FROM students WHERE id = ?', [id]);
            evidence[id].student_info = studentRows[0] || null;

            const [interactions] = await db.query('SELECT id, interaction_date, interaction_type as session_type, created_at, is_deleted FROM student_interaction_logs WHERE student_id = ? ORDER BY created_at ASC', [id]);
            evidence[id].interactions = interactions;

            const [timetableRows] = await db.query('SELECT id, date, start_time, status, is_deleted, deleted_at FROM timetable WHERE student_id = ? ORDER BY id ASC', [id]);
            evidence[id].timetable_history = timetableRows;

            const [facultySchedules] = await db.query('SELECT id, subject, day_of_week, start_time, faculty_id, is_deleted, deleted_at FROM faculty_schedules WHERE student_id = ? ORDER BY id ASC', [id]);
            evidence[id].faculty_assignment_history = facultySchedules;
        }

        const fs = require('fs');
        fs.writeFileSync('evidence.json', JSON.stringify(evidence, null, 2));
        console.log("Evidence generated successfully.");
        await db.end();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
run();
