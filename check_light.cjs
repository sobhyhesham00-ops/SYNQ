const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

// There might be some stray text-white or text-slate-100 that I missed in other scopes.
const m1 = code.match(/text-slate-[12]00/g);
console.log("text-slate-100/200 count:", m1 ? m1.length : 0);

