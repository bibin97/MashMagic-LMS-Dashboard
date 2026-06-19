const db = require('./config/db');

async function migrate() {
    try {
        console.log('Adding previous_mentor_name column...');
        await db.query('ALTER TABLE students ADD COLUMN previous_mentor_name VARCHAR(255) NULL;');
        console.log('Adding previous_mentor_id column...');
        await db.query('ALTER TABLE students ADD COLUMN previous_mentor_id INT NULL;');
        console.log('Migration successful.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist.');
        } else {
            console.error(e);
        }
    } finally {
        process.exit();
    }
}

migrate();
