import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

let iters = 0;
while (content.includes('{(() => { const _v = ') && iters < 200) {
   let idx = content.indexOf('{(() => { const _v = ');
   let endIdx = content.indexOf('; return (typeof _v === \'number\' && isNaN(_v)) ? 0 : _v; })()}', idx);
   if (endIdx > -1) {
       let inner = content.substring(idx + 21, endIdx);
       content = content.substring(0, idx) + '{' + inner + '}' + content.substring(endIdx + 64);
   } else {
       break;
   }
   iters++;
}

fs.writeFileSync('src/App.tsx', content);
console.log("Restored AST", iters);
