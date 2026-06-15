const db = require('./config/db');

async function check() {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM faculties');
    console.log('Faculties Table Columns:', cols);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
