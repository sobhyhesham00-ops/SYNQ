const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.split('\\\\n').join('\\n'); // split by two backslashes and a n, wait, the node string '\\\\n' becomes \\n literal. '\\n' becomes \n newline!
fs.writeFileSync('src/App.tsx', c);
