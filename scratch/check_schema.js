const db = require('e:/my works/MashMagic-LMS-Dashboard/backend/config/db');

async function checkSchema() {
    try {
        const [reports] = await db.query('DESC mentor_session_reports');
        console.log('--- mentor_session_reports ---');
        console.table(reports.map(r => ({ Field: r.Field, Type: r.Type })));

        const [exams] = await db.query('DESC student_exams');
        console.log('--- student_exams ---');
        console.table(exams.map(r => ({ Field: r.Field, Type: r.Type })));

        const [sessions] = await db.query('DESC faculty_sessions');
        console.log('--- faculty_sessions ---');
        console.table(sessions.map(r => ({ Field: r.Field, Type: r.Type })));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkSchema();
