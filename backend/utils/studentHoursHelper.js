const calculateStudentHours = async (students, db) => {
    if (!students || students.length === 0) return students;

    const studentIds = students.map(s => s.id);
    
    // Fetch all completed timetable sessions for these students
    const [sessions] = await db.query(
        'SELECT student_id, duration FROM timetable WHERE status = "Completed" AND student_id IN (?)',
        [studentIds]
    );

    // Group consumed minutes by student
    const consumedMap = {};
    studentIds.forEach(id => consumedMap[id] = 0);

    sessions.forEach(session => {
        const dur = session.duration || '';
        let mins = 0;
        const hMatch = dur.match(/(\d+)h/);
        const mMatch = dur.match(/(\d+)m/);
        
        if (hMatch) mins += parseInt(hMatch[1]) * 60;
        if (mMatch) mins += parseInt(mMatch[1]);
        
        consumedMap[session.student_id] += mins;
    });

    // Augment students array
    return students.map(s => {
        const total_fees = parseFloat(s.total_fees) || 0;
        const total_paid = parseFloat(s.total_paid) || 0;
        const total_hours = parseInt(s.total_hours) || 0;

        let paid_hours = 0;
        if (total_fees > 0) {
            paid_hours = (total_paid / total_fees) * total_hours;
        } else if (total_fees === 0 && total_paid > 0) {
             paid_hours = total_hours; // fully paid if fees 0 but paid > 0? Edge case
        }

        const consumed_mins = consumedMap[s.id] || 0;
        const consumed_hours = consumed_mins / 60;

        let payment_alert_level = 'None';
        let payment_threshold_percentage = 0;

        if (paid_hours > 0) {
            payment_threshold_percentage = (consumed_hours / paid_hours) * 100;
            if (payment_threshold_percentage >= 90) {
                payment_alert_level = 'Critical';
            } else if (payment_threshold_percentage >= 70) {
                payment_alert_level = 'Warning';
            }
        } else if (consumed_hours > 0) {
            // Consumed hours but 0 paid hours
            payment_alert_level = 'Critical';
            payment_threshold_percentage = 100;
        }

        return {
            ...s,
            paid_hours: parseFloat(paid_hours.toFixed(2)),
            consumed_hours: parseFloat(consumed_hours.toFixed(2)),
            payment_alert_level,
            payment_threshold_percentage: parseFloat(payment_threshold_percentage.toFixed(2))
        };
    });
};

module.exports = { calculateStudentHours };
