const mysql = require('e:/my works/MashMagic-LMS-Dashboard/backend/node_modules/mysql2');

const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'MashMagic2026!',
    database: 'mashmagic'
}).promise();

async function checkData() {
    try {
        const [reports] = await db.query('SHOW COLUMNS FROM mentor_session_reports');
        console.log('--- mentor_session_reports columns ---');
        console.table(reports.map(r => r.Field));

        const [exams] = await db.query('SHOW COLUMNS FROM student_exams');
        console.log('--- student_exams columns ---');
        console.table(exams.map(r => r.Field));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
