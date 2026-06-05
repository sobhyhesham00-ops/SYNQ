const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `.map((comp) => {
                                              const isPendingTL =
                                                comp.status === "pending_tl";
                                              const isNeedContact =
                                                comp.status === "need_contact";
                                              const isClosed =
                                                comp.status === "closed";

                                              return (
                                                <div
                                                  key={comp.id}
                                                  className={\`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-md overflow-hidden bg-[#1e1e1e]/40 backdrop-blur-lg/60 \${
                                                    isNeedContact
                                                      ? "border-pink-500/30 bg-gradient-to-b from-pink-955/10 to-transparent animate-pulse"
                                                      : isPendingTL
                                                        ? "border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent"
                                                        : "border-white/5"
                                                  }\`}
                                                >`;

const replace1 = `.map((comp) => {
                                              const isPendingTL =
                                                comp.status === "pending_tl";
                                              const isNeedContact =
                                                comp.status === "need_contact";
                                              const isClosed =
                                                comp.status === "closed";

                                              const compAgeMs = Date.now() - new Date(comp.createdAt).getTime();
                                              const compAgeHours = compAgeMs / 3600000;
                                              const compAgeLabel = compAgeHours < 1 ? \`\${Math.floor(compAgeMs/60000)}m open\` : \`\${Math.floor(compAgeHours)}h open\`;
                                              const compUrgency = comp.status !== 'closed'
                                                ? (compAgeHours > 24 ? 'critical' : compAgeHours > 8 ? 'high' : compAgeHours > 2 ? 'medium' : 'low')
                                                : 'resolved';
                                              const urgencyColors = {
                                                critical: 'border-l-red-500',
                                                high: 'border-l-orange-500',
                                                medium: 'border-l-amber-500',
                                                low: 'border-l-slate-700',
                                                resolved: 'border-l-emerald-500'
                                              };

                                              return (
                                                <div
                                                  key={comp.id}
                                                  className={\`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-md overflow-hidden bg-[#1e1e1e]/40 backdrop-blur-lg/60 border-l-4 \${urgencyColors[compUrgency]} \${
                                                    isNeedContact
                                                      ? "border-pink-500/30 bg-gradient-to-b from-pink-955/10 to-transparent animate-pulse"
                                                      : isPendingTL
                                                        ? "border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent"
                                                        : "border-white/5"
                                                  }\`}
                                                >`;

const target2 = `                                                    {/* Status Badges */}
                                                    <div className="text-right flex flex-col items-end gap-1 shrink-0 font-sans">
                                                      <span className="font-mono text-[10px] text-slate-500 font-bold tracking-wider mb-1">
                                                        {formatCompRef(comp.id)}
                                                      </span>`;
const replace2 = `                                                    {/* Status Badges */}
                                                    <div className="text-right flex flex-col items-end gap-1 shrink-0 font-sans">
                                                      <span className="font-mono text-[10px] text-slate-500 font-bold tracking-wider mb-1 flex items-center justify-end gap-2">
                                                        <span className="px-1.5 py-0.5 rounded-sm bg-black/20 border border-white/10 text-white/60">⏱ {compAgeLabel}</span>
                                                        {formatCompRef(comp.id)}
                                                      </span>`;

if (code.includes(target1)) {
    code = code.replace(target1, replace1);
    console.log("Patched div wrapper");
} else {
    console.log("Target 1 not found");
}

if (code.includes(target2)) {
    code = code.replace(target2, replace2);
    console.log("Patched status badge label");
} else {
    console.log("Target 2 not found");
}

fs.writeFileSync("src/App.tsx", code);
