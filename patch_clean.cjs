const fs = require('fs');

const file = 'src/App.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const newLinesTop = `                      {(() => {
                        const filteredInquiries = inquiries.filter(i => {
                          const s = inquirySearchQuery.toLowerCase();
                          const cleanPhone = (p) => p.replace(/\\D/g, '').replace(/^0+/, '');
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
                                filteredInquiries`.split('\n');

// Replace lines 15661 to 15819 with newLinesTop
lines.splice(15661, 15820 - 15662 + 1, ...newLinesTop);

// Now the array has shifted length. We need to find the specific closing div to close the IIFE.
// It WAS at 16142, but since we replaced 159 lines with 34 lines, the index has shifted by 34 - 159 = -125.
// Let's just find `</div>\n                    </div>\n                  )}` dynamically by searching from 15800 onwards.

let found = -1;
for (let i = 15661; i < lines.length; i++) {
   if (lines[i] === '                      </div>' && lines[i+1] === '                    </div>' && lines[i+2] === '                  )}') {
      found = i;
      break;
   }
}

if (found !== -1) {
   // lines[found] is `                      </div>` - this is the end of the .bg-white/5 space-y-4 div
   lines[found] = `                      </div>\n                      );\n                    })()}`;
   fs.writeFileSync(file, lines.join('\n'));
   console.log('Successfully written via splice!');
} else {
   console.log('Unable to find closing tags safely.');
}
