const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/,\n\s*, getClinicLabel/g, ',\n  getClinicLabel');
fs.writeFileSync('src/App.tsx', content);
