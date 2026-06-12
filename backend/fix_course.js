const mysql = require('mysql2/promise');

async function fixDB() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'mash_lms'
    });

    try {
        const [result] = await connection.execute('UPDATE students SET course_completed = 0');
        console.log(`Updated ${result.affectedRows} students, set course_completed = 0.`);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

fixDB();
