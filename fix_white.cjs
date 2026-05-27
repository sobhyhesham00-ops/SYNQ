const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

// revert text-slate-900 back to text-white when used with primary colored backgrounds (like buttons)
code = code.replace(/bg-indigo-500(\s|[^"']*)text-slate-900/g, 'bg-indigo-500$1text-white');
code = code.replace(/bg-indigo-600(\s|[^"']*)text-slate-900/g, 'bg-indigo-600$1text-white');
code = code.replace(/bg-blue-600(\s|[^"']*)text-slate-900/g, 'bg-blue-600$1text-white');
code = code.replace(/bg-emerald-500(\s|[^"']*)text-slate-900/g, 'bg-emerald-500$1text-white');
code = code.replace(/bg-rose-500(\s|[^"']*)text-slate-900/g, 'bg-rose-500$1text-white');
code = code.replace(/bg-purple-500(\s|[^"']*)text-slate-900/g, 'bg-purple-500$1text-white');

// Sometimes they are in reverse order
code = code.replace(/text-slate-900(\s|[^"']*)bg-indigo-500/g, 'text-white$1bg-indigo-500');
code = code.replace(/text-slate-900(\s|[^"']*)bg-indigo-600/g, 'text-white$1bg-indigo-600');
code = code.replace(/text-slate-900(\s|[^"']*)bg-blue-600/g, 'text-white$1bg-blue-600');
code = code.replace(/text-slate-900(\s|[^"']*)bg-emerald-500/g, 'text-white$1bg-emerald-500');
code = code.replace(/text-slate-900(\s|[^"']*)bg-rose-500/g, 'text-white$1bg-rose-500');

fs.writeFileSync(p, code);
