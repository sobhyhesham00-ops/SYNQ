const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `                                {/* List rendering */}
                                <div className="space-y-4 pt-2 text-left">
                                  {localSubTab === "requests" ? (`;

const replace1 = `                                {/* List rendering */}
                                <div className="space-y-4 pt-2 text-left">
                                  {localSubTab === "requests" ? (() => {
                                    const cleanPhone = (p) => p.replace(/\\D/g, '').replace(/^0+/, '');
                                    const filteredTTRequests = tabbyTamaraRequests.filter(r => {
                                      const isMyRequest = r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
                                      if (!isTLOreSupport && !isMyRequest) return false;

                                      const s = ttSearch.toLowerCase();
                                      const matchSearch = !s ||
                                        r.patientName?.toLowerCase().includes(s) ||
                                        r.agentName?.toLowerCase().includes(s) ||
                                        r.clinicName?.toLowerCase().includes(s) ||
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
                                      `;

if (code.includes(target1)) {
    code = code.replace(target1, replace1);
    console.log("Successfully patched target1");
} else {
    console.log("Could not find target1");
}

fs.writeFileSync('src/App.tsx', code);
