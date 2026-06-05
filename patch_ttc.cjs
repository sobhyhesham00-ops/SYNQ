const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert formatCompRef right before getElapsedTimerString
const refFn = `  const formatCompRef = (id: string) => {
    const tsMatch = id?.match(/(\\d{10,13})/);
    if (!tsMatch) return 'TTC-??????';
    const d = new Date(parseInt(tsMatch[1]));
    return \`TTC-\${d.getFullYear()}\${String(d.getMonth() + 1).padStart(2, '0')}\${String(d.getDate()).padStart(2, '0')}-\${tsMatch[1].slice(-4)}\`;
  };

  const getElapsedTimerString = (`;

if (!code.includes('formatCompRef =')) {
  code = code.replace('  const getElapsedTimerString = (', refFn);
}

// Inject in status badges
const targetHtml = `                                                    {/* Status Badges */}
                                                    <div className="text-right flex flex-col items-end gap-1 shrink-0 font-sans">
                                                      {isPendingTL && (`;

const replaceHtml = `                                                    {/* Status Badges */}
                                                    <div className="text-right flex flex-col items-end gap-1 shrink-0 font-sans">
                                                      <span className="font-mono text-[10px] text-slate-500 font-bold tracking-wider mb-1">
                                                        {formatCompRef(comp.id)}
                                                      </span>
                                                      {isPendingTL && (`;

if (code.includes(targetHtml)) {
  code = code.replace(targetHtml, replaceHtml);
  console.log("Successfully patched render portion.");
}

fs.writeFileSync('src/App.tsx', code);
