const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove Schedule Upload from Schedules Tab
const schedUploadStart = `                  {/* Admin Upload Console */}
                  {isMasterAdmin && (
                    <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-950 border border-indigo-500/20 rounded-3xl p-6 shadow-xl space-y-6">`;
const schedUploadEnd = `                      )}
                    </div>
                  )}

                  {/* Active Schedule visual Matrix grid */}`;

let sIdx = code.indexOf(schedUploadStart);
let scheduleUploadBlock = '';
if (sIdx !== -1) {
    let eIdx = code.indexOf(schedUploadEnd, sIdx);
    if (eIdx !== -1) {
        let blockToKeepEndStr = `                    </div>\n                  )}`;
        let actualEnd = code.indexOf(blockToKeepEndStr, eIdx - 50) + blockToKeepEndStr.length;
        scheduleUploadBlock = code.substring(sIdx, actualEnd);
        
        code = code.substring(0, sIdx) + code.substring(actualEnd);
        console.log("Removed schedule upload block from schedules tab.");
    } else {
        console.log("Could not find end of schedule upload block.");
    }
} else {
    console.log("Could not find start of schedule upload block.");
}

// 2. Remove Headcount Upload from Tabby Tamara Tab
const hcUploadStart = `                    {/* Admin Headcount Upload Control */}
                    {isMasterAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">`;
const hcUploadEndMatch = `                          </div>
                        </div>
                    )}`;

let hIdx = code.indexOf(hcUploadStart);
let headcountUploadBlock = '';
if (hIdx !== -1) {
    let eIdx = code.indexOf(hcUploadEndMatch, hIdx);
    if (eIdx !== -1) {
       headcountUploadBlock = code.substring(hIdx, eIdx + hcUploadEndMatch.length);
       code = code.substring(0, hIdx) + code.substring(eIdx + hcUploadEndMatch.length);
       console.log("Removed headcount upload block from tabby tab.");
    } else {
       console.log("Could not find end of headcount block");
    }
} else {
    console.log("Could not find headcount block");
}

fs.writeFileSync('src/App.tsx', code);

// Now let's inject them into the Master Control tab
code = fs.readFileSync('src/App.tsx', 'utf8');

const masterControlStart = `                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-3xl font-bold text-rose-500 font-display flex items-center gap-3">
                          <ShieldCheck className="w-8 h-8" />
                          Master Control
                        </h2>
                        <p className="text-slate-400 text-sm">Super Admin privileges. Manage agent LOBs, assign TLs, and upload Headcount sheet.</p>
                      </div>
                      

                    </div>`;

const manualAgentBlock = `
                    {/* Add Agent Manually */}
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                      <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-emerald-400" />
                        Add User Manually
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full">
                          <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
                          <input 
                            type="text" 
                            id="manual-agent-name"
                            placeholder="e.g. John Doe"
                            className="bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-emerald-500 w-full"
                          />
                        </div>
                        <div className="w-full sm:w-48">
                          <label className="text-xs text-slate-400 mb-1 block">Role</label>
                          <select 
                            id="manual-agent-role"
                            className="bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-emerald-500 w-full"
                          >
                            <option value="Call Center">Call Center</option>
                            <option value="Social Media">Social Media</option>
                            <option value="TL">Team Leader (TL)</option>
                            <option value="Director">Director</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => {
                            const nameInput = document.getElementById('manual-agent-name') as HTMLInputElement;
                            const roleInput = document.getElementById('manual-agent-role') as HTMLSelectElement;
                            if (!nameInput || !roleInput) return;
                            const name = nameInput.value.trim();
                            const role = roleInput.value;
                            if (!name) return toast.error("Please enter a name.");
                            
                            if (agentsList.map(a => a.toLowerCase()).includes(name.toLowerCase())) {
                               return toast.error("User already exists!");
                            }
                            const updatedList = [...agentsList, name];
                            setAgentsList(updatedList);
                            setStorageItem('sched_agents_list', updatedList);
                            
                            const newMeta = { ...getAgentMeta() };
                            newMeta[name] = { roleType: role, tlName: 'Unassigned' };
                            setStorageItem('sched_agent_meta', newMeta);
                            
                            nameInput.value = '';
                            toast.success(\`Added \${name} as \${role}.\`);
                          }}
                          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 whitespace-nowrap transition-all"
                        >
                          Add User
                        </button>
                      </div>
                    </div>
`;

if (code.indexOf(masterControlStart) !== -1) {
    const injectPoint = code.indexOf(masterControlStart) + masterControlStart.length;
    code = code.substring(0, injectPoint) + '\n' + manualAgentBlock + '\n' + scheduleUploadBlock + '\n' + headcountUploadBlock + '\n' + code.substring(injectPoint);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully injected into Master Control");
} else {
    console.log("Could not find master control injection point.");
}
