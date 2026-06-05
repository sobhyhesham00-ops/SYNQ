const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCode = `                      {/* Inquiries Records display */}
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
                              })
                              .map((inq) => {`;

const newCode = `                      {/* Inquiries Records display */}
                      {(() => {
                        const filteredInquiries = inquiries.filter(i => {
                          const s = inquirySearchQuery.toLowerCase();
                          const cleanPhone = (p: string) => p.replace(/\\D/g, '').replace(/^0+/, '');
                          const matchesSearch = !s || i.agentName?.toLowerCase().includes(s) || i.text.toLowerCase().includes(s) || i.clinicName?.toLowerCase().includes(s) || i.answer?.toLowerCase().includes(s) || (i.phoneNumber && cleanPhone(i.phoneNumber).includes(cleanPhone(inquirySearchQuery)));
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
                                filteredInquiries.map((inq) => {`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  
  // also need to close the IIFE where the div ends.
  // The div closes around line 15998. Let's find it.
} else {
  console.log("Not found.");
}
fs.writeFileSync('src/App.tsx', code);
