const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /Import CSV or Google Sheet to overwrite all agent metadata and contact directories<\/p>\s*<\/div>\s*<button\s*onClick=\{\(\) \=\> \{/s;

const match = c.match(regex);
if (match) {
  const index = match.index + match[0].length;
  let newContent = c.substring(0, index);
  
  newContent += `
                              const csvContent = "Agent Name,Email,Phone,LOB,LOB Team,Role,Team Leader\\nJohn Doe,john@example.com,555-0199,Chat,Support,agent,Amira Hassan\\nJane Smith,jane@example.com,555-0122,Social Media,Moderator,tl,Hesham Sobhy";
                              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(blob);
                              link.download = 'headcount_template.csv';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 rounded-xl transition-all border border-white/10 shadow-sm"
                          >
                            Download Template CSV
                          </button>
                        </div>
                        <ScheduleUpload />
                      </div>
                    )}
                    
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-sm overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap">
                        <thead className="text-slate-400 bg-white/5 text-[10px] uppercase font-bold tracking-wider">
                          <tr>
                            <th className="p-4 rounded-l-xl">Agent Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">LOB</th>
                            <th className="p-4">LOB Team</th>
                            <th className="p-4">Role</th>
                            <th className="p-4 rounded-r-xl">Team Leader</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                          {globalMeta.filter(m => {
                            if (!directorySearchQuery) return true;
                            const q = directorySearchQuery.toLowerCase();
                            return m.name.toLowerCase().includes(q) || (m.email && m.email.toLowerCase().includes(q)) || (m.phone && m.phone.includes(q));
                          }).map((meta, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-all">
                              <td className="p-4 text-slate-100 font-bold">{meta.name}</td>
                              <td className="p-4">{meta.email || '-'}</td>
                              <td className="p-4">{meta.phone || '-'}</td>
                              <td className="p-4"><span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-lg bg-opacity-40">{meta.lob || '-'}</span></td>
                              <td className="p-4">{meta.lobTeam || '-'}</td>
                              <td className="p-4"><span className="bg-amber-950/30 text-amber-500 font-bold py-1 px-3 rounded-lg">{meta.role === 'tl' ? 'TL' : 'Agent'}</span></td>
                              <td className="p-4 text-cyan-300 font-bold">{meta.teamLeader || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {globalMeta.length === 0 && (
                        <div className="text-center p-8 text-slate-500 font-medium font-sans">
                          No directory data active. Please upload a headcount file.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
`;
  
  fs.writeFileSync('src/App.tsx', newContent);
  console.log("SUCCESS!");
} else {
  console.log("NOT FOUND MATCH!");
}
