const db = require('./config/db');

async function migrate() {
    try {
        console.log("Starting migration: Adding google_meet_link to users and students...");
        
        await db.query(`ALTER TABLE users ADD COLUMN google_meet_link VARCHAR(255) DEFAULT NULL AFTER badge`);
        console.log("Added google_meet_link to users table.");
        
        await db.query(`ALTER TABLE students ADD COLUMN google_meet_link VARCHAR(255) DEFAULT NULL AFTER badge`);
        console.log("Added google_meet_link to students table.");
        
        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    }
}

migrate();
