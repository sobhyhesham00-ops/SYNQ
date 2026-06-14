const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const adminDef = `const isGlobalAdminUser = currentUser?.name?.toLowerCase() === "h.sobhy" ||
                            currentUser?.name?.toLowerCase() === "hesham sobhy" ||
                            currentUser?.name?.toLowerCase() === "hesso" ||
                            currentUser?.name?.toLowerCase() === "sobhyhesham00@gmail.com";
  const isSuperAdmin = currentUser?.role === "director";`

code = code.replace(/const isSuperAdmin = currentUser\?\.role === "director";/, adminDef);

// Replace the buildBtns
code = code.replace(/\{isSuperAdmin &&\s*buildBtn\(\s*"admin"/g, '{isGlobalAdminUser &&\n                          buildBtn(\n                            "admin"');

// Restrict tab view
code = code.replace(/\{activeTab === "admin" && \(/g, '{activeTab === "admin" && isGlobalAdminUser && (');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched tab visibility");
