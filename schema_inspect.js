const db = require('./backend/config/db');

async function listTables() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        console.log('--- DATABASE TABLES ---');
        console.log(JSON.stringify(tables, null, 2));

        for(const tableObj of tables) {
            const tableName = Object.values(tableObj)[0];
            try {
                const [columns] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
                console.log(`\n--- ${tableName} COLUMNS ---`);
                console.table(columns.map(c => ({ Field: c.Field, Type: c.Type })));
            } catch (e) {
                console.log(`Could not show columns for ${tableName}: ${e.message}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error.message);
        process.exit(1);
    }
}

listTables();
