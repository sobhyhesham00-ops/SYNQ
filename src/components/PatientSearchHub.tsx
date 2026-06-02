import React, { useState } from 'react';
import { Search, History, MessageCircle, FileText, CheckCircle2, X, Download } from 'lucide-react';
import { Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint, ClientCommunicationRequest, CaseRecord } from '../types';

interface PatientSearchHubProps {
  inquiries: Inquiry[];
  ttRequests: TabbyTamaraRequest[];
  ttComplaints: TabbyTamaraComplaint[];
  clientComms: ClientCommunicationRequest[];
  cases: CaseRecord[];
}

export function PatientSearchHub({
  inquiries,
  ttRequests,
  ttComplaints,
  clientComms,
  cases
}: PatientSearchHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const downloadFile = (url: string, prefix: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${prefix}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(searchQuery || '').trim()) return;
    setHasSearched(true);
  };

  const cleanPhone = (phone: string | undefined) => phone?.replace(/\D/g, '') || '';
  const phoneQuery = cleanPhone(searchQuery);
  const textQuery = String(searchQuery || '').trim().toLowerCase();

  const isMatch = (item: any) => {
    if (!String(searchQuery || '').trim()) return false;
    if (phoneQuery && item.phoneNumber && cleanPhone(item.phoneNumber).includes(phoneQuery)) return true;
    if (item.clinicName && item.clinicName.toLowerCase().includes(textQuery)) return true;
    if (item.patientName && item.patientName.toLowerCase().includes(textQuery)) return true;
    return false;
  };

  const matchedInquiries = hasSearched ? inquiries.filter(isMatch) : [];
  const matchedTTReq = hasSearched ? ttRequests.filter(isMatch) : [];
  const matchedTTComp = hasSearched ? ttComplaints.filter(isMatch) : [];
  const matchedComms = hasSearched ? clientComms.filter(isMatch) : [];
  const matchedCases = hasSearched ? cases.filter(isMatch) : [];

  const totalResults = matchedInquiries.length + matchedTTReq.length + matchedTTComp.length + matchedComms.length + matchedCases.length;

  const getAllPatientNames = () => {
    const names = new Set<string>();
    matchedTTReq.forEach(r => { if (r.patientName) names.add(r.patientName) });
    matchedTTComp.forEach(c => { if (c.patientName) names.add(c.patientName) });
    matchedCases.forEach(c => { if (c.patientName) names.add(c.patientName) });
    return Array.from(names);
  };
  const patientNames = getAllPatientNames();

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h2 className="text-3xl font-black font-display text-slate-100 flex items-center gap-3">
          <Search className="w-8 h-8 text-cyan-400" />
          Patient Search Hub
        </h2>
        <p className="text-slate-400 text-sm mt-1">Search patient history, interactions, and inquiries globally by phone, name, or clinic.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <form onSubmit={handleSearch} className="flex gap-4 items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setHasSearched(false); }}
            placeholder="Search by phone, clinic, or patient name..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-cyan-500 font-mono tracking-wider transition-colors"
          />
          <button
            type="submit"
            disabled={!String(searchQuery || '').trim()}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search Records
          </button>
        </form>
      </div>

      {hasSearched && String(searchQuery || '').trim() && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 py-2 border-b border-white/10">
            <h3 className="text-xl font-bold text-slate-200">
              Results found: <span className="text-cyan-400">{totalResults}</span>
            </h3>
            {patientNames.length > 0 && (
              <div className="text-sm px-4 py-1.5 bg-slate-800 rounded-lg text-slate-300 font-semibold border border-slate-700">
                Known Names: {patientNames.join(' | ')}
              </div>
            )}
          </div>

          {totalResults === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-black/20 rounded-3xl border border-dashed border-white/10">
              No historical interaction found for phone number matching '{searchQuery}'.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Inquiries */}
              {matchedInquiries.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-amber-500 uppercase tracking-widest text-xs">
                    <MessageCircle className="w-4 h-4" /> General Inquiries ({matchedInquiries.length})
                  </h4>
                  {matchedInquiries.map(inq => (
                    <div key={inq.id} className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-start text-xs text-slate-400">
                        <span><span className="text-slate-300 font-bold">{inq.agentName}</span> @ {inq.clinicName}</span>
                        <span>{new Date(inq.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-200 text-sm italic border-l-2 border-amber-500/30 pl-3 my-1">
                        "{inq.text}"
                      </div>
                      {inq.status === 'answered' && inq.answer && (
                        <div className="mt-2 bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3"/> Resolution:</span>
                          <span className="text-sm text-slate-300">{inq.answer}</span>
                        </div>
                      )}
                      {inq.photos && inq.photos.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {inq.photos.map((p, idx) => (
                            <button key={idx} onClick={() => setViewerImage(p)} className="focus:outline-none">
                              <img src={p} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-amber-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          ))}
                        </div>
                      )}
                      {inq.links && inq.links.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {inq.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-amber-400 underline truncate max-w-[150px] bg-amber-500/10 px-2 py-1 rounded">{link}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Client Comms */}
              {matchedComms.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-sky-500 uppercase tracking-widest text-xs">
                    <MessageCircle className="w-4 h-4" /> Client Communications ({matchedComms.length})
                  </h4>
                  {matchedComms.map(cc => (
                    <div key={cc.id} className="bg-sky-500/5 border border-sky-500/20 p-4 rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-start text-xs text-slate-400">
                        <span><span className="text-slate-300 font-bold">{cc.callCenterAgentName}</span> @ {cc.clinicName}</span>
                        <span>{new Date(cc.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-200 text-sm">
                        {cc.notes}
                      </div>
                      {((cc.photos && cc.photos.length > 0) || cc.screenshot) && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {cc.screenshot && (
                            <button onClick={() => setViewerImage(cc.screenshot!)} className="focus:outline-none">
                              <img src={cc.screenshot} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-sky-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          )}
                          {cc.photos?.map((p, idx) => (
                            <button key={idx} onClick={() => setViewerImage(p)} className="focus:outline-none">
                              <img src={p} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-sky-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          ))}
                        </div>
                      )}
                      {cc.links && cc.links.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {cc.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-sky-400 underline truncate max-w-[150px] bg-sky-500/10 px-2 py-1 rounded">{link}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TT Requests */}
              {matchedTTReq.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-rose-500 uppercase tracking-widest text-xs">
                    <FileText className="w-4 h-4" /> Tabby & Tamara Requests ({matchedTTReq.length})
                  </h4>
                  {matchedTTReq.map(tt => (
                    <div key={tt.id} className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl flex flex-col gap-2">
                       <div className="flex justify-between items-start text-xs text-slate-400">
                        <span><span className="text-slate-300 font-bold">{tt.agentName}</span> @ {tt.clinicName}</span>
                        <span>{new Date(tt.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-200 mt-1">
                         <span className="font-bold uppercase text-xs px-2 py-1 bg-black/30 rounded">{tt.platform}</span>
                         <span className="font-mono text-rose-300">{tt.priceWithoutTax ? 'SAR ' + tt.priceWithoutTax : ''}</span>
                      </div>
                      {((tt.photos && tt.photos.length > 0) || tt.paymentScreenshot) && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {tt.paymentScreenshot && (
                            <button onClick={() => setViewerImage(tt.paymentScreenshot!)} className="focus:outline-none">
                              <img src={tt.paymentScreenshot} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-rose-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          )}
                          {tt.photos?.map((p, idx) => (
                            <button key={idx} onClick={() => setViewerImage(p)} className="focus:outline-none">
                              <img src={p} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-rose-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          ))}
                        </div>
                      )}
                      {tt.links && tt.links.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {tt.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-rose-400 underline truncate max-w-[150px] bg-rose-500/10 px-2 py-1 rounded">{link}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Cases */}
              {matchedCases.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-orange-500 uppercase tracking-widest text-xs">
                    <History className="w-4 h-4" /> Service Cases ({matchedCases.length})
                  </h4>
                  {matchedCases.map(c => (
                    <div key={c.id} className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl flex flex-col gap-2">
                       <div className="flex justify-between items-start text-xs text-slate-400">
                        <span><span className="text-slate-300 font-bold">{c.agentName}</span> {c.leadSource ? `@ ${c.leadSource}` : ''}</span>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-200 text-sm">
                        {c.inquiry}
                      </div>
                      {((c.photos && c.photos.length > 0) || c.screenshot) && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {c.screenshot && (
                            <button onClick={() => setViewerImage(c.screenshot!)} className="focus:outline-none">
                              <img src={c.screenshot} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-orange-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          )}
                          {c.photos?.map((p, idx) => (
                            <button key={idx} onClick={() => setViewerImage(p)} className="focus:outline-none">
                              <img src={p} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-orange-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          ))}
                        </div>
                      )}
                      {c.links && c.links.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {c.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-orange-400 underline truncate max-w-[150px] bg-orange-500/10 px-2 py-1 rounded">{link}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TT Complaints */}
              {matchedTTComp.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-red-500 uppercase tracking-widest text-xs">
                    <History className="w-4 h-4" /> TT Complaints ({matchedTTComp.length})
                  </h4>
                  {matchedTTComp.map(c => (
                    <div key={c.id} className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex flex-col gap-2">
                       <div className="flex justify-between items-start text-xs text-slate-400">
                        <span><span className="text-slate-300 font-bold">{c.agentName}</span> @ {c.clinicName}</span>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-200 text-sm bg-black/20 p-2 rounded">
                        {c.complaintDetails}
                      </div>
                      {((c.photos && c.photos.length > 0) || c.imageUrl) && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {c.imageUrl && (
                            <button onClick={() => setViewerImage(c.imageUrl!)} className="focus:outline-none">
                              <img src={c.imageUrl} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-red-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          )}
                          {c.photos?.map((p, idx) => (
                            <button key={idx} onClick={() => setViewerImage(p)} className="focus:outline-none">
                              <img src={p} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-red-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          ))}
                        </div>
                      )}
                      {c.links && c.links.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {c.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-red-400 underline truncate max-w-[150px] bg-red-500/10 px-2 py-1 rounded">{link}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {viewerImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm shadow-2xl p-4" onClick={() => setViewerImage(null)}>
          <div className="absolute top-4 right-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition border border-white/10 shadow-lg"
              onClick={() => downloadFile(viewerImage, 'patient_document')}
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Download Attachment
            </button>
            <button className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition border border-white/10" onClick={() => setViewerImage(null)}>
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>
          <img src={viewerImage} alt="Fullscreen Attachment" className="max-w-full max-h-[90vh] rounded-2xl border border-slate-800 object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
