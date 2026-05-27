const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
const code = fs.readFileSync(p, 'utf8');

const m = code.match(/bg-slate-9[05]0/g);
console.log(m ? m.length : 0);
