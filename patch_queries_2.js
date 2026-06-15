const fs = require('fs');
const path = require('path');

const dir = 'backend/controllers/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    content = content.replace(
        /SELECT 1 FROM faculty_schedules fs\s*WHERE/g, 
        'SELECT 1 FROM faculty_schedules fs WHERE (fs.is_deleted IS NULL OR fs.is_deleted = 0) AND'
    );
    
    // For queries that don't have WHERE clause:
    content = content.replace(
        /FROM faculty_schedules fs\s*\n\s*WHERE/g,
        'FROM faculty_schedules fs WHERE (fs.is_deleted IS NULL OR fs.is_deleted = 0) AND'
    );

    // If it double-added:
    content = content.replace(
        /WHERE \(fs\.is_deleted IS NULL OR fs\.is_deleted = 0\) AND \s*\(fs\.is_deleted IS NULL OR fs\.is_deleted = 0\) AND/g,
        'WHERE (fs.is_deleted IS NULL OR fs.is_deleted = 0) AND'
    );
    
    content = content.replace(
        /WHERE \s*\(\s*\(fs\.is_deleted IS NULL OR fs\.is_deleted = 0\)\s*AND\s*\(fs\.is_deleted IS NULL OR fs\.is_deleted = 0\)\s*AND/g,
        'WHERE ((fs.is_deleted IS NULL OR fs.is_deleted = 0) AND'
    );

    if (originalContent !== content) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed ' + file);
    }
});
