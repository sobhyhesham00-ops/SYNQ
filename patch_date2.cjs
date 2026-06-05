const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add date inputs
code = code.replace(
  `                          <input
                            type="text"
                            placeholder="🔍 Search by agent name..."
                            className="flex-1 w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>`,
    `                          <input
                            type="text"
                            placeholder="🔍 Search by agent name..."
                            className="flex-1 w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              title="From Date"
                              value={logDateFrom}
                              onChange={(e) => setLogDateFrom(e.target.value)}
                              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                              type="date"
                              title="To Date"
                              value={logDateTo}
                              onChange={(e) => setLogDateTo(e.target.value)}
                              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                            />
                          </div>
                        </div>`
);

// Add REF columns
code = code.replace(
  `                              <thead className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/5 bg-[#1e1e1e]/40 backdrop-blur-lg/40">
                                <tr>
                                  <th className="px-6 py-4 font-bold">
                                    Agent Name`,
  `                              <thead className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/5 bg-[#1e1e1e]/40 backdrop-blur-lg/40">
                                <tr>
                                  <th className="px-6 py-4 font-bold">
                                    REF #
                                  </th>
                                  <th className="px-6 py-4 font-bold">
                                    Agent Name`
);

code = code.replace(
  `                                        <td className="px-6 py-4 font-bold text-slate-100">
                                          {req.agentName}
                                        </td>`,
  `                                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                                          {formatCaseRef(req.id, "sched")}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-100">
                                          {req.agentName}
                                        </td>`
);

code = code.replace(
  `                                      colSpan={6}
                                      className="px-6 py-12 text-center text-slate-400"
                                    >
                                      No records matching filters.`,
  `                                      colSpan={7}
                                      className="px-6 py-12 text-center text-slate-400"
                                    >
                                      No records matching filters.`
)

fs.writeFileSync('src/App.tsx', code);
