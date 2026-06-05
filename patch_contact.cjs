const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const findCode = `                                      {/* Render attachments */}
                                      <AttachmentsDisplay
                                        photos={inq.photos}
                                        links={inq.links}
                                      />

                                      {/* End attachments */}
                                    </div>`;

const replaceCode = `                                      {/* Render attachments */}
                                      <AttachmentsDisplay
                                        photos={inq.photos}
                                        links={inq.links}
                                      />

                                      {/* TL customerContacted quick update buttons */}
                                      <div className="flex flex-wrap bg-slate-900/50 p-1 rounded-lg gap-1 border border-white/5 mt-3 w-max">
                                          <button
                                              onClick={() => handleUpdateContactedStatus(inq.id, 'not_contacted')}
                                              className={\`text-[10px] px-2 py-1 rounded transition-colors \${(!inq.customerContacted || inq.customerContacted === 'not_contacted') ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:bg-white/5'}\`}
                                          >
                                              ❌ Not Contacted
                                          </button>
                                          <button
                                              onClick={() => handleUpdateContactedStatus(inq.id, 'attempted')}
                                              className={\`text-[10px] px-2 py-1 rounded transition-colors \${inq.customerContacted === 'attempted' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:bg-white/5'}\`}
                                          >
                                              ⏳ Attempted
                                          </button>
                                          <button
                                              onClick={() => handleUpdateContactedStatus(inq.id, 'contacted')}
                                              className={\`text-[10px] px-2 py-1 rounded transition-colors \${inq.customerContacted === 'contacted' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:bg-white/5'}\`}
                                          >
                                              ✅ Contacted
                                          </button>
                                      </div>

                                      {/* End attachments */}
                                    </div>`;

if (code.includes(findCode)) {
    code = code.replace(findCode, replaceCode);
    console.log("Success replacing contact buttons");
} else {
    console.log("Could not find the target codeblock");
}

fs.writeFileSync('src/App.tsx', code);
