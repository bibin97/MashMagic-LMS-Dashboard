const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        let pending = list.length;
        if (!pending) return callback(null);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        if (!--pending) callback(null);
                    });
                } else {
                    if (file.endsWith('.jsx')) {
                        let content = fs.readFileSync(file, 'utf8');
                        
                        let finalContent = content.replace(/\bitalic\b/g, '');
                        // Clean up multiple spaces that might have been created inside strings
                        finalContent = finalContent.replace(/  +/g, ' ');
                        
                        if (content !== finalContent) {
                            fs.writeFileSync(file, finalContent, 'utf8');
                            console.log('Processed:', file);
                        }
                    }
                    if (!--pending) callback(null);
                }
            });
        });
    });
}

walk(path.join(__dirname, 'src'), function(err) {
    if (err) throw err;
    console.log('Done replacing italic');
});
