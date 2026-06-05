const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state variables above ttSearchQuery
if (!code.includes('const [compSearch')) {
    code = code.replace(
        '  const [ttSearchQuery, setTtSearchQuery] = useState("");',
        '  const [compSearch, setCompSearch] = useState("");\n  const [compDateFilter, setCompDateFilter] = useState("");\n\n  const [ttSearchQuery, setTtSearchQuery] = useState("");'
    );
}

// 2. Add Status Labels map
if (!code.includes('const compStatusLabels')) {
    code = code.replace(
        'const App = () => {',
        `const compStatusLabels: Record<string, string> = {
  pending_tl: '🕐 Pending TL Review',
  need_contact: '📞 Action Required: Contact Patient',
  closed: '✅ Resolved & Closed'
};

const App = () => {`
    );
}

// 3. Update filter conditions for complaints tab
const targetFilter = `                                      {tabbyTamaraComplaints.filter((c) => {
                                        const isMyComplaint =
                                          c.agentName?.toLowerCase() ===
                                          currentUser?.name?.toLowerCase();
                                        if (!isTLOreSupport && !isMyComplaint)
                                          return false;

                                        const matchesSearch =
                                          (c.patientName || "")
                                            .toLowerCase()
                                            .includes(
                                              ttSearchQuery.toLowerCase(),
                                            ) ||
                                          (c.fileNumber || "")
                                            .toLowerCase()
                                            .includes(
                                              ttSearchQuery.toLowerCase(),
                                            ) ||
                                          (c.phoneNumber || "")
                                            .toLowerCase()
                                            .includes(
                                              ttSearchQuery.toLowerCase(),
                                            ) ||
                                          (c.agentName || "")
                                            .toLowerCase()
                                            .includes(
                                              ttSearchQuery.toLowerCase(),
                                            ) ||
                                          (c.idNumber &&
                                            c.idNumber
                                              .toLowerCase()
                                              .includes(
                                                ttSearchQuery.toLowerCase(),
                                              ));`;

const replaceFilter = `                                      {tabbyTamaraComplaints.filter((c) => {
                                        const isMyComplaint =
                                          c.agentName?.toLowerCase() ===
                                          currentUser?.name?.toLowerCase();
                                        if (!isTLOreSupport && !isMyComplaint)
                                          return false;

                                        const sq = compSearch.toLowerCase();
                                        const matchesSearch = !sq ||
                                          (c.patientName || "").toLowerCase().includes(sq) ||
                                          (c.phoneNumber || "").toLowerCase().includes(sq.replace(/\\D/g, '')) ||
                                          (c.clinicName || "").toLowerCase().includes(sq) ||
                                          (c.agentName || "").toLowerCase().includes(sq) ||
                                          (c.complaintDetails || "").toLowerCase().includes(sq);

                                        const matchesDate = !compDateFilter || (c.createdAt && c.createdAt.startsWith(compDateFilter));`;

code = code.replace(targetFilter, replaceFilter);

// Also need to add matchesDate to the return of this filter:
const targetReturn = `                                        return (
                                          matchesSearch &&
                                          matchesStatus &&
                                          matchesProvider
                                        );`;
                                        
const replaceReturn = `                                        return (
                                          matchesSearch &&
                                          matchesStatus &&
                                          matchesProvider &&
                                          matchesDate
                                        );`;                                        
code = code.replace(targetReturn, replaceReturn);

// For the mapping loop that uses the same filter logic:
const targetFilter2 = `                                            .filter((c) => {
                                              const isMyComplaint =
                                                c.agentName?.toLowerCase() ===
                                                currentUser?.name?.toLowerCase();
                                              if (
                                                !isTLOreSupport &&
                                                !isMyComplaint
                                              )
                                                return false;

                                              const matchesSearch =
                                                (c.patientName || "")
                                                  .toLowerCase()
                                                  .includes(
                                                    ttSearchQuery.toLowerCase(),
                                                  ) ||
                                                (c.fileNumber || "")
                                                  .toLowerCase()
                                                  .includes(
                                                    ttSearchQuery.toLowerCase(),
                                                  ) ||
                                                (c.phoneNumber || "")
                                                  .toLowerCase()
                                                  .includes(
                                                    ttSearchQuery.toLowerCase(),
                                                  ) ||
                                                (c.agentName || "")
                                                  .toLowerCase()
                                                  .includes(
                                                    ttSearchQuery.toLowerCase(),
                                                  ) ||
                                                (c.idNumber &&
                                                  c.idNumber
                                                    .toLowerCase()
                                                    .includes(
                                                      ttSearchQuery.toLowerCase(),
                                                    ));`;

