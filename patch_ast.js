const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      if (file.endsWith('.jsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'frontend/src/pages'));

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('<table')) continue;

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    let modified = false;

    traverse(ast, {
      JSXElement(path) {
        if (path.node.openingElement.name.name === 'table') {
          const isMainTable = path.node.openingElement.attributes.some(attr => 
            attr.name && attr.name.name === 'className' && 
            attr.value && attr.value.value && attr.value.value.includes('w-full text-left')
          );

          if (!isMainTable) return;

          // Add th to thead
          path.traverse({
            JSXElement(theadPath) {
              if (theadPath.node.openingElement.name.name === 'thead') {
                theadPath.traverse({
                  JSXElement(trPath) {
                    if (trPath.node.openingElement.name.name === 'tr') {
                      const thExists = trPath.node.children.some(c => c.type === 'JSXElement' && c.children && c.children[0] && c.children[0].value && c.children[0].value.trim() === '#');
                      if (!thExists) {
                        const thAst = parser.parseExpression('<th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">#</th>', { plugins: ['jsx'] });
                        trPath.node.children.unshift(thAst);
                        modified = true;
                      }
                      trPath.stop();
                    }
                  }
                });
                theadPath.stop();
              }
            }
          });

          // Add td to tbody inside map
          path.traverse({
            JSXElement(tbodyPath) {
              if (tbodyPath.node.openingElement.name.name === 'tbody') {
                tbodyPath.traverse({
                  CallExpression(callPath) {
                    if (callPath.node.callee.property && callPath.node.callee.property.name === 'map') {
                      const arrowFunc = callPath.node.arguments[0];
                      if (arrowFunc && (arrowFunc.type === 'ArrowFunctionExpression' || arrowFunc.type === 'FunctionExpression')) {
                        let idxParamName = 'index';
                        if (arrowFunc.params.length > 1) {
                          idxParamName = arrowFunc.params[1].name;
                        } else {
                          arrowFunc.params.push({ type: 'Identifier', name: 'index' });
                        }

                        callPath.traverse({
                          JSXElement(trPath) {
                            if (trPath.node.openingElement.name.name === 'tr') {
                              const tdExists = trPath.node.children.some(c => 
                                c.type === 'JSXElement' && c.openingElement.name.name === 'td' && 
                                c.children && c.children[0] && c.children[0].type === 'JSXExpressionContainer' &&
                                c.children[0].expression.type === 'BinaryExpression' && c.children[0].expression.left.name === idxParamName
                              );
                              if (!tdExists) {
                                const tdAst = parser.parseExpression(`<td className="p-6 text-sm font-black text-slate-400 border-b border-slate-50">{${idxParamName} + 1}</td>`, { plugins: ['jsx'] });
                                trPath.node.children.unshift(tdAst);
                                modified = true;
                              }
                              trPath.stop();
                            }
                          }
                        });
                      }
                    }
                  }
                });
                tbodyPath.stop();
              }
            }
          });
        }
      }
    });

    if (modified) {
      const output = generate(ast, {}, code);
      fs.writeFileSync(file, output.code);
      console.log('Patched:', file);
    }
  } catch (e) {
    console.error('Error parsing', file, e.message);
  }
}
