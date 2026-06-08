const mysql = require('mysql2/promise');

const getCols = async () => {
    try {
        let pool;
        try {
            pool = mysql.createPool({ host: '127.0.0.1', user: 'root', password: 'MashMagic2026!', database: 'mashmagic' });
            await pool.query('SELECT 1');
        } catch(e) {
            pool = mysql.createPool({ host: '127.0.0.1', user: 'root', password: '', database: 'mashmagic' });
        }
        
        const [rows] = await pool.query('SHOW COLUMNS FROM faculties');
        console.log("FACULTIES COLUMNS:", rows.map(r => r.Field).join(', '));
        const [rows2] = await pool.query('SHOW COLUMNS FROM mentors');
        console.log("MENTORS COLUMNS:", rows2.map(r => r.Field).join(', '));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
getCols();
