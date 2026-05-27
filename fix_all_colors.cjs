const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

// Replace hover states
code = code.replace(/hover:bg-slate-100/g, 'hover:bg-slate-800');
code = code.replace(/hover:bg-slate-200/g, 'hover:bg-slate-700');
code = code.replace(/hover:text-slate-900/g, 'hover:text-slate-100');
code = code.replace(/hover:text-slate-800/g, 'hover:text-slate-200');

// Replace buildBtn background colors
code = code.replace(/"bg-slate-100 border-slate-700"/g, '"bg-slate-800 border-slate-700"');
code = code.replace(/"bg-indigo-50 border-indigo-200"/g, '"bg-indigo-900 border-indigo-800"');
code = code.replace(/"bg-emerald-50 border-emerald-200"/g, '"bg-emerald-900 border-emerald-800"');
code = code.replace(/"bg-purple-50 border-purple-200"/g, '"bg-purple-900 border-purple-800"');
code = code.replace(/"bg-rose-50 border-rose-200"/g, '"bg-rose-900 border-rose-800"');

// Replace any lingering light backgrounds
code = code.replace(/\bbg-amber-50\b/g, 'bg-amber-900/50');
code = code.replace(/\bbg-blue-50\b/g, 'bg-blue-900/50');
code = code.replace(/\bbg-red-50\b/g, 'bg-red-900/50');
code = code.replace(/\bbg-orange-50\b/g, 'bg-orange-900/50');
code = code.replace(/\bbg-sky-50\b/g, 'bg-sky-900/50');

code = code.replace(/\bborder-amber-200\b/g, 'border-amber-800');
code = code.replace(/\bborder-rose-200\b/g, 'border-rose-800');
code = code.replace(/\bborder-blue-200\b/g, 'border-blue-800');
code = code.replace(/\bborder-red-200\b/g, 'border-red-800');
code = code.replace(/\bborder-orange-200\b/g, 'border-orange-800');
code = code.replace(/\bborder-sky-200\b/g, 'border-sky-800');

// Replace standard colors if they were missed
code = code.replace(/bg-white\b(?!(\/5|\/10|\/20))/g, 'bg-slate-800');
code = code.replace(/text-gray-900\b/g, 'text-slate-100');
code = code.replace(/text-gray-800\b/g, 'text-slate-200');
code = code.replace(/text-gray-700\b/g, 'text-slate-300');
code = code.replace(/text-gray-600\b/g, 'text-slate-400');
code = code.replace(/text-gray-500\b/g, 'text-slate-500');

// Dark dropdown menus and selects
code = code.replace(/bg-slate-950 border border-slate-800 shadow-xl/g, 'bg-slate-800 border border-slate-700 shadow-xl');
code = code.replace(/bg-slate-50\b/g, 'bg-slate-900');
code = code.replace(/bg-slate-100\b/g, 'bg-slate-800');
code = code.replace(/bg-slate-200\b/g, 'bg-slate-700');

fs.writeFileSync(p, code);
console.log('Colors replaced successfully');
