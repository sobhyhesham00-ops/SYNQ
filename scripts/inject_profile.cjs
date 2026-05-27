const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Inject profile tab
code = code.replace(
  /\{activeTab === 'inquiries' && \(/,
  `{activeTab === 'profile' && currentUser && (
                <div className="space-y-6 max-w-4xl mx-auto w-full animate-fade-in relative z-10 p-4 sm:p-0">
                  <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                      <div className="relative group">
                        {currentUser.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 shadow-xl" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-indigo-500/20 text-indigo-400 border-4 border-slate-700 shadow-xl flex items-center justify-center text-3xl font-bold font-display">
                            {formatAgentName(currentUser.name).substring(0, 2)}
                          </div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity backdrop-blur-sm">
                          <span className="text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-1"><Upload className="w-3 h-3"/> Edit 📸</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const newUrl = ev.target?.result as string;
                                setCurrentUser({...currentUser, avatarUrl: newUrl});
                                addSystemNotification('🖼️ Profile Updated!', 'Your new shiny profile picture has been saved successfully in your local profile. Looking good! 😎', 'general', 'personal');
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }} />
                        </label>
                      </div>
                      <div className="text-center sm:text-left">
                        <h2 className="text-3xl font-display font-black text-slate-100 flex items-center gap-2 justify-center sm:justify-start">
                          {formatAgentName(currentUser.name)} {currentUser.role === 'tl' ? '👑' : '🌟'}
                        </h2>
                        <p className="text-slate-400 font-medium">
                          {currentUser.role === 'tl' ? 'Team Leader & Supervisor 📊' : (supportAssignments[currentUser.name] ? 'Line Support Specialist ⚡' : 'Customer Service Representative 🎧')}
                        </p>
                        <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest bg-slate-900/50 inline-block px-2 py-1 rounded">LOB: {getAgentLOB(currentUser.name)} 🏢</p>
                      </div>
                    </div>

                    {/* Agent ToDo / Personal Workspace */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">📝 My Personal Inbox & Notes</h3>
                        <textarea className="w-full h-32 bg-slate-900/50 border border-white/10 text-slate-100 p-3 rounded-xl focus:border-indigo-500 outline-none resize-none text-sm font-medium" placeholder="Write anything... scratchpad... thoughts... 💭"></textarea>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-inner flex flex-col h-full">
                        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">⏱️ Smart To-Do List</h3>
                        <form className="flex flex-col gap-2 mb-4" onSubmit={(e) => {
                           e.preventDefault();
                           const fd = new FormData(e.currentTarget);
                           const text = fd.get('text') as string;
                           const minutes = parseInt(fd.get('mins') as string) || 0;
                           if (!text) return;
                           const reminderTimeMs = minutes ? Date.now() + minutes * 60000 : null;
                           const newItem = {
                             id: 'td_' + Date.now(),
                             agentName: currentUser.name,
                             text,
                             isCompleted: false,
                             reminderTimeMs,
                             createdAt: new Date().toISOString()
                           };
                           const next = [newItem, ...todos];
                           setTodos(next);
                           setStorageItem('agent_todos', next);
                           e.currentTarget.reset();
                           addSystemNotification('📋 Task Added!', \`Added: "\${text}" \${minutes ? 'with a reminder set!' : ''} ✅\`, 'general', 'personal');
                        }}>
                          <div className="flex gap-2">
                            <input name="text" type="text" placeholder="I need to..." required className="flex-1 bg-slate-900/50 border border-white/10 text-slate-100 px-3 py-2 text-sm rounded-xl outline-none focus:border-indigo-500" />
                            <input name="mins" type="number" placeholder="Mins?" title="Remind in X mins" min="1" className="w-20 bg-slate-900/50 border border-white/10 text-slate-100 px-2 py-2 text-sm rounded-xl outline-none focus:border-indigo-500 text-center" />
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-indigo-500/20">+</button>
                          </div>
                        </form>
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[200px] pr-1">
                          {todos.filter(t => t.agentName === currentUser.name).length === 0 ? (
                            <div className="text-center text-slate-500 text-xs py-6 italic">No tasks yet. Enjoy your free time! 🏖️</div>
                          ) : (
                            todos.filter(t => t.agentName === currentUser.name).map(t => (
                              <div key={t.id} className={\`flex items-center gap-3 p-2.5 rounded-xl border transition-all \${t.isCompleted ? 'bg-slate-800/30 border-slate-700/30 opacity-60' : 'bg-slate-800/80 border-slate-700 shadow-sm'}\`}> 
                                <input type="checkbox" checked={t.isCompleted} onChange={() => {
                                  let done = false;
                                  const next = todos.map(x => {
                                    if (x.id === t.id) { done = !x.isCompleted; return {...x, isCompleted: done}; }
                                    return x;
                                  });
                                  setTodos(next); setStorageItem('agent_todos', next);
                                  if (done) addSystemNotification('🎉 Goal Reached!', \`You completed: "\${t.text}" Awesome job! 🚀\`, 'general', 'personal');
                                }} className="w-4 h-4 rounded text-indigo-500 accent-indigo-500 bg-slate-900" />
                                <div className="flex-1 min-w-0">
                                  <p className={\`text-sm font-medium truncate \${t.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}\`}>{t.text}</p>
                                  {t.reminderTimeMs && !t.isCompleted && (
                                     <p className="text-[10px] text-amber-400 font-mono flex items-center gap-1"><Clock className="w-3 h-3"/> Remind around {new Date(t.reminderTimeMs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ⏰</p>
                                  )}
                                </div>
                                <button onClick={() => {
                                  const next = todos.filter(x => x.id !== t.id);
                                  setTodos(next); setStorageItem('agent_todos', next);
                                }} className="text-slate-500 hover:text-rose-400 transition-colors p-1"><X className="w-3 h-3"/></button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inquiries' && (`
);

code = code.replace(
  /\{buildBtn\("dashboard", <LayoutDashboard/g,
  `{buildBtn("profile", <User className="w-4 h-4 text-pink-400" />, "My Profile & Workspace", "bg-slate-800 border-slate-700 hover:border-pink-500/50")}
                        {buildBtn("dashboard", <LayoutDashboard`
);


fs.writeFileSync('src/App.tsx', code);
console.log('Injected profile area');
