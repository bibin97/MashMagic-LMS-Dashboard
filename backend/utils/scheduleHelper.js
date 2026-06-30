/**
 * Centralized utility to generate the Academic Schedule query.
 * Enforces the policy that `timetable` is the absolute source of truth for scheduling,
 * while `faculty_sessions` is strictly used for execution data (minutes taken, locked).
 */
const getUnifiedAcademicScheduleQuery = (roleFilter = '', additionalJoins = '') => {
    return `
        SELECT id, timetable_id, faculty_id, student_id, date, start_time, end_time, duration,
               topic, status, faculty_name, student_name, meeting_link, minutes_taken, 
               minutes_locked, session_number, mentor_id
        FROM (
            -- SOURCE 1: Timetable (Source of Truth)
            SELECT 
                COALESCE(fs.id, t.id) as id,
                t.id as timetable_id,
                t.faculty_id,
                t.student_id,
                t.date,
                t.start_time,
                t.end_time,
                t.duration,
                COALESCE(t.chapter, t.session_type, t.subject, 'General Session') as topic,
                COALESCE(fs.status, t.status) as status,
                COALESCE(t.faculty_name, f.name, 'TBD') as faculty_name,
                s.name as student_name,
                s.meeting_link,
                fs.minutes_taken,
                fs.minutes_locked,
                t.session_number,
                s.mentor_id
            FROM timetable t
            LEFT JOIN users f ON t.faculty_id = f.id
            JOIN students s ON t.student_id = s.id
            LEFT JOIN faculty_sessions fs ON t.id = fs.timetable_id
            ${additionalJoins}
            WHERE (t.is_deleted IS NULL OR t.is_deleted = 0)
            ${roleFilter}

            UNION ALL

            -- SOURCE 2: Independent Ad-hoc Faculty Sessions
            SELECT 
                fs.id as id,
                fs.timetable_id,
                fs.faculty_id,
                sa.student_id,
                fs.date,
                fs.start_time,
                fs.end_time,
                fs.duration,
                fs.topic,
                fs.status,
                u.name as faculty_name,
                s.name as student_name,
                s.meeting_link,
                fs.minutes_taken,
                fs.minutes_locked,
                NULL as session_number,
                s.mentor_id
            FROM faculty_sessions fs
            LEFT JOIN users u ON fs.faculty_id = u.id AND u.role = 'faculty'
            LEFT JOIN session_attendance sa ON fs.id = sa.session_id
            LEFT JOIN students s ON sa.student_id = s.id
            ${additionalJoins}
            WHERE fs.timetable_id IS NULL AND (fs.is_deleted IS NULL OR fs.is_deleted = 0)
            ${roleFilter}
        ) combined_schedules
        ORDER BY date DESC, start_time ASC
    `;
};

module.exports = {
    getUnifiedAcademicScheduleQuery
};
