const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

function extractAndReplace(c, marker, replacement) {
  let idx = c.indexOf(marker);
  if (idx !== -1) {
    let startIdx = c.lastIndexOf('onClick={(e) => {', idx);
    let altStartIdx = c.lastIndexOf('onClick={() => {', idx);
    
    // Choose whichever is closer to idx
    let finalStart = Math.max(startIdx, altStartIdx);
    if (finalStart !== -1) {
      let endIdx = c.indexOf('}}', idx) + 2;
      c = c.substring(0, finalStart) + replacement + c.substring(endIdx);
    }
  }
  return c;
}

c = extractAndReplace(c, '"Inquiry details copied with beautiful emojis!"',
\`onClick={(e) => {
                                                  e.stopPropagation();
                                                  const text = generateInquiryCopyText(inq);
                                                  copyToClipboard(text, "Inquiry details copied!");
                                                }}\`);

c = extractAndReplace(c, '"Complaint details copied with beautiful emojis!"',
\`onClick={() => {
                                                            const text = generateComplaintCopyText(comp);
                                                            copyToClipboard(text, "Complaint details copied!");
                                                          }}\`);

c = extractAndReplace(c, '"Complaint details copied with beautiful emojis!"',
\`onClick={() => {
                                                          const text = generateComplaintCopyText(comp);
                                                          copyToClipboard(text, "Complaint details copied!");
                                                        }}\`);

fs.writeFileSync('src/App.tsx', c);
