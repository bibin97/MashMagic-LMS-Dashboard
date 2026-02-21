const express = require('express');
const router = express.Router();
const {
    getDropdownData,
    registerStudent,
    registerFaculty,
    registerCounselor
} = require('../controllers/academicHeadController');

// All protected routes (you would normally add middleware here)

router.get('/dropdowns', getDropdownData);
router.post('/register-student', registerStudent);
router.post('/register-faculty', registerFaculty);
router.post('/register-counselor', registerCounselor);

module.exports = router;
