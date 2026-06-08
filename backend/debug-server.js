const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.get('/debug', async (req, res) => {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [desc] = await db.query('DESCRIBE faculties');
        const [users] = await db.query('SELECT * FROM users WHERE name IN ("Afna", "Pooja Sunil", "shabna")');
        const [facs] = await db.query('SELECT * FROM faculties WHERE name IN ("Afna", "Pooja Sunil", "shabna")');
        
        await db.end();
        res.json({ desc, users, facs });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(5005, () => console.log('Listening on 5005'));
