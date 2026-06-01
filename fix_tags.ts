import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/\}span>/g, '}</span>');
content = content.replace(/\}strong>/g, '}</strong>');

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed tags');
