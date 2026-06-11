const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    file = path.resolve(dir, file);
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(file, pattern));
    } else {
      if (file.endsWith(pattern)) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = findFiles('e:/my works/MashMagic-LMS-Dashboard/frontend/src/pages', 'AcademicSchedule.jsx');
console.log(files.join('\n'));
