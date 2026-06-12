const db = require('./config/db');

const studentsData = [
  { name: 'Saif', total_hours: 72, subjects: [{ name: 'Arabic', consumed: 36, allocated: 38 }, { name: 'Mathematics', consumed: 34, allocated: 34 }] },
  { name: 'Aman', total_hours: 72, subjects: [{ name: 'Hindi', consumed: 13, allocated: 24 }, { name: 'Malayalam', consumed: 7, allocated: 24 }, { name: 'Arabic', consumed: 9, allocated: 24 }] },
  { name: 'dareen', total_hours: 24, subjects: [{ name: 'Mathematics', consumed: 2, allocated: 5 }, { name: 'Hindi', consumed: 2, allocated: 4 }, { name: 'Science', consumed: 3, allocated: 4 }, { name: 'Social', consumed: 1, allocated: 5 }, { name: 'English', consumed: 0, allocated: 3 }, { name: 'Arabic', consumed: 1.5, allocated: 3 }] },
  { name: 'godwin', total_hours: 20, subjects: [{ name: 'Accountancy', consumed: 2, allocated: 7 }, { name: 'Economics', consumed: 0, allocated: 6 }, { name: 'Ip', consumed: 0, allocated: 7 }] },
  { name: 'Hamdan', total_hours: 24, subjects: [{ name: 'Hindi', consumed: 7, allocated: 14 }, { name: 'Mathematics', consumed: 3.5, allocated: 10 }] },
  { name: 'nathan jobby', total_hours: 64, subjects: [{ name: 'Mathematics', consumed: 25, allocated: 31 }, { name: 'Physics', consumed: 4, allocated: 11 }, { name: 'Chemistry', consumed: 3, allocated: 11 }, { name: 'Biology', consumed: 4, allocated: 11 }] },
  { name: 'Jai Sanker', total_hours: 216, subjects: [{ name: 'Social', consumed: 16, allocated: 75 }, { name: 'Science', consumed: 11, allocated: 72 }, { name: 'English', consumed: 12, allocated: 72 }] },
  { name: 'ragapriya', total_hours: 216, subjects: [{ name: 'Physics', consumed: 8, allocated: 54 }, { name: 'Mathematics', consumed: 19, allocated: 54 }, { name: 'Chemistry', consumed: 7, allocated: 54 }, { name: 'Biology', consumed: 8, allocated: 54 }] },
  { name: 'jazlyn', total_hours: 16, subjects: [{ name: 'French', consumed: 2, allocated: 8 }, { name: 'Arabic', consumed: 3, allocated: 8 }] },
  { name: 'rayan', total_hours: 30, subjects: [{ name: 'Malayalam', consumed: 3, allocated: 15 }, { name: 'English', consumed: 1, allocated: 15 }] },
  { name: 'rihan', total_hours: 30, subjects: [{ name: 'Malayalam', consumed: 3, allocated: 15 }, { name: 'English', consumed: 1, allocated: 15 }] }
];

async function run() {
  try {
    for (const data of studentsData) {
      // Find student
      const [rows] = await db.query('SELECT id, name FROM students WHERE name LIKE ?', ['%' + data.name + '%']);
      if (rows.length === 0) {
        console.log('Student not found:', data.name);
        continue;
      }
      
      const studentId = rows[0].id;
      console.log('Found', data.name, 'as ID', studentId);
      
      // Update total hours in students table
      await db.query('UPDATE students SET total_hours = ? WHERE id = ?', [data.total_hours, studentId]);
      
      // Clear existing records for this student in student_subjects
      await db.query('DELETE FROM student_subjects WHERE student_id = ?', [studentId]);
      
      // Insert subjects
      for (const subj of data.subjects) {
        await db.query(`
          INSERT INTO student_subjects (student_id, subject_name, allocated_hours, historical_consumed_hours)
          VALUES (?, ?, ?, ?)
        `, [studentId, subj.name, subj.allocated, subj.consumed]);
      }
      console.log('Updated subjects for', data.name);
    }
    
    console.log('All historical data imported successfully.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
