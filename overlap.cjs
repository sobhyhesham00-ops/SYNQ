const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf-8');
const effectRegex = /useEffect\([\s\S]*?\};?\s*,\s*\[([^\]]*)\]\);/g;
let match;
while ((match = effectRegex.exec(code)) !== null) {
  const deps = match[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
  const body = match[0];
  
  const setters = new Set();
  const setterRegex = /set([A-Z][a-zA-Z0-9]*)\(/g;
  let sMatch;
  while ((sMatch = setterRegex.exec(body)) !== null) {
     setters.add('set' + sMatch[1]);
  }
  
  const overlap = deps.filter(d => setters.has('set' + d.charAt(0).toUpperCase() + d.slice(1)));

  if (overlap.length > 0) {
    console.log('--- Overlap Found ---');
    console.log('Deps: ', deps);
    console.log('Setters: ', Array.from(setters));
    console.log('Overlap: ', overlap);
  }
}
