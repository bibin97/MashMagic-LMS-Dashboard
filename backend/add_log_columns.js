const db = require('./config/db');

async function addColumns() {
    try {
        await db.query(`
            ALTER TABLE student_interaction_logs 
            ADD COLUMN homework_status VARCHAR(50) DEFAULT NULL,
            ADD COLUMN homework_difficulty VARCHAR(50) DEFAULT NULL,
            ADD COLUMN revision_quality VARCHAR(50) DEFAULT NULL
        `);
        console.log('Columns added successfully');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist');
        } else {
            console.error('Error adding columns:', err);
        }
    } finally {
        process.exit(0);
    }
}

addColumns();
