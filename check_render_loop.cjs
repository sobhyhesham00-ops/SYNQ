const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /^\s*(?:set[A-Z][a-zA-Z0-9]+|setActiveTab)\([^)]+\);?\s*$/gm;
let result;
while ((result = regex.exec(code)) !== null) {
  const lines = code.substring(0, result.index).split('\n');
  const thisLine = lines.length;
  // Let's find the closing brace immediately before it, and check context
  console.log(`Line ${thisLine}: ${result[0].trim()}`);
}
