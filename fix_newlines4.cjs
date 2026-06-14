const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(
  'onClick={(e) => {\\n                                                  e.stopPropagation();\\n                                                  const text = generateInquiryCopyText(inq);\\n                                                  copyToClipboard(text, "Inquiry details copied!");\\n                                                }}',
  \`onClick={(e) => {
                                                  e.stopPropagation();
                                                  const text = generateInquiryCopyText(inq);
                                                  copyToClipboard(text, "Inquiry details copied!");
                                                }}\`
);

c = c.replace(
  'onClick={() => {\\n                                                            const text = generateComplaintCopyText(comp);\\n                                                            copyToClipboard(text, "Complaint details copied!");\\n                                                          }}',
  \`onClick={() => {
                                                            const text = generateComplaintCopyText(comp);
                                                            copyToClipboard(text, "Complaint details copied!");
                                                          }}\`
);

c = c.replace(
  'onClick={() => {\\n                                                          const text = generateComplaintCopyText(comp);\\n                                                          copyToClipboard(text, "Complaint details copied!");\\n                                                        }}',
  \`onClick={() => {
                                                          const text = generateComplaintCopyText(comp);
                                                          copyToClipboard(text, "Complaint details copied!");
                                                        }}\`
);

fs.writeFileSync('src/App.tsx', c);
