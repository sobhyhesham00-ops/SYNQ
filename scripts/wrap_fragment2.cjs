const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/\\s*return \\(\\s*<div className="flex h-screen/, "  return (\\n    <>\\n    <div className=\\"flex h-screen");
code = code.replace(/\\s*<\\/div>\\s*\\);\\s*}\\s*$/, "\\n    </div>\\n    </>\\n  );\\n}\\n");

fs.writeFileSync('src/App.tsx', code);
console.log('Wrapped');
