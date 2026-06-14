const fs = require('fs');
let code = fs.readFileSync('src/components/SuperAdminControl.tsx', 'utf8');

// replace isGlobalAdminUser with currentUser?.role === "director"
code = code.replace(/const isGlobalAdminUser = [\s\S]*?;\n/, 'const isGlobalAdminUser = currentUser?.role === "director";\n');

fs.writeFileSync('src/components/SuperAdminControl.tsx', code);
console.log("Patched SuperAdminControl");
