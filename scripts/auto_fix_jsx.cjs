const fs = require('fs');
const babel = require('@babel/core');

function fixJSX() {
  let code = fs.readFileSync('src/App.tsx', 'utf-8');
  let iterations = 0;
  
  while (iterations < 50) {
    try {
      babel.transformSync(code, {
        filename: 'App.tsx',
        presets: [
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      });
      console.log('Success! AST is valid.');
      fs.writeFileSync('src/App.tsx', code);
      return;
    } catch (err) {
      if (err.message.includes('Expected corresponding JSX closing tag for')) {
         // It means we are MISSING a closing tag!
         // "Expected corresponding JSX closing tag for <tag>"
         // This is harder. But usually that means we deleted a closing tag in the end.
         throw err;
      } else if (err.message.includes('Unexpected token')) {
         // Error format: Unexpected token (line:col)
         const match = err.message.match(/\\((\\d+):(\\d+)\\)/);
         if (match) {
             console.log('Unexpected token at', match[1], match[2]);
             const lines = code.split('\\n');
             const lineIdx = parseInt(match[1]) - 1;
             lines[lineIdx] = '// ' + lines[lineIdx];
             code = lines.join('\\n');
         } else {
             throw err;
         }
      } else if (err.message.includes('Unexpected closing tag')) {
          // Expected corresponding JSX closing tag for <header> (908:4)
          // Wait, Error: Expected corresponding JSX closing tag for <XYZ>
          throw err;
      } else {
         const match = err.message.match(/\\((\\d+):(\\d+)\\)/);
         if (match) {
             const lines = code.split('\\n');
             const lineIdx = parseInt(match[1]) - 1;
             lines[lineIdx] = '// ' + lines[lineIdx];
             code = lines.join('\\n');
         } else {
             console.error(err);
             throw err; // Stop if we don't know how to fix
         }
      }
    }
    iterations++;
  }
}

fixJSX();
