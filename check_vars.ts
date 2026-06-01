import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{([a-zA-Z0-9_]+)\}/g;
let match;
const counts = new Map();

while ((match = regex.exec(code)) !== null) {
  let inner = match[1];
  counts.set(inner, (counts.get(inner) || 0) + 1);
}

Array.from(counts.entries())
  .sort((a,b) => b[1] - a[1])
  .forEach(([k,v]) => {
     if (k.toLowerCase().includes('score') || k.toLowerCase().includes('count') || k.toLowerCase().includes('rate') || k.toLowerCase().includes('level') || k.toLowerCase().includes('min')) {
        console.log(k, v);
     }
  });

