const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The main Inquiries Tab copy
content = content.replace(/\{(\n\s*const attachmentsText[\s\S]*?)copyToClipboard\([\s\S]*?\"Inquiry details copied with beautiful emojis!\",?[\s\S]*?\);([\s\S]*?)\}/g,
`{ 
                                                  const text = generateInquiryCopyText(inq);
                                                  copyToClipboard(text, "Inquiry details copied!");
                                                }`);

// Main Complaints Tab copy
content = content.replace(/\{(\n\s*const attachmentsText[\s\S]*?)copyToClipboard\([\s\S]*?\"Complaint details copied with beautiful emojis!\",?[\s\S]*?\);([\s\S]*?)\}/g,
`{ 
                                                            const text = generateComplaintCopyText(comp);
                                                            copyToClipboard(text, "Complaint details copied!");
                                                          }`);

fs.writeFileSync('src/App.tsx', content);
