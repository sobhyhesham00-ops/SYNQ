import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{([^}]+)\}/g;
let match;

while ((match = regex.exec(code)) !== null) {
  let inner = match[1];
  
  if (inner.includes('Number(') || inner.includes('parseFloat(') || inner.includes('parseInt(')) {
      if (!inner.includes('=>') && !inner.includes('isNaN') && !inner.includes('toFixed') && !inner.includes('.map') && !inner.includes('.filter')) {
          console.log(code.substring(0, match.index).split('\n').length, ':', inner.trim());
      }
  }
}
