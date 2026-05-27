const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

const m = code.match(/bg-indigo-500[^>]+text-white/g);
console.log("indigo-text-white count:", m ? m.length : 0);
