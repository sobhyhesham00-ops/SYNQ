const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.split('\\\\n').join('\\n');
fs.writeFileSync('src/App.tsx', c);
