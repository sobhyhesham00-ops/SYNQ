const fs = require('fs');
let code = fs.readFileSync('src/components/TabbyTamaraCard.tsx', 'utf8');

const ttrRefFunc = `  const formatTTRef = (id: string) => {
    const tsMatch = id.match(/(\\d{10,13})/);
    if (!tsMatch) return 'TTR-??????';
    const d = new Date(parseInt(tsMatch[1]));
    return \`TTR-\${d.getFullYear()}\${String(d.getMonth()+1).padStart(2,'0')}\${String(d.getDate()).padStart(2,'0')}-\${tsMatch[1].slice(-4)}\`;
  };

  const platformBadgeColor = `;

code = code.replace("  const platformBadgeColor = ", ttrRefFunc);

const headerSpanFind = `            <span className={\`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border \${platformBadgeColor}\`}>
              {req.platform === "one_time_payment" ? "One Time Paid" : req.platform}
            </span>`;

const headerSpanReplace = `            <span className={\`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border \${platformBadgeColor}\`}>
              {req.platform === "one_time_payment" ? "One Time Paid" : req.platform}
            </span>
            <span className="font-mono text-[10px] text-slate-500 font-bold tracking-wider">
              {formatTTRef(req.id)}
            </span>`;

code = code.replace(headerSpanFind, headerSpanReplace);
fs.writeFileSync('src/components/TabbyTamaraCard.tsx', code);
