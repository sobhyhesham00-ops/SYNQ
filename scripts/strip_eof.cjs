const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const lastBracket = code.lastIndexOf('}');
code = code.substring(0, lastBracket + 1) + '\\n';

fs.writeFileSync('src/App.tsx', code);
console.log('Stripped EOF');
