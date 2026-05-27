const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const missingIcons = ['User', 'Upload', 'Clock', 'X'];

missingIcons.forEach(icon => {
  if (!code.includes(icon + ',')) {
     code = code.replace(/} from 'lucide-react';/, `  ${icon},\n} from 'lucide-react';`);
  }
});

fs.writeFileSync('src/App.tsx', code);
console.log('Added missing icons');
