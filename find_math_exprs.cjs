const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{([^}]+)\}/g;
let match;
const ops = ['*', '-', '%', '/'];

while ((match = regex.exec(code)) !== null) {
  let inner = match[1];
  
  if (inner.includes('=>')) continue;
  if (/<\/|^\/\*|\*\/|^\s*\/\//.test(inner)) continue; // ignore comments or tags
  if (inner.split('\n').length > 2) continue; // ignore large blocks
  
  // Check for operators
  let hasOp = false;
  // Make sure to ignore string literals? Just simple checks:
  if (!inner.includes('`') && !inner.includes('"') && !inner.includes("'")) {
     if (inner.includes(' * ') || inner.includes(' - ') || inner.includes(' / ') || inner.includes(' % ')) {
         hasOp = true;
     }
  }

  if (hasOp) {
      if (!inner.includes('isNaN') && !inner.includes('Math.round') && !inner.includes('toFixed') && !inner.includes('.length')) {
          console.log(code.substring(0, match.index).split('\n').length, ':', inner.trim());
      }
  }
}
