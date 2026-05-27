const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Colors replacement mapping safely
code = code.replace(/text-white/g, 'text-slate-50');
code = code.replace(/bg-white\/5/g, 'bg-slate-900/50');
code = code.replace(/bg-white\/10/g, 'bg-slate-800/80');
code = code.replace(/border-white\//g, 'border-slate-700/');

fs.writeFileSync('src/App.tsx', code);
console.log('Colors replaced! 🎉');
