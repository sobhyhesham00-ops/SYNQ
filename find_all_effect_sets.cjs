const fs = require('fs');

function checkFile(filepath) {
  const code = fs.readFileSync(filepath, 'utf8');
  let inEffect = false;
  let effectStart = 0;
  let parentCount = 0;

  let effects = [];

  for (let i = 0; i < code.length; i++) {
    if (!inEffect && code.substring(i, i + 10) === 'useEffect(') {
      inEffect = true;
      effectStart = i;
      parentCount = 1;
      i += 9;
      continue;
    }
    if (inEffect) {
      if (code[i] === '(') parentCount++;
      if (code[i] === ')') parentCount--;
      if (parentCount === 0) {
        let effectBody = code.substring(effectStart, i + 1);
        
        let deps = [];
        const match = effectBody.match(/\}\s*,\s*\[(.*)\]\s*\)$/s);
        if (match) {
           deps = match[1].split(',').map(s => s.trim());
        }

        // Check if there's any loop: a setter being called inside
        const setters = new Set();
        let matchSets;
        const setRegex = /set[A-Z]\w*\(/g;
        while ((matchSets = setRegex.exec(effectBody)) !== null) {
          setters.add(matchSets[0].slice(0, -1));
        }

        effects.push({
           code: effectBody,
           deps,
           setters: Array.from(setters)
        });
        
        inEffect = false;
      }
    }
  }

  effects.forEach((eff, idx) => {
     // Output if there are setters
     if (eff.setters.length > 0) {
         console.log(`\n--- Effect ${idx + 1} in ${filepath} ---`);
         console.log(`Setters: ${eff.setters.join(', ')}`);
         console.log(`Deps: ${eff.deps.join(', ')}`);
         
         // Are there any setters updating state derived from deps implicitly?
     }
  });

}

checkFile('src/App.tsx');
