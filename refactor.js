const fs = require('fs');
const path = require('path');

const dirsToScan = [
    path.join(__dirname, 'frontend/src/pages/AOE'),
    path.join(__dirname, 'frontend/src/components/AOE')
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            // Replace paths
            content = content.replace(/\/academic-head/g, '/aoe');
            // Replace text
            content = content.replace(/Academic Head/g, 'AOE');
            content = content.replace(/ACADEMIC HEAD/g, 'AOE');
            // Replace roles
            content = content.replace(/academic_head/g, 'academic_operation_executive');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

dirsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
        processDir(dir);
    }
});

console.log('Refactoring complete.');
