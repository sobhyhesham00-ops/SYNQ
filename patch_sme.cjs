const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace currentUser.role === "agent"
code = code.replace(/currentUser\.role === "agent"/g, '["agent", "sme"].includes(currentUser.role as string)');

// Replace currentUser?.role === "agent"
code = code.replace(/currentUser\?\.role === "agent"/g, '["agent", "sme"].includes(currentUser?.role as string)');

// Replace for Break & Lunch Assignment
code = code.replace(/\{\(currentUser\?\.role === "tl" \|\| isSuperAdmin\) &&\n(.*?)schedules\.length > 0 && \(/s,
  '{(currentUser?.role === "tl" || currentUser?.role === "sme" || isSuperAdmin) &&\n$1schedules.length > 0 && (');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched source");
