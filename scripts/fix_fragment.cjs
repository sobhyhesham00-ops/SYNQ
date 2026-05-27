const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/return \\(\\s*<div className="flex h-screen bg-slate-50/m, "return (\\n    <>\\n    <div className=\\"flex h-screen bg-slate-50");

// Also the end of file:
//     </div>
//   );
// }
// Let's replace the last `);`
let lines = code.split('\\n');
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('  );')) {
     lines.splice(i, 0, '    </>'); // insert </> before );
     break;
  }
}

code = lines.join('\\n');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed fragment for real');
