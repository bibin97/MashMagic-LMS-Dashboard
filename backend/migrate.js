const db = require('./config/db');
db.query("ALTER TABLE students ADD COLUMN onboarding_status ENUM('pending', 'completed') DEFAULT 'pending'")
    .then(() => {
        console.log("Column added");
        process.exit();
    })
    .catch(err => {
        console.error("Error", err);
        process.exit(1);
    });
