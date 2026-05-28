const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf-8');

// Find all useEffect
const regex = /useEffect\(([\s\S]*?)\);/g;
let match;
while ((match = regex.exec(code)) !== null) {
  const inner = match[1];
  // check if it ends with an array
  if (!/,\s*\[[\s\S]*\]\s*$/.test(inner)) {
    console.log("No deps useEffect found near character index " + match.index);
    console.log(match[0]);
  }
}
