const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /useEffect\(\(\)\s*=>\s*\{(.*?)\}\s*,\s*\[(.*?)\]\s*\)/gs;
let match;
while ((match = regex.exec(code)) !== null) {
  const body = match[1];
  const deps = match[2].split(',').map(s => s.trim());
  
  deps.forEach(dep => {
     if (!dep) return;
     // The setter for `dep` is usually `set` + capitalized `dep`, e.g. setTimeLogs
     const capitalized = dep.charAt(0).toUpperCase() + dep.slice(1);
     const setter = `set${capitalized.split('.')[0]}`; // handle something.length
     
     if (body.includes(setter)) {
       console.log(`BINGO! Effect depends on ${dep} and calls ${setter}!`);
       console.log(body);
     }
  });
}
