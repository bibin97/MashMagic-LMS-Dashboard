const db = require('../config/db');

async function migrateDatabase(req, res) {
    try {
        const [columns] = await db.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'is_deleted' AND TABLE_SCHEMA = DATABASE()");
        const tables = columns.map(c => c.TABLE_NAME);
        let report = [];

        for (const table of tables) {
            await db.query("CREATE TABLE IF NOT EXISTS deleted_" + table + " LIKE " + table);
            const [moveResult] = await db.query("INSERT IGNORE INTO deleted_" + table + " SELECT * FROM " + table + " WHERE is_deleted = 1");
            const [deleteResult] = await db.query("DELETE FROM " + table + " WHERE is_deleted = 1");

            if (table === 'timetable') {
                try {
                    await db.query("ALTER TABLE timetable DROP INDEX idx_unique_timetable_session");
                } catch (err) {}
            }
            report.push("Table " + table + ": Moved " + moveResult.affectedRows + ", Deleted " + deleteResult.affectedRows);
        }
        res.json({ success: true, message: 'Migration Complete', report });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message, stack: e.stack });
    }
}

module.exports = migrateDatabase;