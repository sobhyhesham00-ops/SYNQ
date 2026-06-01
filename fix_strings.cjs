const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Match any double string quote opening, then anything before a literal newline, then anything else closing with double quote.
// But it's easier to just fix the two broken items.
content = content.replace(
  'digest += "=================================================\\n\\n";',
  'digest += "=================================================\\\\n\\\\n";'
);

content = content.replace(
  'digest += "-------------------------------------------------\\n";',
  'digest += "-------------------------------------------------\\\\n";'
);


fs.writeFileSync('src/App.tsx', content);

console.log('Done Display Replacement');
