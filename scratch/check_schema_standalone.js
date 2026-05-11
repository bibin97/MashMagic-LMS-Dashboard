const mysql = require('mysql2/promise');

async function checkSchema() {
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'MashMagic2026!',
            database: 'mashmagic'
        });

        const [usersCols] = await connection.query('SHOW COLUMNS FROM users');
        console.log('USERS COLUMNS:');
        usersCols.forEach(c => console.log(` - ${c.Field}`));

        const [studentsCols] = await connection.query('SHOW COLUMNS FROM students');
        console.log('\nSTUDENTS COLUMNS:');
        studentsCols.forEach(c => console.log(` - ${c.Field}`));

        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
