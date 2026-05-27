const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

const matches = code.match(/setActiveTab\('([^']+)'/g);
const uniqueTabs = [...new Set(matches.map(m => m.match(/'([^']+)'/)[1]))];

console.log("All Tabs:");
console.log(uniqueTabs);
