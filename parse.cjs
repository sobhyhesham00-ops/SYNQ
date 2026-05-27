const fs = require("fs");
const code = fs.readFileSync("src/App.tsx", "utf-8");

// Very naive JSX tag balancing
const tags = [];
const regex = /<\/?([a-zA-Z0-9_.-]+)[^>]*?>/g;
let match;
while ((match = regex.exec(code)) !== null) {
  const full = match[0];
  const tagName = match[1];

  let lineCount = code.substring(0, match.index).split("\n").length;

  if (full.endsWith("/>")) {
    continue; // Self-closing
  }

  if (full.startsWith("</")) {
    const last = tags.pop();
    if (last && last.tagName !== tagName) {
      console.log(`Mismatch at line ${lineCount}: expected ${last.tagName}, got ${tagName}`);
      tags.push(last); // push it back maybe?
    }
  } else {
    // Opening tag
    tags.push({ tagName, lineCount, full });
  }
}

for (let i = Math.max(0, tags.length - 10); i < tags.length; i++) {
  console.log(`Unclosed: ${tags[i].tagName} at line ${tags[i].lineCount}`);
}
