const db = require('../config/db');

const User = {
    // Find user by email or phone number
    findByIdentifier: async (identifier) => {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ? OR phone_number = ?',
            [identifier, identifier]
        );
        return rows[0];
    },

    // Create a new user
    create: async (userData) => {
        const { name, phone_number = null, place = null, email = null, password, role = 'user', status = 'active' } = userData;
        const [result] = await db.query(
            'INSERT INTO users (name, phone_number, place, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, phone_number, place, email, password, role, status]
        );
        return result.insertId;
    },

    // Find user by ID
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }
};

module.exports = User;
