require('dotenv').config({ path: '../backend/.env' });
const db = require('../backend/config/db');

async function checkSchema() {
    try {
        const [mfi] = await db.query('DESCRIBE mentor_faculty_interactions');
        console.log('--- mentor_faculty_interactions ---');
        console.table(mfi);

        const [fil] = await db.query('DESCRIBE faculty_interaction_logs');
        console.log('--- faculty_interaction_logs ---');
        console.table(fil);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
