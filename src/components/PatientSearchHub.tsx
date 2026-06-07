import React, { useState, useMemo, useRef } from 'react';
import { Search, History, MessageCircle, FileText, CheckCircle2, X, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint, ClientCommunicationRequest, CaseRecord } from '../types';
import { CopyWrap } from './CopyWrap';
import { formatCaseRef, normalizePhone } from '../utils';

interface PatientSearchHubProps {
  inquiries: Inquiry[];
  ttRequests: TabbyTamaraRequest[];
  ttComplaints: TabbyTamaraComplaint[];
  clientComms: ClientCommunicationRequest[];
  cases: CaseRecord[];
  currentUser?: { name: string; role: string };
  requests?: any[];
}


const getRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = Math.abs(now.getTime() - date.getTime());
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};


const cleanPhone = (p: string | undefined) => (p || '').replace(/\D/g, '').replace(/^0+/, '');


export function PatientSearchHub({
  inquiries,
  ttRequests,
  ttComplaints,
  clientComms,
  cases,
  currentUser,
  requests = []
}: PatientSearchHubProps) {
  const [inputVal, setInputVal] = useState('');
  const [query, setQuery] = useState('');
  const debounceRef = useRef<any>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const hasSearched = query.length >= 3;

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

  const isMatch = (item: any) => {
    if (!query) return false;
    const q = query.toLowerCase();
    const qPhone = normalizePhone(query);
    const fields = [
      item.agentName, item.callCenterAgentName, item.patientName,
      item.clinicName, item.text, item.inquiry, item.complaintDetails,
      item.notes, item.handlingNotes, item.id
    ];
    if (fields.some(f => f && String(f).toLowerCase().includes(q))) return true;
    if (qPhone.length >= 4 && item.phoneNumber) {
      if (normalizePhone(item.phoneNumber).includes(qPhone) || qPhone.includes(normalizePhone(item.phoneNumber))) return true;
    }
    return false;
  };

  const matchedItems = useMemo(() => {
    if (!query.trim()) return [];

    const allResults: any[] = [
      ...inquiries.filter(isMatch).map(r => ({...r, _rType: 'inq', _type: 'inquiry'})),
      ...ttRequests.filter(isMatch).map(r => ({...r, _rType: 'tt_request', _type: 'tt_request'})),
      ...ttComplaints.filter(isMatch).map(r => ({...r, _rType: 'tt_complaint', _type: 'tt_complaint'})),
      ...clientComms.filter(isMatch).map(r => ({...r, _rType: 'comm', _type: 'comm'})),
      ...cases.filter(isMatch).map(r => ({...r, _rType: 'case', _type: 'case'})),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return allResults;
  }, [query, inquiries, ttRequests, ttComplaints, clientComms, cases]);

  const allResults = matchedItems;

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };


  const renderTimelineCard = (item: any) => {
    const isExpanded = !!expandedItems[item.id];
    
    let title = '';
    let typeLab;
    let summary = '';
    
    if (item._type === 'sched') {
      title = item.type === 'swap' ? 'Shift Swap' : 'Annual Leave';
      typeLab = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-300">{title}</span>;
      summary = item.notes || `Shift Date: ${item.date || item.startDate}`;
    } else if (item._type === 'inquiry') {
      title = 'QA Inquiry';
      typeLab = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-300">{title}</span>;
      summary = item.text || 'No inquiry text';
    } else if (item._type === 'tt_request') {
      title = 'Tabby/Tamara Request';
      typeLab = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 text-orange-300">{title}</span>;
      summary = `Platform: ${item.platform} - ${item.notes || 'No notes'}`;
    } else if (item._type === 'tt_complaint') {
      title = 'Complaint';
      typeLab = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-300">{title}</span>;
      summary = item.complaintDetails || 'No details';
    } else if (item._type === 'comm') {
      title = 'Client Communication';
      typeLab = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">{title}</span>;
      summary = item.handlingNotes || 'No handling notes';
    } else if (item._type === 'case') {
      title = 'Case Record';
      typeLab = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">{title}</span>;
      summary = item.inquiry || 'No case details';
    }

    let statusClass = "bg-slate-800 border-slate-700 text-slate-300";
    if (item.status === 'pending_partner' || item.status === 'pending') {
      statusClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
    } else if (item.status === 'approved' || item.status === 'answered' || item.status === 'closed') {
      statusClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    } else if (item.status === 'rejected' || item.status === 'cancelled') {
      statusClass = "bg-rose-500/10 border-rose-500/20 text-rose-400";
    }
    
    const statusLabel = item.status?.replace(/_/g, ' ') || 'OPEN';

    return (
      <div key={item.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-3 hover:border-white/20 transition-all text-left w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden w-full">
          <div className="flex items-center gap-3 flex-wrap">
            {typeLab}
            <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase shrink-0 ${statusClass}`}>
              {statusLabel}
            </span>
            <span className="text-slate-400 text-xs font-mono bg-black/20 px-2 py-1 rounded inline-block max-w-[150px] sm:max-w-max truncate">
               <CopyWrap text={item.id || ''}>{formatCaseRef(item.id, item._type)}</CopyWrap>
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono text-left sm:text-right shrink-0" title={new Date(item.createdAt).toLocaleString()}>
            {getRelativeTime(item.createdAt)}
          </div>
        </div>

        {/* Content Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 cursor-pointer" onClick={() => toggleExpand(item.id)}>
          <div className="flex-1 space-y-1 w-full min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
               {(item.patientName || item.clinicName) && (
                 <span className="flex gap-2">
                   {item.patientName && <span className="font-bold text-slate-200"><CopyWrap text={item.patientName}>{item.patientName}</CopyWrap></span>}
                   {item.patientName && item.clinicName && <span className="text-slate-500">@</span>}
                   {item.clinicName && <span className="font-medium text-slate-300"><CopyWrap text={item.clinicName}>{item.clinicName}</CopyWrap></span>}
                 </span>
               )}
               {item.phoneNumber && (
                 <span className="font-mono text-slate-400">
                   <CopyWrap text={item.phoneNumber} phoneMode={true} label="Phone">{item.phoneNumber}</CopyWrap>
                 </span>
               )}
            </div>
            
            <p className="text-sm text-slate-200 line-clamp-2 mt-2">{summary}</p>
            
            <p className="text-[10px] text-slate-500 pt-1">By: {item.agentName || item.callCenterAgentName || 'Unknown Agent'}</p>
          </div>
          
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0 self-start sm:self-center">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fade-in pl-2 border-l-2 border-l-slate-700/50">
            {/* Extended fields */}
            {item.tlNotes && (
               <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                 <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-1">TL Notes</p>
                 <p className="text-sm text-slate-200">{item.tlNotes}</p>
               </div>
            )}
            {item.tlComment && (
               <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                 <p className="text-[10px] uppercase tracking-widest font-bold text-rose-400 mb-1">TL Comment</p>
                 <p className="text-sm text-slate-200">{item.tlComment}</p>
               </div>
            )}
            {item.answer && (
               <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                 <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 mb-1">QA Answer</p>
                 <p className="text-sm text-slate-200">{item.answer}</p>
               </div>
            )}
            
            {/* Attachments */}
            {((item.photos && item.photos.length > 0) || item.screenshot || item.imageUrl || item.paymentScreenshot) && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Attachments</p>
                <div className="flex gap-2 flex-wrap">
                  {[...(item.photos || []), ...(item.screenshot ? [item.screenshot] : []), ...(item.imageUrl ? [item.imageUrl] : []), ...(item.paymentScreenshot ? [item.paymentScreenshot] : [])].map((p, idx) => (
                    <button key={idx} onClick={() => setViewerImage(p as string)} className="focus:outline-none">
                      <img src={p as string} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-slate-700 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {item.links && item.links.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Links</p>
                <div className="flex gap-2 flex-wrap">
                  {item.links.map((link: string, idx: number) => (
                    <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 underline truncate max-w-[200px] bg-cyan-500/10 px-2 py-1 rounded inline-block">{link}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h2 className="text-3xl font-black font-display text-slate-100 flex items-center gap-3">
          <Search className="w-8 h-8 text-cyan-400" />
          Patient Search Hub
        </h2>
        <p className="text-slate-400 text-sm mt-1">Search patient history, interactions, and inquiries globally.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => setQuery(e.target.value.trim()), 300);
            }}
            placeholder="e.g. 0501234567 or ahmed or INQ-202505"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-12 py-3.5 text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans tracking-wide transition-colors"
          />
          {inputVal && (
             <button 
               onClick={() => { setInputVal(''); setQuery(''); }}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
             >
               <X className="w-4 h-4" />
             </button>
          )}
        </div>
        <p className='text-[11px] text-slate-500 mt-2'>Type at least 3 characters to search...</p>
      </div>

      {hasSearched && (
        <div className="space-y-6">
          {/* Header Profile */}
          {allResults.length > 0 && (
            <div className='p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-4 text-left'>
              <p className='text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2'>👤 Patient Profile</p>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                <div><span className='text-slate-500'>Names seen:</span> <span className='text-slate-200'>{[...new Set(allResults.map(r => r.patientName).filter(Boolean))].join(', ')}</span></div>
                <div><span className='text-slate-500'>Phone:</span> <span className='text-slate-200 font-mono'>{query}</span></div>
                <div><span className='text-slate-500'>First contact:</span> <span className='text-slate-200'>{allResults.length ? new Date(allResults[allResults.length-1].createdAt).toLocaleDateString() : 'N/A'}</span></div>
                <div><span className='text-slate-500'>Total interactions:</span> <span className='text-slate-200 font-bold'>{allResults.length}</span></div>
              </div>
            </div>
          )}

          {/* Timeline list */}
          <div className="space-y-4">
             {matchedItems.length === 0 ? (
               <div className="text-center py-12 text-slate-400 space-y-2 bg-slate-900/30 rounded-2xl border border-slate-800">
                 <History className="w-10 h-10 mx-auto text-slate-600 mb-4" />
                 <p>No records found matching "{query}"</p>
                 <p className="text-xs text-slate-500">Try a different phone number, name or reference ID.</p>
               </div>
             ) : (
               <div className="space-y-3 w-full">
                 <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 pl-2 border-l-2 border-cyan-500">Timeline</h3>
                 {matchedItems.map(renderTimelineCard)}
               </div>
             )}
          </div>
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
