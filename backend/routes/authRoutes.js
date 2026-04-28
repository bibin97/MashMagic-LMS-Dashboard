const express = require('express');
const router = express.Router();
const { register, login, mentorSignup, facultySignup, checkSuperAdminExists, updateProfilePic } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/signup/mentor', mentorSignup);
router.post('/signup/faculty', facultySignup);
router.get('/check-super-admin', checkSuperAdminExists);
router.put('/update-profile-pic', requireAuth, updateProfilePic);

module.exports = router;

module.exports = router;
