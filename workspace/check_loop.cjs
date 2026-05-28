const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');

let effectLevels = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Look for setX( value ) called directly
  if (line.match(/^[ \t]*set[A-Z][a-zA-Z0-9]*\(/)) {
     if (line.includes('=>') || line.includes('setInterval') || line.includes('setTimeout')) continue; 
     console.log(i + 1 + ": " + line.trim());
  }
}
