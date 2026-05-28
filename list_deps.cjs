const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');

let inEffect = false;
let effectStart = 0;
let parentCount = 0;

for (let i = 0; i < code.length; i++) {
  if (!inEffect && code.substring(i, i + 10) === 'useEffect(') {
    inEffect = true;
    effectStart = i;
    parentCount = 1;
    i += 9;
    continue;
  }

  if (inEffect) {
    if (code[i] === '(') parentCount++;
    if (code[i] === ')') parentCount--;

    if (parentCount === 0) {
      const effectBody = code.substring(effectStart, i + 1);
      
      const match = effectBody.match(/\}\s*,\s*\[(.*)\]\s*\)$/s);
      if (match) {
         console.log(match[1].trim());
      }
      inEffect = false;
    }
  }
}
