const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /^\s*set[A-Z][A-Za-z0-9]+\(/gm;
let result;
while ((result = regex.exec(code)) !== null) {
  // Let's get the 2 lines before it.
  const idx = result.index;
  const snippet = code.substring(Math.max(0, idx - 150), idx + 100);
  
  if (!snippet.includes('onClick') && !snippet.includes('onChange') && !snippet.includes('=>') && !snippet.includes('function') && !snippet.includes('useEffect') && !snippet.includes('catch') && !snippet.includes('then')) {
     console.log("Suspicious:\n" + snippet + "\n");
  }
}
