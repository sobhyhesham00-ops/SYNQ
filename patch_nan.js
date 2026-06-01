const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const diffMins = parseFloat\(\(diffMs \/ 1000 \/ 60\)\.toFixed\(2\)\);/g,
  "let diffMins = parseFloat((diffMs / 1000 / 60).toFixed(2));\n            if (isNaN(diffMins)) diffMins = 0;"
);

// also protect {act.durationMinutes}m just in case
code = code.replace(
  /\{act\.durationMinutes\}m/g,
  "{isNaN(act.durationMinutes as any) ? '-' : act.durationMinutes}m"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched diffMins!");
