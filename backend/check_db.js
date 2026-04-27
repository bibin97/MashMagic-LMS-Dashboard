const pool = require('./config/db');

async function check() {
    try {
        console.log('Checking database...');
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));

        const [usersColumns] = await pool.query('DESCRIBE users');
        console.log('Users Columns:', usersColumns.map(c => c.Field));

        const [studentsColumns] = await pool.query('DESCRIBE students');
        console.log('Students Columns:', studentsColumns.map(c => c.Field));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

check();
