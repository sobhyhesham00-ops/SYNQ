const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{[^}]*\}/g;
let match;
while ((match = regex.exec(code)) !== null) {
  let str = match[0];
  if ((str.includes('Math.round') || str.includes('Math.floor')) && !str.includes('isNaN')) {
     console.log('Line approx ' + code.substring(0, match.index).split('\n').length + ':', str);
  }
}
