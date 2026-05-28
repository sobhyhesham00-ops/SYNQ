const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf-8');
const effectRegex = /useEffect\([\s\S]*?\};?\s*,\s*\[([^\]]*)\]\);/g;
let match;
while ((match = effectRegex.exec(code)) !== null) {
  const deps = match[1].split(',').map(s => s.trim());
  const body = match[0];
  
  const setters = new Set();
  const setterRegex = /set([A-Z][a-zA-Z0-9]*)\(/g;
  let sMatch;
  while ((sMatch = setterRegex.exec(body)) !== null) {
     setters.add('set' + sMatch[1]);
  }
  
  if (setters.size > 0) {
    console.log('---');
    console.log('Deps: ', deps);
    console.log('Setters: ', Array.from(setters));
  }
}
