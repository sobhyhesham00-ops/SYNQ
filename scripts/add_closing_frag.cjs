const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\\n');
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('  );')) {
     lines.splice(i, 0, '    </>'); // insert </> before );
     break;
  }
}
fs.writeFileSync('src/App.tsx', lines.join('\\n'));
console.log('Inserted </>');
