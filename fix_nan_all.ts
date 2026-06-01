import fs from 'fs';

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Find all JSX interpolations { ... }
  // To avoid false positives, we look for { } pairs without internal { }
  // which limits it to simple expressions.
  let res = content.replace(/\{([^}]+)\}/g, (match, inner) => {
    // If it's importing something, ignore
    if (match.includes('=>') || match.includes('.map') || !inner.trim()) return match;
    
    // Check if it's already patched with our custom logic
    if (inner.includes('isNaN')) return match; 
    
    // Check if it has math operators: /, *
    if (inner.includes('/') || inner.includes('*') || inner.includes('Math.')) {
       changed = true;
       return `{(() => { const _v = ${inner}; return isNaN(_v as any) ? 0 : _v; })()}`;
    }
    return match;
  });

  if (changed) {
     fs.writeFileSync(file, res);
     console.log("Patched", file);
  }
}

fixFile('src/App.tsx');
