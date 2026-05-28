const fs = require('fs');
const path = require('path');

function checkFile(filepath) {
  if (!fs.existsSync(filepath)) return;
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
      // Very naive brace matching
      if (code[i] === '(') parentCount++;
      if (code[i] === ')') parentCount--;

      if (parentCount === 0) {
        const effectBody = code.substring(effectStart, i + 1);
        if (!effectBody.match(/\}\s*,\s*\[.*\]\s*\)$/)) {
          console.log("Missing deps array in " + filepath + " near line " + (code.substring(0, i).split('\n').length));
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
      checkFile(p);
    }
  });
}

walk('src');
