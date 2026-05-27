const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix type issues
code = code.replace(
  /const dbUsers = snap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\);/g,
  `const dbUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));`
);

code = code.replace(
  /const minutes = parseInt\(fd\.get\('mins'\)\) \|\| 0;/g,
  `const minutes = parseInt(fd.get('mins') as string) || 0;`
);

if (!code.includes('  X,')) {
  code = code.replace(/} from 'lucide-react';/, "  X,\n} from 'lucide-react';");
}

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed linter errors');
