const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
const tags = [];
const lines = code.split('
');
let inJSX = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (')) inJSX = true;
  if (!inJSX) continue;
  let matches = lines[i].match(/</?([a-zA-Z0-9]+)(s+[^>]*?)?(/}?)>/g);
  if (matches) {
    for (let m of matches) {
      if (m.endsWith('/>')) continue;
      let nameMatch = m.match(/</?([a-zA-Z0-9]+)/);
      if (nameMatch) {
        tags.push({name: nameMatch[1], isClose: m.startsWith('</'), line: i + 1});
      }
    }
  }
}
let stack = [];
for (let t of tags) {
  if (t.isClose) {
    if (stack.length && stack[stack.length - 1].name === t.name) {
      stack.pop();
    } else {
      console.log('Mismatch at line', t.line, 'close', t.name, 'but top is', stack.length ? stack[stack.length - 1].name : 'empty', 'open at', stack.length ? stack[stack.length - 1].line : 'N/A');
      stack.pop(); // try popping anyway
    }
  } else {
    stack.push(t);
  }
}
if(stack.length) console.log('Leftover:', stack.map(s => s.name + ':' + s.line));
