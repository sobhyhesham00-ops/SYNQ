const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');

function simpleReplace(marker, replacementText) {
  let idx = c.indexOf(marker);
  if (idx !== -1) {
    let startIdx = c.lastIndexOf('onClick={(e) => {', idx);
    let altStartIdx = c.lastIndexOf('onClick={() => {', idx);
    let finalStart = Math.max(startIdx, altStartIdx);
    if (finalStart !== -1) {
      let endIdx = c.indexOf('}}', idx) + 2;
      c = c.substring(0, finalStart) + replacementText + c.substring(endIdx);
    }
  }
}

simpleReplace('"Inquiry details copied with beautiful emojis!"', 
  "onClick={(e) => {\\n" +
  "                                                  e.stopPropagation();\\n" +
  "                                                  const text = generateInquiryCopyText(inq);\\n" +
  "                                                  copyToClipboard(text, \\"Inquiry details copied!\\");\\n" +
  "                                                }}"
);

simpleReplace('"Complaint details copied with beautiful emojis!"', 
  "onClick={() => {\\n" +
  "                                                            const text = generateComplaintCopyText(comp);\\n" +
  "                                                            copyToClipboard(text, \\"Complaint details copied!\\");\\n" +
  "                                                          }}"
);

simpleReplace('"Complaint details copied with beautiful emojis!"', 
  "onClick={() => {\\n" +
  "                                                          const text = generateComplaintCopyText(comp);\\n" +
  "                                                          copyToClipboard(text, \\"Complaint details copied!\\");\\n" +
  "                                                        }}"
);

fs.writeFileSync('src/App.tsx', c);
