const mysql = require('mysql2/promise');

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'MashMagic2026!',
            database: 'mashmagic'
        });

        const studentIds = [205, 206, 471, 479];
        console.log("student_id | timetable_count | faculty_schedules_count | faculty_sessions_count");
        for (const id of studentIds) {
            const [tt] = await connection.query('SELECT COUNT(*) as count FROM timetable WHERE student_id = ? AND (is_deleted IS NULL OR is_deleted = 0)', [id]);
            const [fs] = await connection.query('SELECT COUNT(*) as count FROM faculty_schedules WHERE student_id = ? AND (is_deleted IS NULL OR is_deleted = 0)', [id]);
            const [fses] = await connection.query(`
                SELECT COUNT(*) as count 
                FROM faculty_sessions fs
                LEFT JOIN session_attendance sa ON fs.id = sa.session_id
                LEFT JOIN timetable t ON fs.timetable_id = t.id
                WHERE (sa.student_id = ? OR t.student_id = ?) AND (fs.is_deleted IS NULL OR fs.is_deleted = 0)
            `, [id, id]);
            console.log(`${id.toString().padEnd(10)} | ${tt[0].count.toString().padEnd(15)} | ${fs[0].count.toString().padEnd(23)} | ${fses[0].count.toString().padEnd(22)}`);
        }
        await connection.end();
    } catch(e) {
        console.error("DB connection error:", e.message);
        try {
            const connection2 = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: 'MashMagic2026!',
                database: 'mashmagic'
            });
            console.log("Connected using localhost");
            await connection2.end();
        } catch(e2) {
            console.error("Localhost error:", e2.message);
        }
    }
}
run();
