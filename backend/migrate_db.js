const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

console.log('DB_CONFIG_CHECK:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    passwordLength: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0
});

async function migrate() {
    try {
        console.log('--- Database Restructuring Started ---');

        // 1. Check existing tables
        const [tables] = await db.query('SHOW TABLES');
        const tableList = tables.map(t => Object.values(t)[0]);

        // 2. Create Mentors table if not exists
        if (!tableList.includes('mentors')) {
            await db.query('CREATE TABLE mentors LIKE users');
            console.log('✔ Mentors table structure created.');
        }

        // 3. Create Faculties table if not exists
        if (!tableList.includes('faculties')) {
            await db.query('CREATE TABLE faculties LIKE users');
            console.log('✔ Faculties table structure created.');
        }

        // 4. Move Mentor data
        const [mentorsCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "mentor"');
        if (mentorsCount[0].count > 0) {
            await db.query('INSERT IGNORE INTO mentors SELECT * FROM users WHERE role = "mentor"');
            console.log(`✔ ${mentorsCount[0].count} mentors migrated to mentors table.`);
        }

        // 5. Move Faculty data
        const [facultiesCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "faculty"');
        if (facultiesCount[0].count > 0) {
            await db.query('INSERT IGNORE INTO faculties SELECT * FROM users WHERE role = "faculty"');
            console.log(`✔ ${facultiesCount[0].count} faculties migrated to faculties table.`);
        }

        // 6. Delete moved records from users table
        await db.query('DELETE FROM users WHERE role = "mentor" OR role = "faculty"');
        console.log('✔ Users table cleaned. Mentors and Faculties removed.');

        console.log('--- Database Restructuring Completed Successfully ---');
    } catch (err) {
        console.error('CRITICAL ERROR DURING MIGRATION:', err);
    } finally {
        process.exit();
    }
}

migrate();
