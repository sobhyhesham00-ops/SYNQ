const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

let m = code.match(/bg-([a-z]+-\d+)?.*absolute.*z-50.*mt-2.*rounded/gi);
console.log("Dropdown examples:", m ? m.length : 0);

