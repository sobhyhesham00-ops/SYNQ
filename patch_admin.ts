import fs from 'fs';
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* Admin Upload Console */}'));
if (startIdx !== -1) {
    let dirUploadIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes('{/* Bulk Application Directory Configuration Import */}'));
    if (dirUploadIdx !== -1) {
       lines.splice(startIdx, dirUploadIdx - startIdx);
       console.log('Removed duplicate Admin Upload Console');
    }
}

// Global replace of massive dark gradient backgrounds
for (let i = 0; i < lines.length; i++) {
   lines[i] = lines[i].replace(/bg-gradient-to-br from-[-a-zA-Z0-9\/\[\]#]+ via-[-a-zA-Z0-9\/\[\]#]+ to-[-a-zA-Z0-9\/\]\[#]+ border border-[-a-zA-Z0-9\/]+ rounded-3xl/g, 'bg-white border border-gray-200 rounded-3xl shadow-sm text-gray-900');
   lines[i] = lines[i].replace(/bg-gradient-to-b from-rose-950\/90 to-slate-950/g, 'bg-white');
   lines[i] = lines[i].replace(/bg-gradient-to-b from-[-a-zA-Z0-9\/\[\]#]+ to-slate-950/g, 'bg-white');
   lines[i] = lines[i].replace(/bg-white border border-gray-200 rounded-3xl shadow-sm text-gray-900 p-6 shadow-xl/, 'bg-white border text-gray-900 border-gray-200 rounded-3xl shadow-sm p-6');
   lines[i] = lines[i].replace(/text-slate-100/g, 'text-gray-900');
   lines[i] = lines[i].replace(/text-slate-300/g, 'text-gray-600');
   lines[i] = lines[i].replace(/text-slate-400/g, 'text-gray-500');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
