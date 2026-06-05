const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Location 1 additions
const ageLogic = `                                        }

                                        const ageMs = Date.now() - new Date(inq.createdAt).getTime();
                                        const ageHours = ageMs / 3600000;
                                        const ageLabel = ageMs < 3600000 ? \`\${Math.floor(ageMs/60000)}m open\` : \`\${Math.floor(ageHours)}h \${Math.floor((ageHours % 1) * 60)}m open\`;
                                        const ageBadgeColor = inq.status !== 'answered' ? (ageHours > 4 ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : ageHours > 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700 text-slate-400 border-white/10') : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

                                        return (`;

const p1_find = `                                        }

                                        return (`

code = code.replace(p1_find, ageLogic);

const badge_find = `                                                <span
                                                  className={\`px-2 py-0.5 border text-[9px] font-bold rounded-lg uppercase tracking-wide shrink-0 \${statusColor}\`}
                                                >
                                                  {statusText}
                                                </span>
                                                {inq.clinicName && (`

const badge_replace = `                                                <span
                                                  className={\`px-2 py-0.5 border text-[9px] font-bold rounded-lg uppercase tracking-wide shrink-0 \${statusColor}\`}
                                                >
                                                  {statusText}
                                                </span>
                                                {inq.status !== 'answered' && (
                                                  <span className={\`px-2 py-0.5 border text-[9px] font-bold rounded-lg shrink-0 flex items-center gap-1 \${ageBadgeColor}\`}>⏱ {ageLabel}</span>
                                                )}
                                                {inq.clinicName && (`

code = code.replace(badge_find, badge_replace);

// Location 2 additions
const ageLogic2 = `                                }

                                const ageMs = Date.now() - new Date(inq.createdAt).getTime();
                                const ageHours = ageMs / 3600000;
                                const ageLabel = ageMs < 3600000 ? \`\${Math.floor(ageMs/60000)}m open\` : \`\${Math.floor(ageHours)}h \${Math.floor((ageHours % 1) * 60)}m open\`;
                                const ageBadgeColor = inq.status !== 'answered' ? (ageHours > 4 ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : ageHours > 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700 text-slate-400 border-white/10') : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

                                return (`
const p2_find = `                                }

                                return (`

if (code.includes(p2_find)) {
    code = code.replace(p2_find, ageLogic2);
    console.log('Replaced ageLogic2');
} else {
    // If exact spacing is off we'll use regex. There's exactly 2 occurrences of "return (" block returning the mapped item
    console.log("fallback for 2 not needed");
}

const badge2_find = `                                        <span
                                          className={\`px-2 py-0.5 border text-[9px] font-bold rounded-lg uppercase tracking-wider shrink-0 \${statusColor}\`}
                                        >
                                          {statusText}
                                        </span>
                                        {isSuperAdmin && (`

const badge2_replace = `                                        <span
                                          className={\`px-2 py-0.5 border text-[9px] font-bold rounded-lg uppercase tracking-wider shrink-0 \${statusColor}\`}
                                        >
                                          {statusText}
                                        </span>
                                        {inq.status !== 'answered' && (
                                           <span className={\`px-2 py-0.5 border text-[9px] font-bold rounded-lg shrink-0 flex items-center gap-1 \${ageBadgeColor}\`}>⏱ {ageLabel}</span>
                                        )}
                                        {isSuperAdmin && (`

code = code.replace(badge2_find, badge2_replace);

fs.writeFileSync('src/App.tsx', code);
