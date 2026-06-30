const db = require('./config/db');

const generateStudentGrowthReport = async (id) => {
    try {
        console.log("Fetching student info...");
        const [studentRows] = await db.query(`
            SELECT s.*, u.name as mentor_name 
            FROM students s 
            LEFT JOIN users u ON s.mentor_id = u.id AND u.role = 'mentor'
            WHERE s.id = ?`, [id]
        );
        if (studentRows.length === 0) return console.log("Student not found");
        const student = studentRows[0];

        console.log("Fetching Exams...");
        const [exams] = await db.query('SELECT subject, exam_name, score, total_marks FROM student_exams WHERE student_id = ?', [id]);
        
        console.log("Fetching Subjects...");
        const [subjects] = await db.query('SELECT subject_name, allocated_hours, historical_consumed_hours FROM student_subjects WHERE student_id = ?', [id]);

        console.log("Fetching Parent Meetings...");
        const [meetings] = await db.query('SELECT notes, status FROM ah_parent_meetings WHERE student_id = ? ORDER BY date DESC LIMIT 3', [id]);
        
        // Calculate Subject Progress
        let totalAllocated = 0;
        let totalCompleted = 0;
        const subjectProgress = subjects.map(sub => {
            const alloc = parseFloat(sub.allocated_hours || 0);
            const comp = parseFloat(sub.historical_consumed_hours || 0);
            totalAllocated += alloc;
            totalCompleted += comp;
            return {
                subject: sub.subject_name,
                progress_percentage: alloc > 0 ? Math.round((comp / alloc) * 100) : 0
            };
        });
        const overallSubjectProgress = totalAllocated > 0 ? Math.round((totalCompleted / totalAllocated) * 100) : 0;

        // Calculate Assessment Performance
        let totalMarksObtained = 0;
        let maxPossibleMarks = 0;
        const subjectScores = {};
        
        exams.forEach(ex => {
            const s = parseFloat(ex.score || 0);
            const t = parseFloat(ex.total_marks || 100);
            totalMarksObtained += s;
            maxPossibleMarks += t;
            
            const sub = ex.subject || 'General';
            if (!subjectScores[sub]) subjectScores[sub] = { marks: 0, total: 0 };
            subjectScores[sub].marks += s;
            subjectScores[sub].total += t;
        });
        
        const overallAssessmentScore = maxPossibleMarks > 0 ? Math.round((totalMarksObtained / maxPossibleMarks) * 100) : 0;
        
        // Determine Strengths and Areas for Improvement
        let strengths = [];
        let areasForImprovement = [];
        
        Object.entries(subjectScores).forEach(([sub, data]) => {
           const pct = (data.marks / data.total) * 100;
           if (pct >= 75) strengths.push(sub);
           if (pct < 50) areasForImprovement.push(sub);
        });
        
        if (strengths.length === 0 && subjectProgress.length > 0) {
            const bestSub = [...subjectProgress].sort((a,b) => b.progress_percentage - a.progress_percentage)[0];
            if (bestSub.progress_percentage >= 50) strengths.push(bestSub.subject);
        }
        if (areasForImprovement.length === 0 && subjectProgress.length > 0) {
            const worstSub = [...subjectProgress].sort((a,b) => a.progress_percentage - b.progress_percentage)[0];
            if (worstSub.progress_percentage < 30) areasForImprovement.push(worstSub.subject);
        }
        
        if (strengths.length === 0) strengths.push('Consistent participation');
        if (areasForImprovement.length === 0) areasForImprovement.push('Time management in exams');

        const attendancePct = parseFloat(student.attendance_percentage || 0);
        const overallGrowth = Math.round((attendancePct * 0.3) + (overallSubjectProgress * 0.3) + (overallAssessmentScore * 0.4));
        
        let perfStatus = 'Needs Improvement';
        if (overallGrowth >= 85) perfStatus = 'Excellent';
        else if (overallGrowth >= 70) perfStatus = 'Good';
        else if (overallGrowth >= 50) perfStatus = 'Average';
        
        const growthTrend = overallGrowth >= 70 ? 'Positive upward trajectory with strong engagement.' : 'Requires closer monitoring and targeted intervention.';

        const reportData = {
            student_name: student.name,
            grade: student.grade || student.batch,
            mentor: student.mentor_name || 'Unassigned',
            attendance_percentage: attendancePct,
            subject_progress: subjectProgress,
            overall_subject_progress: overallSubjectProgress,
            assessment_performance: overallAssessmentScore,
            overall_growth_percentage: overallGrowth,
            performance_status: perfStatus,
            strengths,
            areas_for_improvement: areasForImprovement,
            mentor_remarks: student.performance_status_reason || 'Student is making steady progress.',
            parent_meeting_summary: meetings.length > 0 ? meetings[0].notes : 'No recent meetings.',
            growth_trend: growthTrend,
            generated_at: new Date().toISOString()
        };

        console.log("Saving report...");
        await db.query(
            'INSERT INTO student_growth_reports (student_id, report_data) VALUES (?, ?)',
            [id, JSON.stringify(reportData)]
        );
        
        console.log("Updating student status...");
        await db.query('UPDATE students SET performance_status = ? WHERE id = ?', [perfStatus, id]);

        console.log("Done!", reportData);
    } catch (error) {
        console.error("EXACT ERROR:", error);
    } finally {
        process.exit();
    }
};

generateStudentGrowthReport(1);
