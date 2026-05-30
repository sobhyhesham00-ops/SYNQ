const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

const m = code.match(/onSnapshot\([^]*?=>\s*\{[^]*?\}[^]*?\)/g) || [];
console.log("Found onSnapshot listeners:", m.length);

const keys = [];
code.replace(/setStorageItem\('([^']+)'/g, (match, p1) => {
  if (!keys.includes(p1)) keys.push(p1);
  return match;
});
console.log("Keys in setStorageItem:", keys);
