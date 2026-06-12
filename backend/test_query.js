const db = require('./config/db');
async function run() {
  try {
    const [rows] = await db.query('SELECT id, name, total_hours FROM students WHERE name LIKE "Joel%"');
    console.log(rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
