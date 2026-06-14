const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/const patientName = inq\.patientName \|\| "—";[\s\S]*?copyToClipboard\([\s\S]*?"Inquiry details copied with beautiful emojis!",\n\s*\);\n\s*\}\}/,
`const text = generateInquiryCopyText(inq);\n                                                  copyToClipboard(text, "Inquiry details copied!");\n                                                }}`);

fs.writeFileSync('src/App.tsx', c);
