const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

const navStartPattern = '<nav className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">';
const navStart = code.indexOf(navStartPattern);
const navEnd = code.indexOf('</nav>', navStart) + 6;

const newNav = fs.readFileSync(require('path').join(__dirname, 'nav_contents.txt'), 'utf8');

if (navStart !== -1 && navEnd !== -1) {
  code = code.substring(0, navStart) + newNav + code.substring(navEnd);
  fs.writeFileSync(p, code);
  console.log("Replaced Sidebar via file");
} else {
  console.log("Could not find boundaries");
}
