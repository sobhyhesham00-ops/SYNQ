import fs from 'fs';

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (/>\s*\{[^}]+\}\s*</.test(line)) {
      let match = line.match(/>\s*\{([^}]+)\}\s*</);
      if (match) {
        let expr = match[1];
        if (expr.includes('/') || expr.includes('*') || expr.includes('Math.round') || expr.includes('toFixed') || expr.includes('isNaN')) {
          console.log(`${filePath}:${index + 1}: ${line.trim()}`);
        }
      }
    }
  });
}

function scanDir(dir: string) {
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
