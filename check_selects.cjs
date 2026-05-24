const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
lines.forEach((line, i) => {
  if (line.includes('<select')) {
    console.log(i - 1 + ':', lines[i - 1]);
    console.log(i + ':', line);
    console.log(i + 1 + ':', lines[i + 1]);
  }
});
