const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.split('\\\\n').join('\\n'); 

// Actually I want to split by '\\n' (the literal string that looks like backslash n)
// and replace it with a true newline character.
c = c.replace(/\\n/g, '\\n');

fs.writeFileSync('src/App.tsx', c);
