const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// I will find where the unterminated string is and close it, or rather replace the weird \n sequence with proper ones.
let lines = content.split('\\n');

let problematicLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const csvContent = "Agent Name,Email') && lines[i].length > 1000) {
    problematicLine = i;
    break;
  }
}

if (problematicLine !== -1) {
  console.log("Found problematic line at", problematicLine);
  // We need to replace all literal '\n' inside this line with actual newlines, 
  // EXCEPT the ones that are inside the csvContent string!
  
  // Actually, wait, \n is exactly what I broke.
  // The line contains: const csvContent = "Agent Name... Hassan\n                                     setUploadError...
  // Let's just replace `Hassan\\n` with `Hassan";\n`
  
  let lineStr = lines[problematicLine];
  // Fix the missing closing quote for csvContent.
  lineStr = lineStr.replace('Amira Hassan\\nJane Smith,jane@example.com,555-0122,Social Media,Moderator,tl,Hesham Sobhy";', 'Amira Hassan\\nJane Smith,jane@example.com,555-0122,Social Media,Moderator,tl,Hesham Sobhy";'); // Wait it already has it!?
  
  // Let's replace the literal "\n" sequence with actual newline characters!
  lineStr = lineStr.replace(/\\n/g, '\\n');
  
  lines[problematicLine] = lineStr;
  
  fs.writeFileSync('src/App.tsx', lines.join('\\n'));
  console.log('Fixed');
} else {
  console.log('Could not find line');
}
