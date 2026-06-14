const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

function extractAndReplace(c, marker, replacement) {
  let idx = c.indexOf(marker);
  if (idx !== -1) {
    let startIdx = c.lastIndexOf('onClick={(e) => {', idx);
    let altStartIdx = c.lastIndexOf('onClick={() => {', idx);
    
    // Choose whichever is closer
    let finalStart = Math.max(startIdx, altStartIdx);
    if (finalStart !== -1) {
      let endIdx = c.indexOf('}}', idx) + 2;
      c = c.substring(0, finalStart) + replacement + c.substring(endIdx);
    }
  }
  return c;
}

const req1 = 'onClick={(e) => {\\n                                                  e.stopPropagation();\\n                                                  const text = generateInquiryCopyText(inq);\\n                                                  copyToClipboard(text, "Inquiry details copied!");\\n                                                }}';

c = extractAndReplace(c, '"Inquiry details copied with beautiful emojis!"', req1);

const req2 = 'onClick={() => {\\n                                                            const text = generateComplaintCopyText(comp);\\n                                                            copyToClipboard(text, "Complaint details copied!");\\n                                                          }}';

c = extractAndReplace(c, '"Complaint details copied with beautiful emojis!"', req2);

const req3 = 'onClick={() => {\\n                                                          const text = generateComplaintCopyText(comp);\\n                                                          copyToClipboard(text, "Complaint details copied!");\\n                                                        }}';

c = extractAndReplace(c, '"Complaint details copied with beautiful emojis!"', req3);

fs.writeFileSync('src/App.tsx', c);
