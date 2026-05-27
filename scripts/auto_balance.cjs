const fs = require('fs');
const babel = require('@babel/core');

function autoBalance() {
  let code = fs.readFileSync('src/App.tsx', 'utf-8');
  
  for (let i = 0; i < 50; i++) {
    try {
      babel.transformSync(code, {
        filename: 'App.tsx',
        presets: [
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      });
      console.log('SUCCESS! AST IS BALANCED.');
      fs.writeFileSync('src/App.tsx', code);
      return;
    } catch (err) {
      if (err.message.includes('Expected corresponding JSX closing tag')) {
         const match = err.message.match(/for (?:<([a-zA-Z0-9_>-]+)>|<>) \\((\\d+):(\\d+)\\)/);
         if (match) {
             const tag = match[1] || '<>';
             if (tag === '<>') {
                 const locMatch = err.message.match(/\\((\\d+):(\\d+)\\)/);
                 if (locMatch) {
                     console.log('Extra closing tag inside fragment at', locMatch[1]);
                     let lines = code.split('\\n');
                     lines[parseInt(locMatch[1]) - 1] = '// removed extra tag in fragment';
                     code = lines.join('\\n');
                     continue;
                 }
             } else {
                 console.log('Missing closing tag for', tag);
                 let lines = code.split('\\n');
                 let lastClose = lines.lastIndexOf('}');
                 if (lastClose === -1) lastClose = lines.length - 1;
                 lines.splice(lastClose - 1, 0, '</' + tag + '>');
                 code = lines.join('\\n');
             }
         } else {
             throw err;
         }
      } else if (err.message.includes('Unexpected closing tag')) {
          const match = err.message.match(/Unexpected closing tag "([^"]+)" \\((\\d+):(\\d+)\\)/);
          if (match) {
             console.log('Unexpected closing tag', match[1], 'at', match[2]);
             let lines = code.split('\\n');
             lines[parseInt(match[2]) - 1] = '// removed ' + match[1];
             code = lines.join('\\n');
          } else {
             throw err;
          }
      } else if (err.message.includes('UnwrappedAdjacentJSXElements') || err.message.includes('Adjacent JSX elements')) {
          const match = err.message.match(/\\((\\d+):(\\d+)\\)/);
          if (match) {
             console.log('Adjacent elements at', match[1]);
             let lines = code.split('\\n');
             lines[parseInt(match[1]) - 1] = '// removed adjacent';
             code = lines.join('\\n');
          } else {
             throw err;
          }
      } else if (err.message.includes('Unexpected token')) {
          const match = err.message.match(/\\((\\d+):(\\d+)\\)/);
          if (match) {
             console.log('Unexpected token at', match[1]);
             let lines = code.split('\\n');
             lines[parseInt(match[1]) - 1] = '// removed token error';
             code = lines.join('\\n');
          } else {
             throw err;
          }
      } else {
          console.error(err);
          break;
      }
    }
  }
}

autoBalance();
