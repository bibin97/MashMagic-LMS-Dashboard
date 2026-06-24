const db = require('../config/db');

async function logVerificationFailure(conn, action, entityId, details) {
    try {
        await conn.query("INSERT INTO audit_logs (action, entity_id, details) VALUES (?, ?, ?)", 
        [action, entityId, details]);
    } catch(e) { /* non-blocking */ }
}

async function verifyStudentSave(conn, studentId, payload) {
    const [rows] = await conn.query('SELECT * FROM students WHERE id = ?', [studentId]);
    if (rows.length === 0) {
        throw new Error('Save Verification Failed: Record not found in database after insert/update.');
    }
    
    const dbRecord = rows[0];
    const missingFields = [];
    
    for (const [key, expectedVal] of Object.entries(payload)) {
        if (expectedVal !== undefined && expectedVal !== null && expectedVal !== '') {
            if (dbRecord[key] === null || dbRecord[key] === undefined || dbRecord[key] === '') {
                missingFields.push(key);
            }
        }
    }

    if (missingFields.length > 0) {
        const msg = \`Save Verification Failed: The following mandatory fields failed to save: \${missingFields.join(', ')}\`;
        await logVerificationFailure(conn, 'STUDENT_VERIFICATION_FAILED', studentId, msg);
        throw new Error(msg);
    }
}

async function verifyFacultySchedules(conn, studentId, expectedCount) {
    const [[result]] = await conn.query('SELECT COUNT(id) as count FROM faculty_schedules WHERE student_id = ? AND (is_deleted IS NULL OR is_deleted = 0)', [studentId]);
    if (result.count !== expectedCount) {
        const msg = \`Verification Failed: Expected \${expectedCount} faculty_schedules but found \${result.count}.\`;
        await logVerificationFailure(conn, 'FACULTY_SCHEDULE_VERIFICATION_FAILED', studentId, msg);
        throw new Error(msg);
    }
}

async function verifyTimetableSave(conn, studentId, expectedMinCount) {
    const [[result]] = await conn.query('SELECT COUNT(id) as count FROM timetable WHERE student_id = ? AND (is_deleted IS NULL OR is_deleted = 0)', [studentId]);
    if (result.count < expectedMinCount) {
        const msg = \`Verification Failed: Expected at least \${expectedMinCount} timetable rows but found \${result.count}.\`;
        await logVerificationFailure(conn, 'TIMETABLE_VERIFICATION_FAILED', studentId, msg);
        throw new Error(msg);
    }
}

async function verifyAcademicSchedules(conn, studentId, expectedCount) {
    // Academic Schedules refer to faculty_sessions in this DB schema.
    const [[result]] = await conn.query('SELECT COUNT(id) as count FROM faculty_sessions WHERE (is_deleted IS NULL OR is_deleted = 0) AND timetable_id IN (SELECT id FROM timetable WHERE student_id = ?)', [studentId]);
    if (result.count !== expectedCount) {
        const msg = \`Verification Failed: Expected \${expectedCount} academic schedules but found \${result.count}.\`;
        await logVerificationFailure(conn, 'ACADEMIC_SCHEDULE_VERIFICATION_FAILED', studentId, msg);
        throw new Error(msg);
    }
}

module.exports = {
    logVerificationFailure,
    verifyStudentSave,
    verifyFacultySchedules,
    verifyTimetableSave,
    verifyAcademicSchedules
};
