const db = require('./config/db');

async function run() {
    try {
        const studentIds = [201, 463, 483];
        const evidence = {};

        for (const id of studentIds) {
            evidence[id] = {};
            
            // 1. Basic Info & Onboarding Status
            const [studentRows] = await db.query(
                'SELECT id, name, status, onboarding_status, created_at FROM students WHERE id = ?',
                [id]
            );
            evidence[id].student_info = studentRows[0] || null;

            // 2. Interaction History
            const [interactions] = await db.query(
                'SELECT id, interaction_date, interaction_type as session_type, details, created_at, is_deleted FROM student_interaction_logs WHERE student_id = ? ORDER BY created_at ASC',
                [id]
            );
            evidence[id].interactions = interactions;

            // 3. Timetable Creation History (including deleted ones)
            const [timetableRows] = await db.query(
                'SELECT id, date, start_time, status, is_deleted, deleted_at FROM timetable WHERE student_id = ? ORDER BY id ASC',
                [id]
            );
            evidence[id].timetable_history = timetableRows;

            // 4. Faculty Assignment History
            const [facultySchedules] = await db.query(
                'SELECT id, subject, day_of_week, start_time, faculty_id, is_deleted, deleted_at FROM faculty_schedules WHERE student_id = ? ORDER BY id ASC',
                [id]
            );
            evidence[id].faculty_assignment_history = facultySchedules;
        }

        console.log(JSON.stringify(evidence, null, 2));

        await db.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
