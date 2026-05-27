const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const op = (code.match(/<div[ >\\n]/g) || []).length;
const cl = (code.match(/<\\/div>/g) || []).length;
console.log("DIV OPENS:", op);
console.log("DIV CLOSES:", cl);
