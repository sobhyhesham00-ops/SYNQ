const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

const replacements = [
  // Backgrounds
  [/bg-slate-950/g, 'bg-slate-50'],
  [/bg-slate-900/g, 'bg-slate-100'],
  [/bg-slate-800(\/\\d+)?/g, (match) => match.includes('/') ? 'bg-white' + match.substring(match.indexOf('/')) : 'bg-white'],
  [/bg-slate-700(\/\\d+)?/g, (match) => match.includes('/') ? 'bg-slate-50' + match.substring(match.indexOf('/')) : 'bg-slate-50'],
  [/bg-slate-600/g, 'bg-slate-100'],
  [/bg-gray-900/g, 'bg-slate-50'],
  [/bg-gray-800/g, 'bg-white'],
  [/bg-gray-700/g, 'bg-slate-50'],
  
  // Borders
  [/border-slate-800/g, 'border-slate-200'],
  [/border-slate-700/g, 'border-slate-200'],
  [/border-slate-600/g, 'border-slate-300'],
  [/divide-slate-800/g, 'divide-slate-200'],
  [/divide-slate-700/g, 'divide-slate-200'],
  [/ring-slate-800/g, 'ring-slate-200'],
  [/ring-slate-700/g, 'ring-slate-200'],

  // Text colors
  [/text-slate-100/g, 'text-slate-900'],
  [/text-slate-200/g, 'text-slate-800'],
  [/text-slate-300/g, 'text-slate-700'],
  [/text-slate-400/g, 'text-slate-500'],
  [/text-slate-500/g, 'text-slate-400'], // swapping 400 and 500 can be tricky, might overlap. Let's do a temporary swap
];

// For text colors, to avoid swapping overlapping numbers (e.g. 500->400 then 400->500 back):
code = code.replace(/text-slate-100/g, '__TEXT_900__')
           .replace(/text-slate-200/g, '__TEXT_800__')
           .replace(/text-slate-300/g, '__TEXT_700__')
           .replace(/text-slate-400/g, '__TEXT_600__')
           .replace(/text-slate-500/g, '__TEXT_500__');

code = code.replace(/__TEXT_900__/g, 'text-slate-900')
           .replace(/__TEXT_800__/g, 'text-slate-800')
           .replace(/__TEXT_700__/g, 'text-slate-700')
           .replace(/__TEXT_600__/g, 'text-slate-600')
           .replace(/__TEXT_500__/g, 'text-slate-500');

// Hover states
code = code.replace(/hover:bg-slate-800/g, 'hover:bg-slate-50')
           .replace(/hover:bg-slate-700/g, 'hover:bg-slate-100')
           .replace(/hover:bg-slate-600/g, 'hover:bg-slate-200');

for (const [regex, repl] of replacements.slice(0, 15)) {
  code = code.replace(regex, repl);
}

fs.writeFileSync(p, code);
console.log('Colors modified.');
