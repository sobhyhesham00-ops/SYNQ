const fs = require('fs');

function checkFile(filepath) {
  const code = fs.readFileSync(filepath, 'utf8');

  // Strip all useEffect blocks to avoid false positives
  let stripped = code.replace(/useEffect\s*\([\s\S]*?\}\s*,\s*\[.*?\]\s*\);?/g, '');
  stripped = stripped.replace(/useEffect\s*\([\s\S]*?\}\s*\);?/g, '');

  
  // Strip all arrow functions block `{ ... }` if they are event handlers
  // This is hard to do cleanly with regex.
  // Instead, let's just find lines that have `set` followed by Capital letter,
  // and see if they are indented at the top level of the component.
  
  const lines = stripped.split('\n');
  lines.forEach((line, i) => {
    // Top-level hooks and calls usually have 2 spaces of indentation
    if (line.match(/^  set[A-Z]\w*\(/)) {
       console.log(`[${filepath}:${i+1}] ${line}`);
    }
  });
}

checkFile('src/App.tsx');
