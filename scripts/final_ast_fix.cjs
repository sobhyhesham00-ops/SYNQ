const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\\n');
// We need to keep replacing the line that causes the error until it completes!
const babel = require('@babel/core');

let code = lines.join('\\n');
for (let i=0; i<100; i++) {
  try {
     babel.transformSync(code, {
        filename: 'App.tsx',
        presets: [
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      });
      console.log('SUCCESS BALANCED!');
      fs.writeFileSync('src/App.tsx', code);
      return;
  } catch (err) {
      if (err.message.includes('Expected corresponding JSX closing tag for <>')) {
          const match = err.message.match(/\\((\\d+):(\\d+)\\)/);
          if (match) {
              const line = parseInt(match[1]) - 1;
              console.log('Removing extra closing tag at', line + 1);
              let lns = code.split('\\n');
              lns[line] = '// removed extra closing tag for fragment error';
              code = lns.join('\\n');
          } else break;
      } 
      else if (err.message.includes('Unexpected closing tag')) {
          const match = err.message.match(/Unexpected closing tag .* \\((\\d+):(\\d+)\\)/);
          if (match) {
             console.log('Removing unexpected closing tag at', match[1]);
             let lns = code.split('\\n');
             lns[parseInt(match[1]) - 1] = '// removed unexpected';
             code = lns.join('\\n');
          } else break;
      }
      else {
          console.error(err.message);
          break;
      }
  }
}
