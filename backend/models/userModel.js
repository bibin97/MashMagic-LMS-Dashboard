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
        const {
            name, phone_number = null, place = null, email = null,
            password, role = 'user', status = 'pending',
            registeredBy = null, isApproved = 0, enrollment_type = null, badge = null
        } = userData;
 
        const [result] = await db.query(
            'INSERT INTO users (name, phone_number, place, email, password, role, status, registeredBy, isApproved, isActive, grade, subject, course, hour, mentor_name, faculty_name, next_installment_date, time_table, enrollment_type, badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name, phone_number, place, email, password, role, status, registeredBy, isApproved, status === 'active' ? 1 : 0,
                userData.grade || null, userData.subject || null, userData.course || null, userData.hour || null, userData.mentor_name || null, userData.faculty_name || null, userData.next_installment_date || null, userData.time_table || null,
                enrollment_type, badge
            ]
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
