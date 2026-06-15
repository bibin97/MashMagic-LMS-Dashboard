const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Match DELETE FROM table_name WHERE ...
    // E.g., db.query('DELETE FROM timetable WHERE id = ?', [id])
    // -> db.query('UPDATE timetable SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id])

    const regex = /DELETE\s+FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+(.*?)(?=['"`])/gi;
    
    content = content.replace(regex, (match, tableName, condition) => {
        modified = true;
        console.log(`Replacing in ${path.basename(filePath)}: ${tableName}`);
        return `UPDATE ${tableName} SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE ${condition}`;
    });

    // Handle DELETE FROM table_name without WHERE (if any, like delete all notifications)
    const regexAll = /DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?=['"`])/gi;
    content = content.replace(regexAll, (match, tableName) => {
        if (!match.toUpperCase().includes('WHERE') && !match.toUpperCase().includes('UPDATE')) {
            modified = true;
            console.log(`Replacing global delete in ${path.basename(filePath)}: ${tableName}`);
            return `UPDATE ${tableName} SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP`;
        }
        return match;
    });

    // Special case for template literals
    const regexTpl = /DELETE\s+FROM\s+\$\{(.*?)\}\s+WHERE/gi;
    content = content.replace(regexTpl, (match, tableVar) => {
        modified = true;
        console.log(`Replacing dynamic table in ${path.basename(filePath)}`);
        return `UPDATE \${${tableVar}} SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE`;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.js')) {
            processFile(fullPath);
        }
    }
}

scanDir(controllersDir);
console.log("Done refactoring DELETEs");
