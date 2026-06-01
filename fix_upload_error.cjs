const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The problematic ones are those ending with an unescaped double quote string that continues to next line.
content = content.replace(
  'setUploadError((prev) => (prev ? prev + "\\n" : "") + "No schedule data parsed from sheet.");',
  'setUploadError((prev) => (prev ? prev + "\\\\n" : "") + "No schedule data parsed from sheet.");'
);
content = content.replace(
  'setUploadError((prev) => (prev ? prev + "\\r\\n" : "") + "No schedule data parsed from sheet.");',
  'setUploadError((prev) => (prev ? prev + "\\\\n" : "") + "No schedule data parsed from sheet.");'
);

// I will scan all strings that are not closed 
const lines = content.split('\\n');
for(let i=0; i<lines.length; i++) {
   if (lines[i].includes('setUploadError((prev) => (prev ? prev + "') && lines[i].endsWith('"')) {
       lines[i] = lines[i].replace('+', '+'); // not doing string magic here.
   }
}
fs.writeFileSync('src/App.tsx', content);

console.log('Fixed file');
