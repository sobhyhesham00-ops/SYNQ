const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf-8');
try { babel.parse(code, {plugins:['jsx', 'typescript']}); console.log('ok'); } catch(e) { console.error(e.message); }