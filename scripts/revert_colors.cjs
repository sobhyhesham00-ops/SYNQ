const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

// Colors
const replacements = [
  [/bg-slate-50\\b(?! border-slate-200 shadow-xl)/g, 'bg-slate-950'], 
  [/bg-slate-100\\b/g, 'bg-slate-900'],
  [/bg-white\\b/g, 'bg-slate-800'],
  [/border-slate-200/g, 'border-slate-800'],
  [/border-slate-300/g, 'border-slate-700'],
  [/divide-slate-200/g, 'divide-slate-800'],
  [/ring-slate-200/g, 'ring-slate-800'],
  [/text-slate-900/g, '__TEXT_100__'],
  [/text-slate-800/g, '__TEXT_200__'],
  [/text-slate-700/g, '__TEXT_300__'],
  [/text-slate-600/g, '__TEXT_400__'],
  [/text-slate-500/g, '__TEXT_500__'],
];

for (const [regex, repl] of replacements) {
  code = code.replace(regex, repl);
}

code = code.replace(/__TEXT_100__/g, 'text-slate-100')
           .replace(/__TEXT_200__/g, 'text-slate-200')
           .replace(/__TEXT_300__/g, 'text-slate-300')
           .replace(/__TEXT_400__/g, 'text-slate-400')
           .replace(/__TEXT_500__/g, 'text-slate-500');

code = code.replace(/hover:bg-slate-50\\b/g, 'hover:bg-slate-800')
           .replace(/hover:bg-slate-100\\b/g, 'hover:bg-slate-700')
           .replace(/hover:bg-slate-200\\b/g, 'hover:bg-slate-600');

code = code.replace(/bg-slate-950 border border-slate-800 shadow-xl/g, 'bg-slate-800 border border-slate-700 shadow-xl');
code = code.replace(/bg-slate-800 border border-slate-800 shadow-xl/g, 'bg-slate-800 border border-slate-700 shadow-xl');
code = code.replace(/"T&T Complaints"/g, '"Complaints"');

// Password regex: uppercase and special
const pwdCheckStr = "if (!password) { setError('Please enter password'); return; }\\n    if (!/^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/.test(password)) {\\n      setError('Password must contain at least one capital letter and one special character.');\\n      return;\\n    }";
code = code.replace(/if \\(!password\\) \\{\\s*setError\\('Please enter password'\\);\\s*return;\\s*\\}/, pwdCheckStr);

const pwdCheckStr2 = "setError('Please choose a password'); return; }\\n    if (!/^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/.test(newPassword)) {\\n      setError('Password must contain at least one capital letter and one special character.');\\n      return;";
code = code.replace(/setError\\('Please choose a password'\\);\\s*return;/, pwdCheckStr2);

// Add Spellcheck prop
code = code.replace(/<input\\s/g, '<input spellCheck="true" ');
code = code.replace(/<textarea\\s/g, '<textarea spellCheck="true" ');

fs.writeFileSync(p, code);
console.log('Done mapping things.');
