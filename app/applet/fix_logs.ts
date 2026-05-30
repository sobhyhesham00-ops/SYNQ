import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove DIRECT FIRESTORE SYNC panel
const startStr = '{/* Live Active Real-Time User Sessions Panel */}';
const endStr = '{/* Roster Grid */}';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);
if (startIndex !== -1 && endIndex !== -1) {
  code = code.slice(0, startIndex) + code.slice(endIndex);
}

// 2. Remove Cases from Agent Submission Log
const casesStart = code.indexOf('cases.forEach(cs => items.push({');
const casesEndStr = '// Apply Filters';
const casesEndIndex = code.indexOf(casesEndStr, casesStart);
if (casesStart !== -1 && casesEndIndex !== -1) {
  code = code.slice(0, casesStart) + code.slice(casesEndIndex);
}

// 3. Update filter logic
const filterLogicOld = `const typeMatch = logTypeFilter === 'all' || item.type.toLowerCase() === logTypeFilter.toLowerCase();`;
const filterLogicNew = `let typeMatch = false;\n                  if (logTypeFilter === 'pending') {\n                    typeMatch = item.status.toLowerCase() === 'pending';\n                  } else {\n                    typeMatch = logTypeFilter === 'all' || item.type.toLowerCase() === logTypeFilter.toLowerCase();\n                  }`;
code = code.replace(filterLogicOld, filterLogicNew);

// 4. Update Stats summary
code = code.replace(
  /const casesCount = filtered\.filter\(f => f\.type === 'Service Case'\)\.length;/,
  `const pendingCount = filtered.filter(f => f.status.toLowerCase() === 'pending').length;`
);

code = code.replace(
  /<span className="block text-xs uppercase text-slate-500 font-bold mb-1">Service Cases<\/span>\s*<span className="text-2xl font-black font-mono text-orange-400">\{casesCount\}<\/span>/,
  `<span className="block text-xs uppercase text-slate-500 font-bold mb-1">Pending Actions</span>\n                        <span className="text-2xl font-black font-mono text-orange-400">{pendingCount}</span>`
);

// 5. Update dropdown option
code = code.replace(
  /<option value="service case">Service Cases<\/option>/,
  `<option value="pending">Pending Queue (All items)</option>`
);

fs.writeFileSync('src/App.tsx', code);
