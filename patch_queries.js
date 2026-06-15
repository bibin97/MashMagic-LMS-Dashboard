const fs = require('fs');
const path = require('path');

const dir = 'backend/controllers/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // We will do a generic replacement for SELECT 1 FROM faculty_schedules fs WHERE ...
    // Most queries are like:
    // EXISTS (SELECT 1 FROM faculty_schedules fs WHERE fs.student_id = s.id AND fs.faculty_id = ?)
    
    content = content.replace(
        /SELECT 1 FROM faculty_schedules fs WHERE /g, 
        'SELECT 1 FROM faculty_schedules fs WHERE (fs.is_deleted IS NULL OR fs.is_deleted = 0) AND '
    );

    // Also for normal joins/selects:
    // FROM faculty_schedules fs JOIN faculties u ON fs.faculty_id = u.id WHERE fs.student_id = s.id
    content = content.replace(
        /FROM faculty_schedules fs\s+JOIN faculties u ON fs\.faculty_id = u\.id\s+WHERE /g,
        'FROM faculty_schedules fs JOIN faculties u ON fs.faculty_id = u.id WHERE (fs.is_deleted IS NULL OR fs.is_deleted = 0) AND '
    );

    if (originalContent !== content) {
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + file);
    }
});

// For timetable
files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    content = content.replace(
        /FROM timetable WHERE /g,
        'FROM timetable WHERE (is_deleted IS NULL OR is_deleted = 0) AND '
    );

    // Some use aliases
    content = content.replace(
        /FROM timetable mt WHERE /g,
        'FROM timetable mt WHERE (mt.is_deleted IS NULL OR mt.is_deleted = 0) AND '
    );
    
    content = content.replace(
        /FROM timetable tt WHERE /g,
        'FROM timetable tt WHERE (tt.is_deleted IS NULL OR tt.is_deleted = 0) AND '
    );

    if (originalContent !== content) {
        fs.writeFileSync(filePath, content);
        console.log('Updated timetable queries in ' + file);
    }
});
