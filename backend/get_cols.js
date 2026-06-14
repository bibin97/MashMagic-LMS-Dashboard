require('dotenv').config();
const db = require('./config/db.js');

db.query('SHOW COLUMNS FROM users').then(([rows]) => {
  require('fs').writeFileSync('columns.json', JSON.stringify(rows, null, 2));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
