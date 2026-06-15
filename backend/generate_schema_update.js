const db = require('./config/db');
const fs = require('fs');

async function generate() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        const dbName = Object.values(tables[0])[0]; // get the first value of the first row object keys
        // Actually, we can just use the key. It's like Tables_in_mashmagic
        
        let sql = '';
        for (const row of tables) {
            const tableName = Object.values(row)[0];
            
            // Check if is_deleted exists
            const [columns] = await db.query(`SHOW COLUMNS FROM ${tableName} LIKE 'is_deleted'`);
            if (columns.length === 0) {
                sql += `ALTER TABLE \`${tableName}\` ADD COLUMN \`is_deleted\` TINYINT(1) DEFAULT 0;\n`;
                sql += `ALTER TABLE \`${tableName}\` ADD COLUMN \`deleted_at\` DATETIME DEFAULT NULL;\n`;
                sql += `ALTER TABLE \`${tableName}\` ADD COLUMN \`deleted_by\` INT DEFAULT NULL;\n\n`;
            }
        }
        
        fs.writeFileSync('phase1_migration.sql', sql);
        console.log('Migration script generated at phase1_migration.sql');
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

generate();
