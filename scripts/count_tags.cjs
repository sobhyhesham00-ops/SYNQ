const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

let depth = 0;
let inString = false;
let stringChar = '';

// Quick tag matcher (not perfect, but enough for structure check)
// Match <div, </div, <header, </header, <footer, </footer, <main, </main
const regex = /<\/?(div|header|footer|main|section|aside|nav)[ >]/g;

let match;
while ((match = regex.exec(code)) !== null) {
  const isClosing = match[0].startsWith('</');
  const tag = match[1];
  
  // Find line number
  const prefix = code.slice(0, match.index);
  const line = prefix.split('\\n').length;
  
  if (isClosing) {
    depth--;
    if (depth <= 0) {
      console.log(\`Closed at line \${line}, depth: \${depth}\`);
    }
  } else {
    depth++;
  }
}

// Just counting the total <div open and </div closes:
const divOpen = (code.match(/<div[ >\n]/g) || []).length;
const divClose = (code.match(/<\/div>/g) || []).length;
console.log('Total div open:', divOpen);
console.log('Total div close:', divClose);
