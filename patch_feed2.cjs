const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const lines = code.split('\n');
const startIdx = lines.findIndex(l => l.includes('                                {/* List rendering */}'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('                                  ) : localSubTab === "complaints" ? ('));

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `                                {/* List rendering */}
                                <div className="space-y-4 pt-2 text-left">
                                  {localSubTab === "requests" ? (() => {
                                    const cleanPhone = (p) => p.replace(/\\D/g, '').replace(/^0+/, '');
                                    const filteredTTRequests = tabbyTamaraRequests.filter(r => {
                                      const isMyRequest = r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
                                      if (!isTLOreSupport && !isMyRequest) return false;

                                      const s = ttSearch.toLowerCase();
                                      const matchSearch = !s ||
                                        (r.patientName || "").toLowerCase().includes(s) ||
                                        (r.agentName || "").toLowerCase().includes(s) ||
                                        (r.clinicName || "").toLowerCase().includes(s) ||
                                        (r.fileNumber || "").toLowerCase().includes(s) ||
                                        (r.phoneNumber && cleanPhone(r.phoneNumber).includes(cleanPhone(ttSearch)));
                                      
                                      const matchDate = !ttDateFilter || new Date(r.createdAt).toDateString() === new Date(ttDateFilter).toDateString();
                                      
                                      const matchesStatus =
                                        ttFilterStatus === "all" ||
                                        (ttFilterStatus === "not_confirmed" && r.status === "not_confirmed") ||
                                        (ttFilterStatus === "confirmed" && r.status === "confirmed" && r.customerContacted !== "contacted") ||
                                        (ttFilterStatus === "contacted" && r.customerContacted === "contacted");
                                      
                                      const matchesProvider = ttFilterProvider === "all" || r.platform === ttFilterProvider;
                                      const matchesClinic = tcFilterClinic === "all" || (r.clinicName && r.clinicName.toLowerCase() === tcFilterClinic.toLowerCase());

                                      return matchSearch && matchDate && matchesStatus && matchesProvider && matchesClinic;
                                    });

                                    return (
                                        <>
                                        {/* TT Sub-Search & Filter */}
                                        <div className="flex gap-3 mb-4">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-2.5 text-slate-400">
                                                    <Search className="w-4 h-4" />
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="Search patient, phone, clinic, agent..."
                                                    value={ttSearch}
                                                    onChange={(e) => setTtSearch(e.target.value)}
                                                    className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                                                />
                                            </div>
                                            <div className="relative w-40">
                                                <input
                                                    type="date"
                                                    value={ttDateFilter}
                                                    onChange={(e) => setTtDateFilter(e.target.value)}
                                                    className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans font-medium [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>

                                      {filteredTTRequests.length === 0 ? (
                                        <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-white/10 backdrop-blur-md/[0.02] space-y-2">
                                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                                            <Wallet className="w-6 h-6" />
                                          </div>
                                          <p className="text-sm font-bold text-slate-100 font-sans">
                                            No installment requests matching
                                            criteria.
                                          </p>
                                          <p className="text-xs text-slate-400">
                                            Requests will be logged here with
                                            live status loops and response
                                            timers.
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {filteredTTRequests.map((req) => (
                                              <TabbyTamaraCard 
                                                key={req.id}
                                                req={req}
                                                currentUser={currentUser}
                                                isTLOreSupport={isTLOreSupport}
                                                isSuperAdmin={isSuperAdmin}
                                                activeFintechHandlingId={activeFintechHandlingId}
                                                setActiveFintechHandlingId={setActiveFintechHandlingId}
                                                tlFintechPaymentLink={tlFintechPaymentLink}
                                                setTlFintechPaymentLink={setTlFintechPaymentLink}
                                                tlFintechNotes={tlFintechNotes}
                                                setTlFintechNotes={setTlFintechNotes}
                                                tlFintechLinks={tlFintechLinks}
                                                setTlFintechLinks={setTlFintechLinks}
                                                handleConfirmTabbyTamara={handleConfirmTabbyTamara}
                                                handleMarkPatientContactedTT={(id, status) => {
                                                  if (status) {
                                                    // Undo Contact case uses status
                                                    handleContactTabbyTamara(id, status);
                                                  } else {
                                                    // Mark contacted uses default param in this structure logic
                                                    handleContactTabbyTamara(id, "contacted");
                                                  }
                                                }}
                                                getElapsedTimerString={getElapsedTimerString}
                                                handleDeleteTabbyTamara={handleDeleteTabbyTamara}
                                                canEditItem={canEditItem}
                                                getRemainingEditTime={getRemainingEditTime}
                                                setEditingItem={setEditingItem}
                                              />
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()
                                  ) : localSubTab === "complaints" ? (`;

    const newLines = [
        ...lines.slice(0, startIdx),
        replacement,
        ...lines.slice(endIdx + 1)
    ];
    fs.writeFileSync('src/App.tsx', newLines.join('\n'));
    console.log("Replaced successfully!");
} else {
    console.log("Could not find start/end.");
}
