import fs from 'fs';
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
   lines[i] = lines[i].replace(/text-gray-900/g, 'text-slate-100');
   lines[i] = lines[i].replace(/text-gray-600/g, 'text-slate-300');
   lines[i] = lines[i].replace(/text-gray-500/g, 'text-slate-400');
   
   // Check if we did any other bad global replaces
   lines[i] = lines[i].replace(/bg-white border text-slate-100 border-gray-200 rounded-3xl shadow-sm p-6/g, 'bg-white/5 border text-slate-100 border-white/10 rounded-3xl shadow-sm p-6');
   lines[i] = lines[i].replace(/bg-white border border-gray-200 rounded-3xl shadow-sm text-slate-100/g, 'bg-white/5 border border-white/10 rounded-3xl shadow-sm text-slate-100');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
