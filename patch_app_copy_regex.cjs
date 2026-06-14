const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The main Inquiries Tab copy
content = content.replace(/\]\.filter\(Boolean\)\.join\(\'\\n\'\);\n\n\s*copyToClipboard\([\s\S]*?\"Inquiry details copied with beautiful emojis!\",?[\s\S]*?\);\n\s*\}\}/g,
`];\n\n\n                                                  copyToClipboard(generateInquiryCopyText(inq), "Inquiry details copied!");\n                                                }}`);

// Main Complaints Tab copy
content = content.replace(/\]\n\s*\.filter\(Boolean\)\n\s*\.join\(\"\\n\"\);\n\n\s*copyToClipboard\([\s\S]*?\"Complaint details copied with beautiful emojis!\",?[\s\S]*?\);\n\s*\}\}/g,
`];\n                                                            copyToClipboard(generateComplaintCopyText(comp), "Complaint details copied!");\n                                                          }}`);

// But this leaves the array definition unused. It's better to just regex replace the whole onClick block.
// Wait, the easiest way to find and replace the whole block is parsing the string structure.

fs.writeFileSync('src/App.tsx', content);
