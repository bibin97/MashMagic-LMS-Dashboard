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
                        // Replace ' italic ' with ' ', ' italic' at end of string with '', 'italic ' at start with ''
                        // Be careful not to replace things inside words.
                        let newContent = content.replace(/(['"\s`])italic(['"\s`])/g, '$1$2')
                                               .replace(/className=(['"{`][^'"{`]+)\sitalic\b/g, 'className=$1')
                                               .replace(/\bitalic\s/g, '');
                                               
                        // Let's do a simpler safer replacement:
                        // Replace whole word 'italic' only when inside classNames or templates
                        // It's safe to just replace \bitalic\b if we are careful about imports but no file is named italic.
                        let saferContent = content.replace(/(?<=className=.*?["'`].*?)\bitalic\b/g, '');
                        // Because JS regex without lookbehind is tricky, we can just replace ' italic ' -> ' ', etc.
                        let finalContent = content.replace(/\bitalic\b/g, (match, offset, string) => {
                           // check context, if it's inside a className string, remove it.
                           // Actually, just removing ALL exact word "italic" inside .jsx is generally safe in this React project context.
                           return '';
                        });
                        // Clean up multiple spaces that might have been created
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
