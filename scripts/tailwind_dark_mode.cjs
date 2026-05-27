const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

const replacements = [
    { regex: /\bbg-slate-900(\/[0-9]+)?\b/g, replacement: (match) => `bg-white dark:${match}` },
    { regex: /\bbg-slate-800(\/[0-9]+)?\b/g, replacement: (match) => `bg-slate-50 dark:${match}` },
    { regex: /\btext-slate-50\b/g, replacement: 'text-slate-900 dark:text-slate-50' },
    { regex: /\btext-slate-100\b/g, replacement: 'text-slate-800 dark:text-slate-100' },
    { regex: /\btext-slate-200\b/g, replacement: 'text-slate-700 dark:text-slate-200' },
    { regex: /\btext-slate-300\b/g, replacement: 'text-slate-600 dark:text-slate-300' },
    { regex: /\btext-slate-400\b/g, replacement: 'text-slate-500 dark:text-slate-400' },
    { regex: /\bborder-slate-700(\/[0-9]+)?\b/g, replacement: (match) => `border-slate-200 dark:${match}` },
    { regex: /\bborder-slate-600(\/[0-9]+)?\b/g, replacement: (match) => `border-slate-300 dark:${match}` },
    { regex: /\bborder-white(\/[0-9]+)?\b/g, replacement: (match) => `border-black/5 dark:${match}` }
];

for (const { regex, replacement } of replacements) {
    code = code.replace(regex, replacement);
}

fs.writeFileSync('src/App.tsx', code);
console.log('App tailwind classes patched for dark mode support!');
