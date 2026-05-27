const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the !isInstalled block and just start with !currentUser
const startIndex = code.indexOf('{!isInstalled && !currentUser ? (');
if (startIndex !== -1) {
  const loginScreenStart = code.indexOf(': !currentUser ? (', startIndex);
  if (loginScreenStart !== -1) {
    const replacement = '{!currentUser ? (';
    code = code.slice(0, startIndex) + replacement + code.slice(loginScreenStart + ': !currentUser ? ('.length);
  }
}

// 2. Hide the install button from login screen
code = code.replace(/\{showInstallBtn \? \([\s\S]*?\) : \([\s\S]*?\)\}/, '{/* Install prompt removed from login screen */}');

// 3. Make the sidebar install button only for TLs/Admins
code = code.replace(/\{showInstallBtn && \(/g, '{showInstallBtn && (currentUser.role === \'tl\' || currentUser.role === \'admin\' || currentUser.role === \'director\') && (');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed install screen and restricted downloads to TLs');
