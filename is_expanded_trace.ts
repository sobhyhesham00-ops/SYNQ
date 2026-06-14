import * as fs from 'fs';

const filePath = 'src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

interface Token {
  line: number;
}

const stack: Token[] = [];

console.log("Tracing div tags ONLY from isExpanded onwards...");

for (let r = 18053; r < 18393; r++) { // lines 18054 to 18393
  const line = lines[r];
  if (!line) continue;
  
  const cleanLine = line.replace(/\/\/.*$/, '');
  
  // Find <div...> and </div>
  const tagsRegex = /<div(\s+([^>]*[^/])>|>)|<\/div>/g;
  let match;
  while ((match = tagsRegex.exec(cleanLine)) !== null) {
    const rawTag = match[0];
    const isClose = rawTag.startsWith('</');
    
    if (isClose) {
      const popped = stack.pop();
      console.log(`Line ${r + 1}: CLOSE div [${stack.length}] -> ${line.trim()} (matches open at line ${popped ? popped.line : 'NONE'})`);
    } else {
      stack.push({ line: r + 1 });
      console.log(`Line ${r + 1}: OPEN div [${stack.length}] -> ${line.trim()}`);
    }
  }
}

console.log("\nRemaining unclosed divs in stack:", stack);
