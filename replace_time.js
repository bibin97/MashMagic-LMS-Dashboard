const fs = require('fs');
const path = require('path');

const utilsDir = path.join(__dirname, 'frontend/src/utils');
if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
}

const formatTimePath = path.join(utilsDir, 'formatTime.js');
const formatTimeCode = `
export const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const minStr = m !== undefined && !isNaN(m) ? \`:\${m.toString().padStart(2, '0')}\` : ':00';
    return \`\${hour12}\${minStr} \${ampm}\`;
  } catch (e) {
    return timeStr;
  }
};
`;
fs.writeFileSync(formatTimePath, formatTimeCode.trim());
console.log("Created formatTime.js utility.");

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Pattern 1: {x.start_time} - {y.end_time}
            const regex1 = /\{([a-zA-Z0-9_]+)\.start_time\}\s*(?:-|—)\s*\{([a-zA-Z0-9_]+)\.end_time(?:\s*\|\|\s*'[^']*')?\}/g;
            if (regex1.test(content)) {
                content = content.replace(regex1, (match, p1, p2) => {
                    const fallback = match.includes('||') ? match.substring(match.indexOf('||')) : '';
                    const fbStr = fallback ? ` ${fallback}` : '';
                    return `{formatTime12Hour(${p1}.start_time)} - {${p2}.end_time ? formatTime12Hour(${p2}.end_time) : 'N/A'}`;
                });
                modified = true;
            }

            // Pattern 2: just {x.start_time} - {x.end_time}
            // Covered by above, but let's handle cases where it's not a property access, e.g., {start_time} - {end_time}
            const regex2 = /\{start_time\}\s*(?:-|—)\s*\{end_time\}/g;
            if (regex2.test(content)) {
                content = content.replace(regex2, '{formatTime12Hour(start_time)} - {formatTime12Hour(end_time)}');
                modified = true;
            }

            if (modified) {
                // Determine relative path to utils
                const depth = fullPath.substring(path.join(__dirname, 'frontend/src').length).split(path.sep).length - 2;
                const prefix = depth <= 0 ? './' : '../'.repeat(depth);
                const importStat = `import { formatTime12Hour } from '${prefix}utils/formatTime';\n`;

                if (!content.includes('formatTime12Hour')) {
                     // Add import after other imports
                     const lines = content.split('\n');
                     let lastImportIndex = -1;
                     for (let i = 0; i < lines.length; i++) {
                         if (lines[i].startsWith('import ')) {
                             lastImportIndex = i;
                         }
                     }
                     if (lastImportIndex !== -1) {
                         lines.splice(lastImportIndex + 1, 0, importStat);
                     } else {
                         lines.unshift(importStat);
                     }
                     content = lines.join('\n');
                }
                
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'frontend/src'));
console.log("Done replacing time formats.");
