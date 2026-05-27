const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\\n');
lines[13222] = '// removed';
fs.writeFileSync('src/App.tsx', lines.join('\\n'));
console.log('Removed');
