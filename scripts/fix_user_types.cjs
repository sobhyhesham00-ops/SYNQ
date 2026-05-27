const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the types import
code = code.replace(/  User as UserIcon,\n  ScheduledShift,/, '  User,\n  ScheduledShift,');

// Ensure lucide-react has it
if (!code.includes('  User as UserIcon,\n  RefreshCw,')) {
  code = code.replace(/  UserCheck,\n  User as UserIcon,/, '  UserCheck,\n  User as UserIcon,');
}

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed imports');
