const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');

function simpleReplace(marker, replacement) {
  // we will replace the block starting at `onClick={() => {`  and ending at `copyToClipboard(..., "...")`
  // We'll find it by searching for the exact emoji phrase.
}

// Inquiry
const inqStr = \`"Inquiry details copied with beautiful emojis!",\n                                                  );\n                                                }}\`;
const inqIdx = c.indexOf(inqStr);
if (inqIdx !== -1) {
  const onClickIdx = c.lastIndexOf("onClick={(e) => {", inqIdx);
  if (onClickIdx !== -1) {
    const replacement = \`onClick={(e) => {
                                                  e.stopPropagation();
                                                  const text = generateInquiryCopyText(inq);
                                                  copyToClipboard(text, "Inquiry details copied!");
                                                }}\`;
    c = c.substring(0, onClickIdx) + replacement + c.substring(inqIdx + inqStr.length);
  }
}

// Complaint 1
const compStr1 = \`"Complaint details copied with beautiful emojis!",\n                                                            );\n                                                          }}\`;
let compIdx = c.indexOf(compStr1);
if (compIdx !== -1) {
  const onClickIdx = c.lastIndexOf("onClick={() => {", compIdx);
  if (onClickIdx !== -1) {
    const replacement = \`onClick={() => {
                                                            const text = generateComplaintCopyText(comp);
                                                            copyToClipboard(text, "Complaint details copied!");
                                                          }}\`;
    c = c.substring(0, onClickIdx) + replacement + c.substring(compIdx + compStr1.length);
  }
}

// Complaint 2
const compStr2 = \`"Complaint details copied with beautiful emojis!",\n                                                          );\n                                                        }}\`;
compIdx = c.indexOf(compStr2);
if (compIdx !== -1) {
  const onClickIdx = c.lastIndexOf("onClick={() => {", compIdx);
  if (onClickIdx !== -1) {
    const replacement = \`onClick={() => {
                                                          const text = generateComplaintCopyText(comp);
                                                          copyToClipboard(text, "Complaint details copied!");
                                                        }}\`;
    c = c.substring(0, onClickIdx) + replacement + c.substring(compIdx + compStr2.length);
  }
}

fs.writeFileSync('src/App.tsx', c);
