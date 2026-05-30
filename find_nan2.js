const fs = require('fs');

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (/>\s*\{[^}]+\}\s*</.test(line)) {
      // It has an expression as a child.
      let expr = line.match(/>\s*\{([^}]+)\}\s*</)[1];
      
      // Let's check if it does math directly like / or * or + and could be NaN
      // if it has length, it's usually safe, unless divided by length
      if (expr.includes('/') || expr.includes('*') || expr.includes('Math.round') || expr.includes('toFixed')) {
        console.log(`${filePath}:${index + 1}: ${line.trim()}`);
      }
    }
  });
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = `${dir}/${file}`;
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      scanFile(fullPath);
    }
  });
}

scanDir('src');
