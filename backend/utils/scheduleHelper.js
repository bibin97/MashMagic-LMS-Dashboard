/**
 * Centralized utility to generate the Academic Schedule query.
 * Enforces the policy that `timetable` is the absolute source of truth for scheduling,
 * while `faculty_sessions` is strictly used for execution data (minutes taken, locked).
 */
const getUnifiedAcademicScheduleQuery = (roleFilter = '', additionalJoins = '') => {
    return `
        SELECT id, timetable_id, faculty_id, student_id, date, start_time, end_time, duration,
               topic, subject, session_type, status, faculty_name, student_name, meeting_link, minutes_taken, 
               minutes_locked, session_number, mentor_id,
               reminder_1, reminder_1_remark, reminder_2, reminder_2_remark, reminder_3, reminder_3_remark
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
                COALESCE(t.chapter, 'General Session') as topic,
                t.subject,
                t.session_type,
                COALESCE(fs.status, t.status) as status,
                COALESCE(NULLIF(t.faculty_name, ''), f.name, f2.name, 'TBD') as faculty_name,
                s.name as student_name,
                COALESCE(NULLIF(t.meet_link, ''), NULLIF(s.meeting_link, '')) as meeting_link,
                fs.minutes_taken,
                fs.minutes_locked,
                t.session_number,
                s.mentor_id,
                COALESCE(fs.reminder_1, 0) as reminder_1,
                fs.reminder_1_remark,
                COALESCE(fs.reminder_2, 0) as reminder_2,
                fs.reminder_2_remark,
                COALESCE(fs.reminder_3, 0) as reminder_3,
                fs.reminder_3_remark
            FROM timetable t
            LEFT JOIN users f ON t.faculty_id = f.id
            LEFT JOIN faculties f2 ON t.faculty_id = f2.id
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
                NULL as subject,
                NULL as session_type,
                fs.status,
                u.name as faculty_name,
                s.name as student_name,
                s.meeting_link,
                fs.minutes_taken,
                fs.minutes_locked,
                NULL as session_number,
                s.mentor_id,
                COALESCE(fs.reminder_1, 0) as reminder_1,
                fs.reminder_1_remark,
                COALESCE(fs.reminder_2, 0) as reminder_2,
                fs.reminder_2_remark,
                COALESCE(fs.reminder_3, 0) as reminder_3,
                fs.reminder_3_remark
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
