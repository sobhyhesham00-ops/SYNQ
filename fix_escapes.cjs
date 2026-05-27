const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

code = code.replace(/\\\$\\{bgColors\\}/g, '${bgColors}');
code = code.replace(/\\className=\\{`w-full/g, 'className={`w-full');
// Wait, any `\` before `$` or ``` has to be removed.
code = code.replace(/\\\`/g, '\`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync(p, code);
console.log('Fixed escape characters in App.tsx');
