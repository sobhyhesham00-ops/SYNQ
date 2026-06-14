const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/const photoLines =[\s\S]*?copyToClipboard\([\s\S]*?"Complaint details copied with beautiful emojis!",\n\s*\);\n\s*\}\}/g,
`const text = generateComplaintCopyText(comp);\n                                                            copyToClipboard(text, "Complaint details copied!");\n                                                          }}`);

fs.writeFileSync('src/App.tsx', c);
