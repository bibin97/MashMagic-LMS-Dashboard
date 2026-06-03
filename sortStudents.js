const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let changes = 0;
walkDir('frontend/src/pages', (f) => {
    if (!f.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    
    // Replace setStudents(res.data.data)
    content = content.replace(/setStudents\((res|response|studentsRes|stdRes)\.data\.data\);/g, (match, p1) => {
        return `setStudents((${p1}.data.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')));`;
    });

    // Replace setStudents(res.data.data || [])
    content = content.replace(/setStudents\((res|response|stdRes)\.data\.data \|\| \[\]\);/g, (match, p1) => {
        return `setStudents((${p1}.data.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')));`;
    });

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Modified', f);
        changes++;
    }
});
console.log('Total files modified:', changes);
