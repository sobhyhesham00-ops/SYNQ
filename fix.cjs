const fs = require('fs');
let c = fs.readFileSync('src/components/GlobalDashboard.tsx', 'utf8');
c = c.replace(/handleCopyComplaint\(item.data\)/g, 'handleCopyComplaint(e, item.data as any)');
fs.writeFileSync('src/components/GlobalDashboard.tsx', c);
