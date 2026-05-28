const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');

// Find all useEffect blocks
const regex = /useEffect\(\(\)\s*=>\s*\{(.*?)\}\s*,\s*\[(.*?)\]\s*\)/gs;
let match;
while ((match = regex.exec(code)) !== null) {
  const depsString = match[2];
  const deps = depsString.split(',').map(s => s.trim());
  
  // For each dependency, let's see if it's declared in App.tsx using const/let, but NOT useState/useMemo/useRef.
  deps.forEach(dep => {
     if (!dep) return;
     // Let's search for "const dep =" or "let dep =" 
     // and see if it looks like a local object/array
     const declRegex = new RegExp(`(?:const|let)\\s+${dep}\\s*=\\s*(.*?);`, 'g');
     let declMatch;
     while ((declMatch = declRegex.exec(code)) !== null) {
       const declSnippet = declMatch[1];
       if (declSnippet.includes('useMemo') || declSnippet.includes('useState') || declSnippet.includes('useRef') || declSnippet.includes('useApp') || declSnippet.includes('useSync')) {
          continue; // safe
       }
       // If it's something else!
       console.log(`Suspicious dependency: ${dep} declared as: ${declSnippet.substring(0, 50)}`);
     }
  });
}
