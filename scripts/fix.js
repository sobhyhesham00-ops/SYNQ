const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I need to find the exact block inserted by moveBlock2.cjs
const startTag = `                    {/* Admin Headcount Upload Control */}\n                    {isMasterAdmin && (\n`;
const iStart = code.indexOf(startTag);

if (iStart === -1) {
    console.log("Could not find the injected block.");
    process.exit(1);
}

// Find the corresponding closing )}
const innerStart = iStart + startTag.length;
const endTag = `                        </div>\n                    )}\n`;
// the string inside has `</div>\n                    )}\n` but it ends at line 3206
// it's probably best to find the exact end.
const endOfInjected = code.indexOf(endTag, innerStart);

if (endOfInjected === -1) {
  console.log("Could not find end of injected block.");
  process.exit(1);
}

const fullEndIndex = endOfInjected + endTag.length;

// Extract the raw INNER block that was originally deleted.
// In moveBlock2.cjs, newBlock = startTag + block.split('\n').map(l => '  '+l).join('\n') + `\n                    )}\n`;
// So the lines have an extra '  ' prefix. We will trim it.
const rawInjected = code.substring(innerStart, endOfInjected + 30); // up to `</div>`

let originalBlockLines = rawInjected.split('\n');
originalBlockLines = originalBlockLines.map(l => {
    if (l.startsWith('  ')) return l.substring(2);
    return l;
});
const originalBlock = originalBlockLines.join('\n');


// Remove the injected block from code, resulting in the intermediate string
let intermediateCode = code.substring(0, iStart) + code.substring(fullEndIndex);

// Where should it go? In moveBlock2.cjs it came from `sIndex`!
// What was `sIndex`? We know `sIndex` was `intermediateCode.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 gap-4">')` in the ORIGINAL file.
// But wait, the intermediateCode DOES NOT HAVE the removed block. 
// However, the text before `sIndex` was UNTOUCHED in the first step!
// So where it should be inserted is exactly `sIndex`!
// But what was `sIndex`? We don't have the original file.
// But we DO have the intermediateCode. Where was it removed from?
// We can find out by looking for the code that surrounded it.
// The code originalBlock starts with `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">`
// And ends with `{isSyncingSheets ? 'Extracting Data...' : 'Extract From Sheet'}\n                           </button>\n                        </div>\n                      </div>`
// What was before it?
// Let's print out intermediateCode lines around where it might be.
// We know it was around line 2900 or whatever!
fs.writeFileSync('intermediate.ts', intermediateCode);
fs.writeFileSync('originalBlock.ts', originalBlock);
console.log("Saved intermediate and original block");
