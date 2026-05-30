import fs from 'fs';

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  let currentMatch;
  const regex = /\{([^}]*(?:Math\.round|toFixed|reduce|isNaN|\/)[^}]*)\}/g;
  
  const lines = content.split('\n');
  lines.forEach((line, index) => {
      // Find expressions inside {...} that are part of JSX (basic heuristics)
      if (line.includes('<') || line.includes('className=')) {
          let matches = [...line.matchAll(regex)];
          matches.forEach(match => {
            console.log(`${filePath}:${index + 1}: ${match[0].trim()}`);
          });
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
