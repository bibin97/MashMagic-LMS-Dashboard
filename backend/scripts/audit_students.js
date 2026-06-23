const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mashmagic'
};

async function runAudit() {
    console.log("Starting Phase 0: Student Field Level Audit...");
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const [students] = await connection.query('SELECT * FROM students');
        
        const requiredFields = [
            'registration_number', 'name', 'email', 'phone_number', 'contact', 
            'admission_date', 'school_name', 'preferred_language', 'country', 
            'grade', 'course', 'subject', 'mentor_id', 'mentor_name', 
            'faculty_id', 'faculty_name', 'enrollment_type', 'badge', 
            'profile_pic', 'roll_number', 'subjects_json', 'syllabus', 
            'onboarding_status', 'status', 'isApproved'
        ];

        let auditReport = [];

        students.forEach(student => {
            let studentAudit = {
                student_id: student.id,
                name: student.name,
                fields: {}
            };

            requiredFields.forEach(field => {
                const value = student[field];
                let classification = 'MISSING';

                if (value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'string' && (value === '[]' || value === '{}' || value.toLowerCase() === 'null')) {
                        classification = 'MISSING';
                    } else {
                        classification = 'PRESENT';
                    }
                }

                if (classification === 'PRESENT' && typeof value === 'string' && value.trim().length < 2) {
                    classification = 'PARTIAL';
                }

                studentAudit.fields[field] = {
                    status: classification,
                    current_value: value
                };
            });

            auditReport.push(studentAudit);
        });

        const reportPath = path.join(__dirname, '../student_audit_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
        console.log(`Audit completed for ${students.length} students. Report saved to student_audit_report.json`);
        
    } catch (e) {
        console.error("Audit failed:", e);
    } finally {
        await connection.end();
    }
}

runAudit();
