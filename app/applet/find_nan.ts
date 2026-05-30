import fs from 'fs';

const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/>\s*\{[^{}]+\}\s*</.test(line)) {
    if (line.includes('length')) continue;
    if (line.includes('(') && !line.match(/toFixed|Math\.round|getTime|getDate/)) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
}
