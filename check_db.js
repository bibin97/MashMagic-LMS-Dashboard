const pool = require('./backend/config/db');
async function check() {
    try {
        const [rows] = await pool.query('DESCRIBE users');
        const roleCol = rows.find(r => r.Field === 'role');
        console.log('Role column type is:', roleCol.Type);
    } catch(e) {
        console.log(e.message);
    }
    process.exit(0);
}
check();
