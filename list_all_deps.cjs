const fs = require('fs');
const path = require('path');

function processFile(filepath) {
  const code = fs.readFileSync(filepath, 'utf8');
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
          console.log(`[${filepath}] Deps: [${match[1].replace(/\n/g, ' ').trim()}]`);
        }
        inEffect = false;
      }
    }
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      processFile(p);
    }
  });
}
walk('src');
