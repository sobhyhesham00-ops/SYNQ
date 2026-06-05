const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const t1 = `                      {/* Inquiries Records display */}
                      <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl space-y-4">
                        <div className="border-b border-white/5 pb-3">
                          <h3 className="text-base font-bold text-slate-100 font-display">
                            Inquiry Record Pipeline
                          </h3>
                          <p className="text-xs text-slate-400">
                            Total matched cases waiting in queue:{" "}
                            {
                              inquiries.filter((i) => {
                                const matchesSearch =
                                  i.agentName
                                    ?.toLowerCase()
                                    .includes(
                                      inquirySearchQuery.toLowerCase(),
                                    ) ||
                                  i.text
                                    .toLowerCase()
                                    .includes(
                                      inquirySearchQuery.toLowerCase(),
                                    ) ||
                                  getAgentLOB(i.agentName)
                                    .toLowerCase()
                                    .includes(
                                      inquirySearchQuery.toLowerCase(),
                                    ) ||
                                  (i.clinicName &&
                                    i.clinicName
                                      .toLowerCase()
                                      .includes(
                                        inquirySearchQuery.toLowerCase(),
                                      )) ||
                                  (i.answer &&
                                    i.answer
                                      .toLowerCase()
                                      .includes(
                                        inquirySearchQuery.toLowerCase(),
                                      )) ||
                                  (i.phoneNumber &&
                                    i.phoneNumber
                                      .toLowerCase()
                                      .includes(
                                        inquirySearchQuery.toLowerCase(),
                                      ));
                                const matchesStatus =
                                  inquiryStatusFilter === "" ||
                                  i.status === inquiryStatusFilter;
                                const matchesClinic =
                                  inquiryClinicFilter === "all" ||
                                  (i.clinicName &&
                                    i.clinicName.toLowerCase() ===
                                      inquiryClinicFilter.toLowerCase());
                                return (
                                  matchesSearch &&
                                  matchesStatus &&
                                  matchesClinic
                                );
                              }).length
                            }
                          </p>
                        </div>

                        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                          {inquiries.filter((i) => {
                            const matchesSearch =
                              i.agentName
                                ?.toLowerCase()
                                .includes(inquirySearchQuery.toLowerCase()) ||
                              i.text
                                .toLowerCase()
                                .includes(inquirySearchQuery.toLowerCase()) ||
                              getAgentLOB(i.agentName)
                                .toLowerCase()
                                .includes(inquirySearchQuery.toLowerCase()) ||
                              (i.clinicName &&
                                i.clinicName
                                  .toLowerCase()
                                  .includes(
                                    inquirySearchQuery.toLowerCase(),
                                  )) ||
                              (i.answer &&
                                i.answer
                                  .toLowerCase()
                                  .includes(
                                    inquirySearchQuery.toLowerCase(),
                                  )) ||
                              (i.phoneNumber &&
                                i.phoneNumber
                                  .toLowerCase()
                                  .includes(inquirySearchQuery.toLowerCase()));
                            const matchesStatus =
                              inquiryStatusFilter === "" ||
                              i.status === inquiryStatusFilter;
                            const matchesClinic =
                              inquiryClinicFilter === "all" ||
                              (i.clinicName &&
                                i.clinicName.toLowerCase() ===
                                  inquiryClinicFilter.toLowerCase());
                            return (
                              matchesSearch && matchesStatus && matchesClinic
                            );
                          }).length === 0 ? (
                            <div className="text-center py-16">
                              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-2 animate-pulse" />
                              <p className="text-xs text-slate-400 italic">
                                No inquiries match the search filters or the
                                queue is currently empty.
                              </p>
                            </div>
                          ) : (
                            inquiries
                              .filter((i) => {
                                const matchesSearch =
                                  i.agentName
                                    ?.toLowerCase()
                                    .includes(
                                      inquirySearchQuery.toLowerCase(),
                                    ) ||
                                  i.text
                                    .toLowerCase()
                                    .includes(
                                      inquirySearchQuery.toLowerCase(),
                                    ) ||
                                  getAgentLOB(i.agentName)
                                    .toLowerCase()
                                    .includes(
                                      inquirySearchQuery.toLowerCase(),
                                    ) ||
                                  (i.clinicName &&
                                    i.clinicName
                                      .toLowerCase()
                                      .includes(
                                        inquirySearchQuery.toLowerCase(),
                                      )) ||
                                  (i.answer &&
                                    i.answer
                                      .toLowerCase()
                                      .includes(
                                        inquirySearchQuery.toLowerCase(),
                                      )) ||
                                  (i.phoneNumber &&
                                    i.phoneNumber
                                      .toLowerCase()
                                      .includes(
                                        inquirySearchQuery.toLowerCase(),
                                      ));
                                const matchesStatus =
                                  inquiryStatusFilter === "" ||
                                  i.status === inquiryStatusFilter;
                                const matchesClinic =
                                  inquiryClinicFilter === "all" ||
                                  (i.clinicName &&
                                    i.clinicName.toLowerCase() ===
                                      inquiryClinicFilter.toLowerCase());
                                return (
                                  matchesSearch &&
                                  matchesStatus &&
                                  matchesClinic
                                );
                              })`;

const r1 = \`                      {/* Inquiries Records display */}
                      {(() => {
                        const filteredInquiries = inquiries.filter(i => {
                          const s = inquirySearchQuery.toLowerCase();
                          const cleanPhone = (p: string) => p.replace(/\\\\D/g, '').replace(/^0+/, '');
                          const matchesSearch = !s || i.agentName?.toLowerCase().includes(s) || i.text.toLowerCase().includes(s) || i.clinicName?.toLowerCase().includes(s) || i.answer?.toLowerCase().includes(s) || getAgentLOB(i.agentName).toLowerCase().includes(s) || (i.phoneNumber && cleanPhone(i.phoneNumber).includes(cleanPhone(inquirySearchQuery)));
                          const matchesStatus = !inquiryStatusFilter || i.status === inquiryStatusFilter;
                          const matchesClinic = inquiryClinicFilter === 'all' || i.clinicName?.toLowerCase() === inquiryClinicFilter.toLowerCase();
                          return matchesSearch && matchesStatus && matchesClinic;
                        });

                        return (
                          <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl space-y-4">
                            <div className="border-b border-white/5 pb-3">
                              <h3 className="text-base font-bold text-slate-100 font-display">
                                Inquiry Record Pipeline
                              </h3>
                              <p className="text-xs text-slate-400">
                                Total matched cases waiting in queue:{" "}
                                {filteredInquiries.length}
                              </p>
                            </div>

                            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                              {filteredInquiries.length === 0 ? (
                                <div className="text-center py-16">
                                  <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-2 animate-pulse" />
                                  <p className="text-xs text-slate-400 italic">
                                    No inquiries match the search filters or the
                                    queue is currently empty.
                                  </p>
                                </div>
                              ) : (
                                filteredInquiries\`;
                                
if (code.includes(t1)) {
    code = code.replace(t1, r1);
} else {
    console.log("t1 not found");
}

const t2 = \`                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>\`;

const r2 = \`                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>
                      );
                    })()}\`;

if (code.includes(t2)) {
    code = code.replace(t2, r2);
} else {
    console.log("t2 not found");
}

fs.writeFileSync('src/App.tsx', code);
