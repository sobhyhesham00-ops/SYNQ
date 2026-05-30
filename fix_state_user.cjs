const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/useState<UserIcon \| null>/g, 'useState<User | null>');
code = code.replace(/getStorageItem<UserIcon \| null>/g, 'getStorageItem<User | null>');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed UserIcon type error');
