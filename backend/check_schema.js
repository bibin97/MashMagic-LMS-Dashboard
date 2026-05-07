const pool = require('./config/db');

async function check() {
    try {
        const [silCols] = await pool.query('DESCRIBE student_interaction_logs');
        console.log('student_interaction_logs:');
        console.table(silCols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default, Extra: c.Extra })));

        const [filCols] = await pool.query('DESCRIBE faculty_interaction_logs');
        console.log('faculty_interaction_logs:');
        console.table(filCols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default, Extra: c.Extra })));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

check();
