const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

const setDocCount = (code.match(/setDoc\(/g) || []).length;
const updateDocCount = (code.match(/updateDoc\(/g) || []).length;

console.log("setDoc count:", setDocCount);
console.log("updateDoc count:", updateDocCount);
