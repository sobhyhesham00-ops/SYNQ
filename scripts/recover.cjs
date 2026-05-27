const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The file was broken right after:
// <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-slate-200 dark:border-slate-700/5">
// <ThemeToggle />
// {/* Notification Center Trigger */}

// We need to restore the end of toast.custom, the end of onSnapshot, the return of useEffect,
// and then the beginning of the JSX tree, up to the Notification Center Trigger!

const replacement = `                <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-slate-200 dark:border-slate-700/5">
                  <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white rounded-lg text-xs font-bold transition-colors">Close</button>
                </div>
              </div>
            ));
          }
        }
      }
    });

    return () => {
      unsubUsers();
      unsubLogs();
      unsubSched();
      unsubAnnouncements();
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="h-full px-2 sm:px-4 md:px-6 lg:px-8 flex flex-col pt-4">
          <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700/10 p-3 sm:p-4 rounded-xl sm:rounded-3xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-md shadow-sm z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-indigo-500/20">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-200 font-display">Synq</h1>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-indigo-500 dark:text-indigo-300 font-extrabold uppercase tracking-wide">Work Portal</span>
                  {forceOffline ? (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[7px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-tighter cursor-pointer select-none" onClick={() => setForceOffline(false)} title="Click to go Online">
                      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></div>Forced Offline
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter cursor-pointer select-none" onClick={() => setForceOffline(true)} title="Click to force Offline">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>Online Sync
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
`;

// Find where to replace
const brokenStartStr = `<div className="flex justify-end gap-2 mt-2 pt-1 border-t border-slate-200 dark:border-slate-700/5">`;
const brokenEndStr = `{/* Notification Center Trigger */}`;

const startIndex = code.indexOf(brokenStartStr);
const endIndex = code.indexOf(brokenEndStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
    fs.writeFileSync('src/App.tsx', newCode);
    console.log('App.tsx repaired!');
} else {
    console.log('Could not find boundaries.');
}
