const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Use proper newline split
let lines = content.split('\\n');

let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setUploadError((prev) => (prev ? prev + "') && lines[i].endsWith('"')) {
    targetIdx = i;
    break;
  }
}

if (targetIdx !== -1 && lines[targetIdx + 1] && lines[targetIdx + 1].includes('" : "")')) {
  lines[targetIdx] = '                                     setUploadError((prev) => (prev ? prev + "\\\\n" : "") + "No schedule data parsed from sheet.");';
  lines.splice(targetIdx + 1, 1);
} else {
  // Let's just find " : "") + "No schedule data parsed from sheet.");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('" : "") + "No schedule data parsed from sheet.");')) {
      lines[i-1] = '                                     setUploadError((prev) => (prev ? prev + "\\\\n" : "") + "No schedule data parsed from sheet.");';
      lines.splice(i, 1);
      break;
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\\n'));
console.log('done');
