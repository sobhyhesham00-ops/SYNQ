const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

// The light_theme replacer might have caused some "bg-white border-slate-200" stuff.
// Let's ensure dropdowns have a nice shadow.
// E.g. "bg-white border border-slate-200" -> "bg-white border border-slate-200 shadow-xl"
// Let's replace "bg-slate-100 border border-slate-200 shadow-lg" where it occurs.

code = code.replace(/bg-slate-50 border border-slate-200 shadow-lg/g, 'bg-white border border-slate-200 shadow-xl rounded-xl');
code = code.replace(/bg-white border border-slate-200 shadow-lg/g, 'bg-white border border-slate-200 shadow-xl rounded-xl');
code = code.replace(/bg-white border border-slate-700 shadow-lg/g, 'bg-white border border-slate-200 shadow-xl rounded-xl');

// Since we had "bg-slate-800" replaced with "bg-white", let's make sure it looks good.
// "shadow-lg" is common for dropdowns.

fs.writeFileSync(p, code);
