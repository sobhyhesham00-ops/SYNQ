const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/\\n/g, String.fromCharCode(10));

fs.writeFileSync('src/App.tsx', c);
