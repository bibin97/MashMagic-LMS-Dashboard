const db = require('./config/db'); async function run() { try { const [rows] = await db.query('DESCRIBE faculties'); console.log(rows); } catch (e) { console.error(e); } process.exit(0); } run();
