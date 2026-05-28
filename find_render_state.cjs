const fs = require('fs');

const findDangerous = (file) => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if line starts with whitespace and calls a state setter
    if (line.match(/^[ \t]*set[A-Z][a-zA-Z0-9]*\(/)) {
       // Ignore if inside a callback, useEffect, or obvious conditional
       if (line.match(/=>/)) continue;
       if (line.includes('return ')) continue;
       console.log(file + ":" + (i+1) + " -> " + line.trim());
    }
  }
}
findDangerous('src/App.tsx');
