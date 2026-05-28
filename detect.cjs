const fs = require('fs');

function checkFile(filepath) {
  const code = fs.readFileSync(filepath, 'utf-8');
  const lines = code.split('\n');

  let openBraces = 0;
  let inComponent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inComponent && (line.match(/export default function [A-Z]/) || line.match(/export function [A-Z]/) || line.match(/const [A-Z][A-Za-z0-9]* = \(/))) {
      inComponent = true;
      openBraces = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      continue;
    }
    
    if (inComponent) {
      if (line.includes('{')) openBraces += (line.match(/\{/g) || []).length;
      if (line.includes('}')) openBraces -= (line.match(/\}/g) || []).length;
      
      // Look for setX( value ) called directly
      if (openBraces === 1 && line.match(/^[ \t]*set[A-Z][a-zA-Z0-9]*\(/)) {
         console.log(filepath + ":" + (i+1) + " DIRECT: " + line.slice(0, 100));
      }
      
      if (openBraces <= 0) {
        inComponent = false;
      }
    }
  }
}

const dir = require('fs').readdirSync('src/components');
for (const file of dir) {
  if (file.endsWith('.tsx')) {
    checkFile('src/components/' + file);
  }
}
