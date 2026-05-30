import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  { search: /bg-slate-900 border border-white\/10/g, replace: 'bg-white/5 backdrop-blur-xl border border-white/20' },
  { search: /bg-slate-[0-9]{3} border border-white\/[0-9]+/g, replace: 'bg-white/5 backdrop-blur-xl border border-white/20' },
  { search: /bg-slate-900\/[0-9]+ border border-white\/[0-9]+/g, replace: 'bg-white/5 backdrop-blur-xl border border-white/20' },
  { search: /bg-slate-950\/[0-9]+ border border-white\/[0-9]+/g, replace: 'bg-white/5 backdrop-blur-xl border border-white/20' },
  { search: /bg-black\/[0-9]+ border border-white\/[0-9]+/g, replace: 'bg-white/5 backdrop-blur-xl border border-white/10' },
  { search: /bg-slate-900/g, replace: 'bg-[#1e1e1e]/40 backdrop-blur-lg' },
  { search: /bg-slate-950/g, replace: 'bg-transparent' },
  { search: /bg-slate-800/g, replace: 'bg-white/10 backdrop-blur-md' },
  { search: /bg-slate-700/g, replace: 'bg-white/20 backdrop-blur-md' }
];

for (const {search, replace} of replacements) {
  code = code.replace(search, replace);
}

fs.writeFileSync('src/App.tsx', code);
