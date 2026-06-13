const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.jsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const pagesDir = path.join(__dirname, 'frontend/src/pages');
const jsxFiles = walkSync(pagesDir);

let filesModified = 0;

for (const file of jsxFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Skip if it doesn't have a table
  if (!content.includes('<table')) continue;

  // Find all map functions that return a <tr>
  // This is a complex regex. We look for .map((item, index) => ( ... <tr ...>
  // A simpler approach:
  // 1. Add # to theads
  // Regex for thead > tr
  content = content.replace(/(<thead[^>]*>\s*<tr[^>]*>)/g, '$1\n                                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">#</th>');

  // 2. Add <td>{index + 1}</td> to tr inside map
  // We need to ensure the map has an index variable.
  // We look for: .map((varName, idxName) =>
  // Or .map((varName) =>
  // And change it to .map((varName, idx) =>
  // But wait, the name of the index variable varies (idx, index, i).
  
  // Let's do it manually for the top 10 lists if regex is too risky.
}
