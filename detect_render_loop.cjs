const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

// Find all matches of `set[A-Z]\w+\(`
const regex = /set[A-Z]\w*\(/g;
let match;
while ((match = regex.exec(content))) {
   const start = Math.max(0, match.index - 50);
   const end = Math.min(content.length, match.index + 50);
   const snippet = content.slice(start, end);
   
   // If it's not inside a function or a callback
   // We can guess by counting braces or just checking lines
   // A simple heuristic: check if there's '=>' or 'function' or 'catch' in the 100 preceding characters
   
   const precedStart = Math.max(0, match.index - 200);
   const preced = content.slice(precedStart, match.index);
   
   // if it looks like a direct call
   if (!preced.includes('{') && preced.includes('if')) {
      // maybe ?
   }
}
// This is too hard.
