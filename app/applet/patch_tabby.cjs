const fs = require('fs');
let code = fs.readFileSync('src/components/TabbyTamaraCard.tsx', 'utf8');

const logicTarget = `  const getThemeColor = () => {`;
const logicReplacement = `  const elapsedMins = req.confirmedAt && req.customerContacted !== 'contacted'
    ? (Date.now() - new Date(req.confirmedAt).getTime()) / 60000
    : 0;
  const isOverdue = isPendingContact && elapsedMins > 60;
  const isWarning = isPendingContact && elapsedMins > 30 && !isOverdue;

  const getThemeColor = () => {`;

if (code.includes(logicTarget)) {
    code = code.replace(logicTarget, logicReplacement);
    console.log('Successfully patched logic');
} else {
    console.log('Could not find logicTarget');
}

const divTarget = `    <div className={\`relative bg-[#111113] border border-white/10 rounded-xl p-3 md:p-4 overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-xl \${isPendingContact ? "bg-gradient-to-b from-rose-500/[0.03] to-transparent ring-1 ring-rose-500/20" : isAwaitingConfirm ? "bg-gradient-to-b from-amber-500/[0.03] to-transparent" : "opacity-95 hover:opacity-100"}\`}>`;

const divReplacement = `    <div className={\`relative bg-[#111113] border border-white/10 rounded-xl p-3 md:p-4 overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-xl \${isPendingContact ? \`bg-gradient-to-b from-rose-500/[0.03] to-transparent \${isOverdue ? 'ring-2 ring-red-500/50' : isWarning ? 'ring-1 ring-amber-500/40' : 'ring-1 ring-rose-500/20'}\` : isAwaitingConfirm ? "bg-gradient-to-b from-amber-500/[0.03] to-transparent" : "opacity-95 hover:opacity-100"}\`}>`;

if (code.includes(divTarget)) {
    code = code.replace(divTarget, divReplacement);
    console.log('Successfully patched div target');
} else {
    console.log('Could not find div target');
}

const timerTarget = `          {isCompleted && (
            <div className="text-right space-y-0.5">
              <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest md:mr-1">
                Turnaround Time
              </p>
              <p className="font-mono text-[10px] font-black px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 inline-block">
                {getElapsedTimerString(req.confirmedAt || req.createdAt, req.contactedAt)}
              </p>
            </div>
          )}`;

const timerReplacement = `          {isCompleted ? (
            <div className="text-right space-y-0.5">
              <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest md:mr-1">
                Turnaround Time
              </p>
              <p className="font-mono text-[10px] font-black px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 inline-block">
                {getElapsedTimerString(req.confirmedAt || req.createdAt, req.contactedAt)}
              </p>
            </div>
          ) : (
            <div className="text-right flex flex-col items-end gap-0.5">
              <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest flex gap-1 items-center md:mr-1">
                 Elapsed <span className={\`text-[8px] px-1 rounded \${isOverdue ? 'bg-red-500 text-white' : isWarning ? 'bg-amber-500 text-white' : 'hidden'}\`}>{isOverdue ? "🚨 OVERDUE" : "⚠️ WARNING"}</span>
              </p>
              <p className={\`font-mono text-[10px] font-black px-2 py-0.5 inline-block rounded \${isOverdue ? 'text-red-400 bg-red-500/10 border border-red-500/20 animate-pulse' : isWarning ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'}\`}>
                 {getElapsedTimerString(req.confirmedAt || req.createdAt)}
              </p>
              <p className="text-[7.5px] text-slate-500/70 tracking-wider font-bold">SLA: 30 min warning / 60 min overdue</p>
            </div>
          )}`;

if (code.includes(timerTarget)) {
    code = code.replace(timerTarget, timerReplacement);
    console.log('Successfully patched timer target');
} else {
    console.log('Could not find timer target');
}

fs.writeFileSync('src/components/TabbyTamaraCard.tsx', code);
