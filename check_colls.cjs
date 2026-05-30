const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

const m = code.match(/onSnapshot\(collection[^]+?\)/g);
console.log(m ? m.map(x => x.split('=>')[0].trim()).join('\n') : "None");
