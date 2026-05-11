const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'MashMagic2026!',
    database: 'mashmagic'
});

connection.query('SELECT id, name, email FROM students WHERE name LIKE "%Aithel%"', (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('STUDENTS FOUND:');
    console.log(JSON.stringify(rows, null, 2));

    connection.query('SELECT id, name, email, role FROM users WHERE name LIKE "%Aithel%"', (err2, userRows) => {
        if (err2) {
            console.error(err2);
            process.exit(1);
        }
        console.log('\nUSERS FOUND:');
        console.log(JSON.stringify(userRows, null, 2));
        connection.end();
        process.exit(0);
    });
});
