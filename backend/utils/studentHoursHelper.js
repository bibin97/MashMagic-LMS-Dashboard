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
        const total_hours = parseInt(s.total_hours) || 0;
        const total_paid = parseFloat(s.total_paid) || 0;
        
        const current_installment_start_hours = parseFloat(s.current_installment_start_hours) || 0;
        
        let total_entitled_hours = 0;
        if (total_fees > 0) {
            // Whatever percentage of total fees they paid, they are entitled to that percentage of total hours overall
            total_entitled_hours = (total_paid / total_fees) * total_hours;
        } else if (total_fees === 0 && total_paid > 0) {
            total_entitled_hours = total_hours;
        }

        const total_lifetime_consumed_mins = consumedMap[s.id] || 0;
        const total_lifetime_consumed_hours = total_lifetime_consumed_mins / 60;
        
        // Cycle Limit is the total entitled hours minus whatever they had already consumed before this last payment.
        // This gives us the size of the "bucket" of hours they have for this cycle (including any carried over hours).
        let cycle_limit_hours = total_entitled_hours - current_installment_start_hours;
        if (cycle_limit_hours < 0) cycle_limit_hours = 0;

        // Consumed hours within THIS cycle
        let cycle_consumed_hours = total_lifetime_consumed_hours - current_installment_start_hours;
        if (cycle_consumed_hours < 0) cycle_consumed_hours = 0;
        
        let payment_alert_level = 'None';
        let payment_threshold_percentage = 0;

        if (total_fees === 0) {
            // User requested: "fees onnum illa... fees base ahnu vendathu" -> If no fees, no blinking.
            payment_alert_level = 'None';
            payment_threshold_percentage = 0;
        } else if (cycle_limit_hours > 0) {
            payment_threshold_percentage = (cycle_consumed_hours / cycle_limit_hours) * 100;
            if (payment_threshold_percentage >= 90) {
                payment_alert_level = 'Critical';
            } else if (payment_threshold_percentage >= 70) {
                payment_alert_level = 'Warning';
            }
        } else if (cycle_consumed_hours > 0) {
            // Consumed hours but 0 limit in current cycle AND total_fees > 0
            payment_alert_level = 'Critical';
            payment_threshold_percentage = 100;
        }

        return {
            ...s,
            paid_hours: parseFloat(cycle_limit_hours.toFixed(2)),
            consumed_hours: parseFloat(cycle_consumed_hours.toFixed(2)),
            payment_alert_level,
            payment_threshold_percentage: parseFloat(payment_threshold_percentage.toFixed(2)),
            total_lifetime_consumed_hours: parseFloat(total_lifetime_consumed_hours.toFixed(2))
        };
    });
};

module.exports = { calculateStudentHours };
