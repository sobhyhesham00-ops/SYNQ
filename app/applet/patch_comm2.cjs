const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. the language toggle buttons
const toggleButtonsStr = `
                                  {localSubTab === "client-comms" && (
                                    <>
                                      <span className="text-slate-400 font-semibold font-sans ml-auto">
                                        Language:
                                      </span>
                                      <div className="flex items-center gap-1.5 bg-black/35 p-1 rounded-xl border border-white/5">
                                        <button
                                          onClick={() => setCommLangFilter("all")}
                                          className={\`px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer \${commLangFilter === "all" ? "bg-indigo-600 text-white font-sans" : "text-slate-400 hover:text-slate-100 font-sans"}\`}
                                        >
                                          All
                                        </button>
                                        <button
                                          onClick={() => setCommLangFilter("Arabic")}
                                          className={\`px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer \${commLangFilter === "Arabic" ? "bg-indigo-600 text-white font-sans" : "text-slate-400 hover:text-slate-100 font-sans"}\`}
                                        >
                                          Arabic
                                        </button>
                                        <button
                                          onClick={() => setCommLangFilter("English")}
                                          className={\`px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer \${commLangFilter === "English" ? "bg-indigo-600 text-white font-sans" : "text-slate-400 hover:text-slate-100 font-sans"}\`}
                                        >
                                          English
                                        </button>
                                      </div>
                                    </>
                                  )}
`;

content = content.replace(
  /(\{\/\* Dropdown Filters and status segment selection buttons \*\/\s*<div className="flex flex-wrap items-center gap-3 text-xs text-left">)/g,
  \`$1\${toggleButtonsStr}\`
);


// 2. update the input logic inside localSubTab client-comms
content = content.replace(
  \`value={localSubTab === "complaints" ? compSearch : ttSearchQuery}
                                        onChange={(e) =>
                                          localSubTab === "complaints" ? setCompSearch(e.target.value) : setTtSearchQuery(e.target.value)
                                        }\`,
  \`value={
                                          localSubTab === "complaints" ? compSearch : 
                                          localSubTab === "client-comms" ? commSearch : 
                                          ttSearchQuery
                                        }
                                        onChange={(e) => {
                                          if (localSubTab === "complaints") setCompSearch(e.target.value);
                                          else if (localSubTab === "client-comms") setCommSearch(e.target.value);
                                          else setTtSearchQuery(e.target.value);
                                        }}\`
);


// 3. Update the array filter logic
const filterRe = /const matchesSearch =([\\s\\S]*?)c\\.handledBy[\\s\\S]*?\\)\\);/;

const newFilter = \`const query = isTLOreSupport ? commSearch.toLowerCase() : ttSearchQuery.toLowerCase();
                                        const matchesSearch = !query ||
                                          c.patientName?.toLowerCase().includes(query) ||
                                          (c.phoneNumber && c.phoneNumber.replace(/[^\\d]/g, '').includes(query.replace(/[^\\d]/g, ''))) ||
                                          c.clinicName?.toLowerCase().includes(query) ||
                                          c.callCenterAgentName?.toLowerCase().includes(query) ||
                                          c.notes?.toLowerCase().includes(query) ||
                                          (c.handledBy?.toLowerCase().includes(query));

                                        const matchesLang = commLangFilter === 'all' || c.language === commLangFilter;\`;

content = content.replace(filterRe, newFilter);

content = content.replace(
  /return \(\s*matchesSearch &&\s*matchesStatus &&\s*matchesClinic\s*\);/,
  \`return (
                                            matchesSearch &&
                                            matchesStatus &&
                                            matchesClinic &&
                                            matchesLang
                                          );\`
);

fs.writeFileSync('src/App.tsx', content);

