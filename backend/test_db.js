const db = require('./config/db');

async function test() {
    try {
        let [rows] = await db.query(`
            SELECT 
                subject, 
                term, 
                AVG(marks) as avg_marks, 
                AVG(total) as avg_total,
                (AVG(marks) / AVG(total)) * 100 as percentage
            FROM student_marks
            GROUP BY subject, term
            ORDER BY term DESC
        `);

        if (!rows || rows.length === 0) {
            console.log('student_marks is empty. Trying fallback to student_exams...');
            const [examRows] = await db.query(`
                SELECT 
                    CONCAT('Milestone ', milestone_session) as subject,
                    'Milestone' as term,
                    AVG(CAST(score AS DECIMAL(10,2))) as percentage
                FROM student_exams 
                WHERE status = 'Completed' AND score IS NOT NULL AND score != ''
                GROUP BY milestone_session
                ORDER BY milestone_session ASC
            `);
            rows = examRows;
        }

        if (!rows || rows.length === 0) {
            console.log('student_exams is also empty. Supplying baseline mock data...');
            rows = [
                { subject: 'Milestone 10', term: 'Base', percentage: 75.00 },
                { subject: 'Milestone 20', term: 'Base', percentage: 80.00 },
                { subject: 'Milestone 30', term: 'Base', percentage: 85.00 }
            ];
        }

        console.log('Final Exam Analytics Result:', rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

test();
