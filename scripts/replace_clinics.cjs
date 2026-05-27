const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<option value="Dermadent vip"[\s\S]*?<option value="newage" [^>]*>NewAge<\/option>/g;
const replacement = `<option value="dermadent" className="bg-slate-800 text-slate-100 ">Dermadent</option>
<option value="onetouch1" className="bg-slate-800 text-slate-100 ">One Touch 1 AlMu'tarid</option>
<option value="onetouch2" className="bg-slate-800 text-slate-100 ">One Touch 2 Markhaniya</option>
<option value="welltouch" className="bg-slate-800 text-slate-100 ">WellTouch</option>
<option value="newedge" className="bg-slate-800 text-slate-100 ">New Edge</option>`;

let count = 0;
code = code.replace(regex, (match) => {
    count++;
    const matchLines = match.split('\n');
    let indent = '                                  ';
    if (matchLines[0].match(/^(\s+)/)) {
        indent = matchLines[0].match(/^(\s+)/)[1];
    }
    const lines = replacement.split('\n');
    return lines.map((l, i) => i === 0 ? matchLines[0].match(/^\s*/)[0] + l.trim() : indent + l).join('\n');
});

fs.writeFileSync('src/App.tsx', code);
console.log(`Replaced ${count} occurrences.`);
