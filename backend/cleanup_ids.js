const db = require('./config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function cleanupStudentIds() {
    try {
        console.log("Starting Student ID cleanup and synchronization...");
        
        // 1. Fetch all students
        const [students] = await db.query('SELECT id, registration_number, name FROM students');
        
        for (const student of students) {
            let originalReg = student.registration_number || "";
            let cleanedReg = originalReg;

            // If registration_number contains a space, it likely has the name appended
            if (originalReg.includes(' ')) {
                // Keep only the first part (the ID)
                cleanedReg = originalReg.split(' ')[0].trim();
                console.log(`Cleaning ID: "${originalReg}" -> "${cleanedReg}"`);
            }

            // Sync cleaned ID back to registration_number and roll_number
            if (cleanedReg) {
                await db.query(
                    'UPDATE students SET registration_number = ?, roll_number = ? WHERE id = ?',
                    [cleanedReg, cleanedReg, student.id]
                );
            }
        }

        console.log("Cleanup and synchronization complete!");
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

cleanupStudentIds();
