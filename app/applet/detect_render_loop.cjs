const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');

let openBraces = 0;
let inComponent = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.match(/export default function App\(/)) {
    inComponent = true;
    openBraces = 1;
    continue;
  }
  
  if (inComponent) {
    if (line.includes('{')) openBraces += (line.match(/\{/g) || []).length;
    if (line.includes('}')) openBraces -= (line.match(/\}/g) || []).length;
    
    // Look for setX( value ) called directly
    if (openBraces === 1 && line.match(/^[ \t]*set[A-Z][a-zA-Z0-9]*\(/)) {
       console.log((i+1) + " DIRECT: " + line.slice(0, 100));
    }
    
    if (openBraces <= 0) {
      inComponent = false;
    }
  }
}
