const mysql = require('mysql2/promise');
async function run() {
    try {
        const pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'mashmagic'
        });
        const [rows] = await pool.query("SELECT id, name, subjects_json FROM students WHERE name LIKE '%Amina%'");
        console.log(JSON.stringify(rows, null, 2));
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
run();
