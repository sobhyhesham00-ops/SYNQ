const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(
  'onClick={(e) => {\\n                                                  e.stopPropagation();\\n                                                  const text = generateInquiryCopyText(inq);\\n                                                  copyToClipboard(text, "Inquiry details copied!");\\n                                                }}',
  'onClick={(e) => {\\n  e.stopPropagation();\\n  const text = generateInquiryCopyText(inq);\\n  copyToClipboard(text, "Inquiry details copied!");\\n}}'
);

c = c.replace(
  'onClick={() => {\\n                                                            const text = generateComplaintCopyText(comp);\\n                                                            copyToClipboard(text, "Complaint details copied!");\\n                                                          }}',
  'onClick={() => {\\n  const text = generateComplaintCopyText(comp);\\n  copyToClipboard(text, "Complaint details copied!");\\n}}'
);

c = c.replace(
  'onClick={() => {\\n                                                          const text = generateComplaintCopyText(comp);\\n                                                          copyToClipboard(text, "Complaint details copied!");\\n                                                        }}',
  'onClick={() => {\\n  const text = generateComplaintCopyText(comp);\\n  copyToClipboard(text, "Complaint details copied!");\\n}}'
);

fs.writeFileSync('src/App.tsx', c);
