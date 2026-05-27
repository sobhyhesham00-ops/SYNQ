const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace <User/> with <UserIcon />
code = code.replace(/<User /g, '<UserIcon ');

// Change the lucide-react import of User
code = code.replace(/  User,/, '  User as UserIcon,');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed User import conflict');
