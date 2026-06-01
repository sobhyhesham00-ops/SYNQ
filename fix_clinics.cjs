const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/<option value="onetouch" className="bg-slate-800 text-slate-100 ">One Touch<\/option>/g, 
  `<option value="onetouch_mo3tred" className="bg-slate-800 text-slate-100 ">One Touch Mo3tred</option>\n                                  <option value="onetouch_merkhnya" className="bg-slate-800 text-slate-100 ">One Touch Merkhnya</option>`);

c = c.replace(/\{ key: 'onetouch', display: 'One Touch', color: 'from-teal-400 to-emerald-500', textCol: 'text-emerald-300' \},/g, 
  `{ key: 'onetouch_mo3tred', display: 'One Touch Mo3tred', color: 'from-teal-400 to-emerald-500', textCol: 'text-emerald-300' },
                          { key: 'onetouch_merkhnya', display: 'One Touch Merkhnya', color: 'from-cyan-400 to-cyan-500', textCol: 'text-cyan-300' },`);

fs.writeFileSync('src/App.tsx', c);
console.log('Replaced clinics.');
