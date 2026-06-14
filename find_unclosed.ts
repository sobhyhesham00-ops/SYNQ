import * as fs from 'fs';

const file = 'src/App.tsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split(/\r?\n/);

interface Token {
  type: string;
  line: number;
}

const stack: Token[] = [];

for (let i = 9310; i < 26625; i++) {
  const line = lines[i];
  if (!line) continue;
  const cleanLine = line.replace(/\/\/.*$/, '');
  
  // Tag regex to match <div...> and </div>
  const tagsRegex = /<div(\s+([^>]*[^/])>|>)|<\/div>/g;
  let match;
  while ((match = tagsRegex.exec(cleanLine)) !== null) {
    const rawTag = match[0];
    const isClose = rawTag.startsWith('</');
    
    if (isClose) {
      if (stack.length > 0) {
        stack.pop();
      } else {
        console.log(`Line ${i + 1}: Extra closing </div> -> ${line.trim()}`);
      }
    } else {
      stack.push({ type: 'div', line: i + 1 });
    }
  }
}

console.log(`Unclosed divs in workspace:`, stack);
