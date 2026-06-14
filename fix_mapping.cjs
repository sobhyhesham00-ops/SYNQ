const fs = require('fs');
const files = ['src/components/ArticleManager.tsx', 'src/App.tsx'];
for (let f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\{ id: d\.id, \.\.\.d\.data\(\) \}/g, '{ ...d.data(), id: d.id }');
  fs.writeFileSync(f, c);
}
