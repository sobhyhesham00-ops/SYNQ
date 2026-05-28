const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/^[ \t]*set[A-Z][a-zA-Z0-9]*\(/)) {
     if (!line.includes('=>') && !line.includes('setInterval') && !line.includes('setTimeout') && !line.includes('} else {') && !line.includes('} else if')) {
       console.log((i+1) + ": " + line.slice(0, 100));
     }
  }
}
