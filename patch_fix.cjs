const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the incorrectly placed logic
const badBlock = `                                }

                                const ageMs = Date.now() - new Date(inq.createdAt).getTime();
                                const ageHours = ageMs / 3600000;
                                const ageLabel = ageMs < 3600000 ? \`\${Math.floor(ageMs/60000)}m open\` : \`\${Math.floor(ageHours)}h \${Math.floor((ageHours % 1) * 60)}m open\`;
                                const ageBadgeColor = inq.status !== 'answered' ? (ageHours > 4 ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : ageHours > 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700 text-slate-400 border-white/10') : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

                                return (`;

const fixedBadBlock = `                                }

                                return (`;

if (code.includes(badBlock)) {
    code = code.replace(badBlock, fixedBadBlock);
} else {
    console.log("Could not find badBlock");
}

// 2. Insert it at the correct place instead
const rightBlockFind = `                                  statusColor =
                                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                                  statusText = "Answered";
                                }

                                return (`;

const rightBlockReplace = `                                  statusColor =
                                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                                  statusText = "Answered";
                                }

                                const ageMs = Date.now() - new Date(inq.createdAt).getTime();
                                const ageHours = ageMs / 3600000;
                                const ageLabel = ageMs < 3600000 ? \`\${Math.floor(ageMs/60000)}m open\` : \`\${Math.floor(ageHours)}h \${Math.floor((ageHours % 1) * 60)}m open\`;
                                const ageBadgeColor = inq.status !== 'answered' ? (ageHours > 4 ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : ageHours > 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700 text-slate-400 border-white/10') : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

                                return (`;

if (code.includes(rightBlockFind)) {
    code = code.replace(rightBlockFind, rightBlockReplace);
} else {
    console.log("Could not find rightBlockFind");
}

fs.writeFileSync('src/App.tsx', code);
