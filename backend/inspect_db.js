const mysql = require('mysql2/promise');

const credentials = [
    { user: 'root', password: 'MashMagic2026!' },
    { user: 'mashmagic', password: 'MashMagic2026!' },
    { user: 'admin', password: 'MashMagic2026!' },
    { user: 'root', password: 'Mashmagic2026!' },
    { user: 'root', password: '' },
    { user: 'mashmagic', password: '' },
    { user: 'mashmagic', password: 'mashmagic' },
    { user: 'root', password: 'root' },
];

async function inspect() {
    for (const cred of credentials) {
        try {
            console.log(`Trying User: "${cred.user}", Password: "${cred.password}"`);
            const connection = await mysql.createConnection({
                host: '127.0.0.1',
                user: cred.user,
                password: cred.password,
                database: 'mashmagic'
            });
            
            console.log(`SUCCESS! Connected with User: "${cred.user}", Password: "${cred.password}"`);
            const [tables] = await connection.query('SHOW TABLES');
            console.log('Tables:', tables.map(t => Object.values(t)[0]));
            await connection.end();
            return;
        } catch (e) {
            console.log(`Failed: ${e.message}`);
        }
    }
}

inspect();
