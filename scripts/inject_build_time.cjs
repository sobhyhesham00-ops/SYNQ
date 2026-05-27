
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../public/meta.json');
try {
  const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
  meta.build_time = Date.now();
  meta.build_hash = require('crypto').randomBytes(8).toString('hex');
  fs.writeFileSync(file, JSON.stringify(meta, null, 2));
} catch(e){}
