const pool = require('./config/db');

async function test() {
    try {
        const [rows] = await pool.query('DESCRIBE students');
        console.log(rows.map(r => r.Field));
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

test();
