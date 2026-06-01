import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/\}\/span>/g, '}</span>');
content = content.replace(/\}\/div>/g, '}</div>');
content = content.replace(/\}m\n/g, '}m\n');
content = content.replace(/\}div>/g, '}</div>');

// also we have })()} missing something above. Let's look closely at 10672.
fs.writeFileSync('src/App.tsx', content);
