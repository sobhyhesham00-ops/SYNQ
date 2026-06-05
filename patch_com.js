const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('const formatComRef')) {
    code = code.replace(
        '  const formatCompRef = (id: string) => {',
        `  const formatComRef = (id: string) => {
    const tsMatch = id?.match(/(\\d{10,13})/);
    if (!tsMatch) return 'COM-??????';
    const d = new Date(parseInt(tsMatch[1]));
    return \`COM-\${d.getFullYear()}\${String(d.getMonth() + 1).padStart(2, '0')}\${String(d.getDate()).padStart(2, '0')}-\${tsMatch[1].slice(-4)}\`;
  };

  const formatCompRef = (id: string) => {`
    );
}

// Age label logic inside clientComms render:
const targetCommVars = `                                              const canProcessRequest =
                                                isInProgress &&
                                                (!req.openedBy ||
                                                  req.openedBy ===
                                                    currentUser?.name);`;

const replaceCommVars = `                                              const canProcessRequest =
                                                isInProgress &&
                                                (!req.openedBy ||
                                                  req.openedBy ===
                                                    currentUser?.name);
                                              const commAgeHours = (Date.now() - new Date(req.createdAt).getTime()) / 3600000;
                                              const commSLABadge = req.status === 'contacted' ? 'bg-emerald-500/10 text-emerald-400' : commAgeHours > 2 ? 'bg-red-500/20 text-red-400 animate-pulse' : commAgeHours > 0.5 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400';
                                              const commAgeLabel = commAgeHours < 1 ? \`\${Math.floor(commAgeHours * 60)}m\` : \`\${Math.floor(commAgeHours)}h \${Math.floor((commAgeHours % 1) * 60)}m\`;
`;
code = code.replace(targetCommVars, replaceCommVars);

const targetBadges = `                                                    {/* Status Badges */}
                                                    <div className="text-right flex flex-col items-end gap-1 shrink-0 font-sans">
                                                      {isPending && (
                                                        <span className="text-[9px] uppercase tracking-wide font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md animate-pulse">
                                                          ⏳ PENDING ACTION
                                                        </span>
                                                      )}
                                                      {isInProgress && (
                                                        <span className="text-[9px] uppercase tracking-wide font-extrabold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-md animate-pulse">
                                                          ⚡ IN PROGRESS (
                                                          {req.openedBy})
                                                        </span>
                                                      )}
                                                      {isClosed && (
                                                        <span className="text-[9px] uppercase tracking-wide font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md">
                                                          ✅ CONTACTED
                                                        </span>
                                                      )}`;

const replaceBadges = `                                                    {/* Status Badges */}
                                                    <div className="text-right flex flex-col items-end gap-1 shrink-0 font-sans">
                                                      <span className="font-mono text-[10px] text-slate-500 font-bold tracking-wider mb-1 flex items-center justify-end gap-2">
                                                        <span className={\`px-1.5 py-0.5 rounded-sm border border-white/10 \${commSLABadge}\`}>⏱ {commAgeLabel} open</span>
                                                        {formatComRef(req.id)}
                                                      </span>
                                                      {isPending && (
                                                        <span className="text-[9px] uppercase tracking-wide font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md animate-pulse">
                                                          ⏳ PENDING ACTION
                                                        </span>
                                                      )}
                                                      {isInProgress && (
                                                        <span className="text-[9px] uppercase tracking-wide font-extrabold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-md animate-pulse">
                                                          ⚡ IN PROGRESS (
                                                          {req.openedBy})
                                                        </span>
                                                      )}
                                                      {isClosed && (
                                                        <span className="text-[9px] uppercase tracking-wide font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md">
                                                          ✅ CONTACTED
                                                        </span>
                                                      )}`;
code = code.replace(targetBadges, replaceBadges);

const phoneStripSrc = `<CopyWrap text={req.phoneNumber || ''} label="Phone">
                                                            {req.phoneNumber}
                                                          </CopyWrap>`;
const phoneStripDst = `<CopyWrap text={req.phoneNumber ? ('0' + req.phoneNumber.replace(/^0+/, '')) : ''} label="Phone">
                                                            {req.phoneNumber ? ('0' + req.phoneNumber.replace(/^0+/, '')) : ''}
                                                          </CopyWrap>`;
code = code.replace(phoneStripSrc, phoneStripDst);

fs.writeFileSync('src/App.tsx', code);
console.log('done com patch');
