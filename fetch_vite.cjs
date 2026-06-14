const http = require('http');
const fs = require('fs');

http.get('http://0.0.0.0:3000/src/App.tsx', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('ViteAppDump.txt', data);
    console.log("Length:", data.length);
  });
}).on('error', e => console.error(e));
