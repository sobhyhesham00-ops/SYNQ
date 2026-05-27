const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\\n');

if (lines[236] === '</>') {
    lines[236] = '';
    console.log('Removed line 237');
}

fs.writeFileSync('src/App.tsx', lines.join('\\n'));
