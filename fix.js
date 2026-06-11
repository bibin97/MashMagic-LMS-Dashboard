const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            next();
          });
        } else {
          if (file.endsWith('.jsx')) results.push(file);
          next();
        }
      });
    })();
  });
};

walk('e:/my works/MashMagic-LMS-Dashboard/frontend/src', (err, results) => {
  if (err) throw err;
  let fixedModalsCount = 0;
  let fixedTablesCount = 0;

  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Fix Tables: Check if <table is wrapped in overflow-x-auto
    let tableRegex = /<table\b[^>]*>[\s\S]*?<\/table>/g;
    content = content.replace(tableRegex, (match, offset, string) => {
      // Check if it's already wrapped
      let before = string.substring(Math.max(0, offset - 100), offset);
      if (before.includes('overflow-x-auto')) {
        return match;
      }
      modified = true;
      fixedTablesCount++;
      return `<div className="w-full overflow-x-auto">\n${match}\n</div>`;
    });

    // Fix Modals: Find fixed inset-0, then the next inner div
    let modalRegex = /(<div[^>]*className=\"[^\"]*fixed inset-0[^\"]*\"[^>]*>\s*)<div\s+className=\"([^\"]+)\"/g;
    content = content.replace(modalRegex, (match, p1, p2) => {
      if (p2.includes('max-h-') || p2.includes('overflow-y-auto')) {
        return match;
      }
      modified = true;
      fixedModalsCount++;
      return `${p1}<div className="${p2} max-h-[90vh] overflow-y-auto"`;
    });

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file);
    }
  });
  console.log('Done! Fixed ' + fixedModalsCount + ' modals and ' + fixedTablesCount + ' tables.');
});
