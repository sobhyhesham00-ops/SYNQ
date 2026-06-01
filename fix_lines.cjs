const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\\n');

lines[17060] = '                                    setUploadError((prev) => (prev ? prev + "\\\\n" : "") + "No schedule data parsed from sheet.");';
lines.splice(17061, 1); // remove the broken newline chunk

fs.writeFileSync('src/App.tsx', lines.join('\\n'));
console.log('done');
