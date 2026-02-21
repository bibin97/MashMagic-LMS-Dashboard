const express = require('express');
const router = express.Router();
const { register, login, mentorSignup, facultySignup } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/signup/mentor', mentorSignup);
router.post('/signup/faculty', facultySignup);

module.exports = router;
