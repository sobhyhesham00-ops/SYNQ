import * as fs from 'fs';

const filePath = 'src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

interface Token {
  line: number;
}

const stack: Token[] = [];

console.log("Tracing curly braces ONLY in the team leader inquiries block (lines 17734 to 18394)...");

for (let r = 17733; r < 18394; r++) { // lines 17734 to 18394 (0-indexed indices)
  const line = lines[r];
  if (!line) continue;
  
  const cleanLine = line.replace(/\/\/.*$/, '');
  
  // Parse characters for `{` and `}`
  for (let c = 0; c < cleanLine.length; c++) {
    const char = cleanLine[c];
    if (char === '{') {
      stack.push({ line: r + 1 });
      console.log(`Line ${r + 1}: OPEN curly { [${stack.length}] -> ${line.trim()}`);
    } else if (char === '}') {
      const popped = stack.pop();
      console.log(`Line ${r + 1}: CLOSE curly } [${stack.length}] -> ${line.trim()} (matches open at line ${popped ? popped.line : 'NONE'})`);
    }
  }
}

console.log("\nUnclosed curly braces in stack:", stack);
