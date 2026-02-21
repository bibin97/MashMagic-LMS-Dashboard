const db = require('./config/db');
db.query(`CREATE TABLE IF NOT EXISTS admin_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message VARCHAR(255) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`).then(() => {
    console.log("admin_notifications table created");
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
