const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{showInstallBtn && \(currentUser\.role === 'tl' \|\| currentUser\.role === 'admin' \|\| currentUser\.role === 'director'\) && \(/g,
  `{showInstallBtn && (
                    currentUser.role === 'tl' || 
                    currentUser.role === 'admin' || 
                    currentUser.role === 'director' || 
                    (currentUser.role === 'agent' && !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
                  ) && (`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed agent install visibility for PC only');
