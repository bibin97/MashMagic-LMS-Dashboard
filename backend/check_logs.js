const pool = require('./config/db');

async function check() {
    try {
        console.log('--- student_interaction_logs ---');
        const [silCols] = await pool.query('DESCRIBE student_interaction_logs');
        console.table(silCols.map(c => ({ Field: c.Field, Type: c.Type, Default: c.Default })));

        const [silRecent] = await pool.query('SELECT created_at, date, mentor_id, student_id FROM student_interaction_logs ORDER BY created_at DESC LIMIT 5');
        console.log('Recent student logs:', silRecent);

        console.log('--- faculty_interaction_logs ---');
        const [filCols] = await pool.query('DESCRIBE faculty_interaction_logs');
        console.table(filCols.map(c => ({ Field: c.Field, Type: c.Type, Default: c.Default })));

        const [filRecent] = await pool.query('SELECT created_at, date, mentor_id, student_id FROM faculty_interaction_logs ORDER BY created_at DESC LIMIT 5');
        console.log('Recent faculty logs:', filRecent);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

check();
