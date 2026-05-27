const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = '  return (\\n    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">';
const replacement = '  return (\\n    <>\\n    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">';

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  
  let lines = code.split('\\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('  );')) {
       lines.splice(i, 0, '    </>'); // insert </> before );
       break;
    }
  }

  code = lines.join('\\n');
  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed fragment matching exactly');
} else {
  console.log('Target string not found!');
}
