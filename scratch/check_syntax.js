const fs = require('fs');
const content = fs.readFileSync('e:/my works/MashMagic-LMS-Dashboard/frontend/src/pages/Mentor/MyStudents.jsx', 'utf8');
let openBraces = 0;
let openParens = 0;
for (let char of content) {
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
}
console.log('Braces:', openBraces);
console.log('Parens:', openParens);
