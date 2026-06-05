const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<CopyWrap text={comp.phoneNumber || \'\'} label="Phone">',
  '<CopyWrap text={(comp.phoneNumber || \'\').replace(/^0+/, \'\')} label="Phone">'
);
code = code.replace(
  'Phone: ${comp.phoneNumber}',
  'Phone: ${(comp.phoneNumber || \'\').replace(/^0+/, \'\')}'
);
code = code.replace(
  '*Phone Number:* ${comp.phoneNumber}',
  '*Phone Number:* ${(comp.phoneNumber || \'\').replace(/^0+/, \'\')}'
);

fs.writeFileSync('src/App.tsx', code);
