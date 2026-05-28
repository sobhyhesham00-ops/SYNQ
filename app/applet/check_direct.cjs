const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');

let inUseEffect = false;
let openBraces = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('useEffect(')) {
    inUseEffect = true;
    openBraces = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    continue;
  }
  
  if (inUseEffect) {
    if (line.includes('{')) openBraces += (line.match(/\{/g) || []).length;
    if (line.includes('}')) openBraces -= (line.match(/\}/g) || []).length;
    if (openBraces <= 0) {
      inUseEffect = false;
    }
  }

  // Look for setX( value ) called directly
  if (!inUseEffect && line.match(/^[ \t]*set[A-Z][a-zA-Z0-9]*\(/)) {
     if (line.includes('=>') || line.includes('setInterval') || line.includes('setTimeout') || line.includes('} else {') || line.includes('} else if')) continue; 
     console.log((i+1) + ": " + line.slice(0, 100));
  }
}
