const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const db = require('../backend/config/db');

async function checkSchema() {
    try {
        const [usersCols] = await db.query('SHOW COLUMNS FROM users');
        console.log('USERS COLUMNS:');
        usersCols.forEach(c => console.log(` - ${c.Field}`));

        const [studentsCols] = await db.query('SHOW COLUMNS FROM students');
        console.log('\nSTUDENTS COLUMNS:');
        studentsCols.forEach(c => console.log(` - ${c.Field}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
