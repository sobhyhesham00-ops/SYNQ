const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const str = "      </div>\n      <footer className=\"mt-auto border-t";
const rep = "      <footer className=\"mt-auto border-t";

code = code.replace(str, rep);

fs.writeFileSync('src/App.tsx', code);
console.log('Removed 13201');
