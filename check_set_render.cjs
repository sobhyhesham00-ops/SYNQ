const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/^\s+set[A-Z]/) && !line.includes('=>') && !line.includes('return ') && !line.includes('onClick')) {
     console.log((i+1) + ": " + line);
  }
}