const replaceFilter2 = `                                            .filter((c) => {
                                              const isMyComplaint =
                                                c.agentName?.toLowerCase() ===
                                                currentUser?.name?.toLowerCase();
                                              if (
                                                !isTLOreSupport &&
                                                !isMyComplaint
                                              )
                                                return false;

                                              const sq = compSearch.toLowerCase();
                                              const matchesSearch = !sq ||
                                                (c.patientName || "").toLowerCase().includes(sq) ||
                                                (c.phoneNumber || "").toLowerCase().includes(sq.replace(/\\D/g, '')) ||
                                                (c.clinicName || "").toLowerCase().includes(sq) ||
                                                (c.agentName || "").toLowerCase().includes(sq) ||
                                                (c.complaintDetails || "").toLowerCase().includes(sq);

                                              const matchesDate = !compDateFilter || (c.createdAt && c.createdAt.startsWith(compDateFilter));`;

code = code.replace(targetFilter2, replaceFilter2);

// Replace second return
code = code.replace(targetReturn, replaceReturn);


// 4. Update the Search Header
const targetHeader = `                                  {/* Search bar inside */}
                                  <div className="relative w-full md:w-64">
                                    <span className="absolute left-3 top-2.5 text-slate-400">
                                      <Search className="w-4 h-4" />
                                    </span>
                                    <input
                                      type="text"
                                      placeholder={
                                        localSubTab === "client-comms"
                                          ? "Search clinic, phone..."
                                          : "Search patient, phone, file..."
                                      }
                                      value={ttSearchQuery}
                                      onChange={(e) =>
                                        setTtSearchQuery(e.target.value)
                                      }
                                      className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                                    />
                                  </div>
                                </div>`;

const replaceHeader = `                                  {/* Search bar inside */}
                                  <div className="relative w-full md:w-64">
                                    <span className="absolute left-3 top-2.5 text-slate-400">
                                      <Search className="w-4 h-4" />
                                    </span>
                                    <input
                                      type="text"
                                      placeholder={
                                        localSubTab === "client-comms"
                                          ? "Search clinic, phone..."
                                          : localSubTab === "complaints"
                                            ? "Search complaints..."
                                            : "Search patient, phone, file..."
                                      }
                                      value={localSubTab === "complaints" ? compSearch : ttSearchQuery}
                                      onChange={(e) =>
                                        localSubTab === "complaints" ? setCompSearch(e.target.value) : setTtSearchQuery(e.target.value)
                                      }
                                      className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                                    />
                                  </div>
                                  {localSubTab === "complaints" && isTLOreSupport && (
                                    <div className="relative w-full md:w-48 mt-2 md:mt-0">
                                       <span className="absolute left-3 top-2.5 text-slate-400">
                                         <Calendar className="w-4 h-4" />
                                       </span>
                                       <input
                                         type="date"
                                         value={compDateFilter}
                                         onChange={(e) => setCompDateFilter(e.target.value)}
                                         className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans font-medium [color-scheme:dark]"
                                        />
                                    </div>
                                  )}
                                </div>`;

code = code.replace(targetHeader, replaceHeader);

// 5. Replace Status Badges
const targetBadges = `                                                      {isPendingTL && (
                                                        <span className="text-[9px] uppercase tracking-wide font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md">
                                                          ⏳ PENDING TL
                                                        </span>
                                                      )}
                                                      {isNeedContact && (
                                                        <span className="text-[9px] uppercase tracking-wide font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded-md animate-pulse">
                                                          📞 TELEPHONE CLIENT
                                                        </span>
                                                      )}
                                                      {isClosed && (
                                                        <span className="text-[9px] uppercase tracking-wide font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md">
                                                          ✅ CLOSED CASE
                                                        </span>
                                                      )}`;

const replaceBadges = `                                                      <span className={\`text-[9px] uppercase tracking-wide font-extrabold px-2 py-0.5 rounded-md \${
                                                          isPendingTL ? "bg-amber-500/10 border border-amber-500/30 text-amber-300" :
                                                          isNeedContact ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse" :
                                                          isClosed ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : ""
                                                      }\`}>
                                                          {compStatusLabels[comp.status] || comp.status}
                                                      </span>`;

code = code.replace(targetBadges, replaceBadges);

// 6. Update TL Comment with timestamp
const targetComment = `                                                        <p className="bg-rose-950/10 p-2 rounded-lg border border-pink-500/10 text-slate-200 leading-normal font-sans">
                                                          {comp.tlComment}
                                                        </p>
                                                      </div>
                                                    )}`;

const replaceComment = `                                                        <p className="bg-rose-950/10 p-2 rounded-lg border border-pink-500/10 text-slate-200 leading-normal font-sans">
                                                          {comp.tlComment}
                                                        </p>
                                                        {comp.tlHandledAt && (
                                                          <p className='text-[10px] text-slate-500 mt-1 font-mono'>
                                                            Last updated by {comp.tlHandledBy || 'TL'} at {new Date(comp.tlHandledAt).toLocaleString()}
                                                          </p>
                                                        )}
                                                      </div>
                                                    )}`;

code = code.replace(targetComment, replaceComment);

// Write changes
fs.writeFileSync('src/App.tsx', code);
console.log("Patches applied.");
