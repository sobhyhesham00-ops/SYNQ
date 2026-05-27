const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace hex codes for backgrounds and borders making them compatible with our tailwind @theme variables
code = code.replace(/bg-\[#[0-9a-fA-F]{6}\](\/[0-9]+)?/g, 'bg-slate-900$1');
code = code.replace(/text-slate-100\b/g, 'text-slate-700'); 
// wait, we don't want to blindly replace text-slate-100 with text-slate-700
// we just let index.css map text-slate-100 to text-slate-100 but my tailwind class --color-slate-100 maps to text-primary! 

fs.writeFileSync('src/App.tsx', code);
console.log('Hex backgrounds replaced!');
