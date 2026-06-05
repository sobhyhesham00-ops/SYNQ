import React, { useState, useMemo } from 'react';
import { Search, Filter, ClipboardList, Clock, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { RequestReplyThread } from './RequestReplyThread';
import { CopyWrap } from './CopyWrap';

export const AgentRequestsLogs = ({ 
  currentUser, 
  requests, 
  inquiries, 
  tabbyTamaraRequests, 
  complaints, 
  clientComms,
  canEditItem,
  getRemainingEditTime,
  setEditingItem,
  handleCancelRequest
}: any) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  
  const allRequests = useMemo(() => {
    if (!currentUser || currentUser.role !== 'agent') return [];
    const res: any[] = [];
    
    requests.filter((r: any) => r.agentName === currentUser.name).forEach((r: any) => res.push({...r, _cType: 'sched'}));
    inquiries.filter((r: any) => r.agentName === currentUser.name).forEach((r: any) => res.push({...r, _cType: 'inq'}));
    tabbyTamaraRequests.filter((r: any) => r.agentName === currentUser.name).forEach((r: any) => res.push({...r, _cType: 'tt'}));
    complaints.filter((r: any) => r.agentName === currentUser.name).forEach((r: any) => res.push({...r, _cType: 'comp'}));
    clientComms.filter((r: any) => r.callCenterAgentName === currentUser.name).forEach((r: any) => res.push({...r, _cType: 'comm'}));
    
    return res.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, inquiries, tabbyTamaraRequests, complaints, clientComms, currentUser]);

  const filtered = allRequests.filter(r => {
    const s = search.toLowerCase();
    const matchesSearch = !s || 
      (r.id && r.id.toLowerCase().includes(s)) ||
      (r.phoneNumber && r.phoneNumber.toLowerCase().includes(s)) ||
      (r.patientName && r.patientName.toLowerCase().includes(s)) ||
      (r.text && r.text.toLowerCase().includes(s)) ||
      (r.complaintDetails && r.complaintDetails.toLowerCase().includes(s)) ||
      (r.notes && r.notes.toLowerCase().includes(s));
      
    if (!matchesSearch) return false;
    if (filterType !== 'all' && r._cType !== filterType) return false;

    if (filterDate) {
      const qDate = new Date(filterDate).toDateString();
      const itemDate = new Date(r.createdAt).toDateString();
      if (qDate !== itemDate) return false;
    }

    return true;
  });

  const renderCard = (req: any) => {
    const copyText = (e: React.MouseEvent, text: string) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text);
      let btn = e.currentTarget as HTMLButtonElement;
      let orig = btn.innerText;
      btn.innerText = "Copied!";
      setTimeout(() => { btn.innerText = orig; }, 1000);
    };

    let title = "";
    let content = null;
    let typeLab = null;
    let copyData = "";
    
    if (req._cType === 'sched') {
      title = req.type === 'swap' ? 'Shift Swap Request' : 'Annual Leave Request';
      typeLab = <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${req.type === 'swap' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>{title}</span>;
      copyData = `ID: ${req.id}\nType: ${title}\nDate: ${new Date(req.createdAt).toLocaleString()}\nStatus: ${req.status}`;
      content = (
        <>
          {req.type === 'swap' ? (
            <p className="text-sm font-bold text-slate-100">Swap shift for <span className="text-indigo-300">{req.date}</span></p>
          ) : (
            <p className="text-sm font-bold text-slate-100">Leave duration: <span className="text-emerald-300">{req.startDate}</span> to <span className="text-emerald-300">{req.endDate}</span></p>
          )}
          {req.notes && <p className="text-slate-400 text-xs italic mt-1 font-sans">"{req.notes}"</p>}
        </>
      );
    } else if (req._cType === 'inq') {
      title = 'QA Inquiry';
      typeLab = <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-300">{title}</span>;
      copyData = `ID: ${req.id}\nPatient Phone: ${req.phoneNumber}\nClinic: ${req.clinicName}\nInquiry: ${req.text}\nStatus: ${req.status}`;
      content = (
        <>
          <p className="text-sm font-bold text-slate-100">Clinic: <CopyWrap text={req.clinicName || 'N/A'}>{req.clinicName || 'N/A'}</CopyWrap></p>
          <p className="text-xs text-slate-300 font-mono">Phone: <CopyWrap text={req.phoneNumber || 'N/A'}>{req.phoneNumber || 'N/A'}</CopyWrap></p>
          <div className="text-slate-200 text-sm mt-1"><CopyWrap text={req.text || ''}>{req.text}</CopyWrap></div>
          {req.answer && (
             <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
               <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Answered</p>
               <p className="text-sm text-slate-200">{req.answer}</p>
             </div>
          )}
        </>
      );
    } else if (req._cType === 'tt') {
      title = 'Tabby/Tamara Request';
      typeLab = <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 text-orange-300">{title}</span>;
      copyData = `ID: ${req.id}\nPatient: ${req.patientName}\nPhone: ${req.phoneNumber}\nClinic: ${req.clinicName}\nPlatform: ${req.platform}\nStatus: ${req.status}`;
      content = (
        <>
          <p className="text-sm font-bold text-slate-100">Patient: <CopyWrap text={req.patientName || 'N/A'}>{req.patientName || 'N/A'}</CopyWrap> <span className="text-slate-400 text-xs font-normal">({req.platform})</span></p>
          <p className="text-xs text-slate-300 font-mono">Phone: <CopyWrap text={req.phoneNumber || 'N/A'}>{req.phoneNumber || 'N/A'}</CopyWrap> | Clinic: <CopyWrap text={req.clinicName || 'N/A'}>{req.clinicName || 'N/A'}</CopyWrap></p>
          {req.notes && <p className="text-slate-400 text-xs italic mt-1 font-sans">"{req.notes}"</p>}
        </>
      );
    } else if (req._cType === 'comp') {
      title = 'Complaint';
      typeLab = <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-300">{title}</span>;
      copyData = `ID: ${req.id}\nPatient: ${req.patientName}\nPhone: ${req.phoneNumber}\nClinic: ${req.clinicName}\nComplaint: ${req.complaintDetails}\nStatus: ${req.status}`;
      content = (
        <>
          <p className="text-sm font-bold text-slate-100">Patient: <CopyWrap text={req.patientName || 'N/A'}>{req.patientName || 'N/A'}</CopyWrap></p>
          <p className="text-xs text-slate-300 font-mono">Phone: <CopyWrap text={req.phoneNumber || 'N/A'}>{req.phoneNumber || 'N/A'}</CopyWrap> | Clinic: <CopyWrap text={req.clinicName || 'N/A'}>{req.clinicName || 'N/A'}</CopyWrap></p>
          <div className="text-slate-200 text-sm mt-1"><CopyWrap text={req.complaintDetails || ''}>{req.complaintDetails}</CopyWrap></div>
          {req.tlComment && (
             <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
               <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-1">TL Comment</p>
               <p className="text-sm text-slate-200">{req.tlComment}</p>
             </div>
          )}
        </>
      );
    } else if (req._cType === 'comm') {
      title = 'Client Communication';
      typeLab = <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">{title}</span>;
      copyData = `ID: ${req.id}\nPatient: ${req.patientName}\nPhone: ${req.phoneNumber}\nClinic: ${req.clinicName}\nNotes: ${req.handlingNotes}\nStatus: ${req.status}`;
      content = (
        <>
          <p className="text-sm font-bold text-slate-100">Patient: <CopyWrap text={req.patientName || 'N/A'}>{req.patientName || 'N/A'}</CopyWrap></p>
          <p className="text-xs text-slate-300 font-mono">Phone: <CopyWrap text={req.phoneNumber || 'N/A'}>{req.phoneNumber || 'N/A'}</CopyWrap> | Clinic: <CopyWrap text={req.clinicName || 'N/A'}>{req.clinicName || 'N/A'}</CopyWrap></p>
          <div className="text-slate-200 text-sm mt-1"><CopyWrap text={req.handlingNotes || ''}>{req.handlingNotes || 'No notes yet'}</CopyWrap></div>
        </>
      );
    }

    return (
      <div key={req.id + req._cType} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 hover:border-white/10 transition-all text-left">
        <div className="space-y-2 flex-grow min-w-[300px]">
          <div className="flex items-center gap-2 flex-wrap">
            {typeLab}
            <span className="text-[10px] text-slate-400 font-mono">
              ID: <CopyWrap text={req.id || ''}>{req.id}</CopyWrap> &bull; Submitted: {new Date(req.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="space-y-0.5">
            {content}
            <AttachmentsDisplay photos={[...(req.photos || []), ...(req.screenshot ? [req.screenshot] : []), ...(req.imageUrl ? [req.imageUrl] : []), ...(req.paymentScreenshot ? [req.paymentScreenshot] : [])]} links={req.links} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 self-stretch md:self-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0 min-w-[200px]">
          <div className="flex items-center justify-end gap-2 mb-1 w-full">
            <span className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-bold uppercase shrink-0">
              {req.status?.replace(/_/g, ' ')}
            </span>
            <button onClick={(e) => copyText(e, copyData)} className="p-1.5 px-3 text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer transition-colors shrink-0">
              Copy Details
            </button>
          </div>
          
          {req._cType === 'sched' && (
            <>
              {(req.status === 'pending_partner' || req.status === 'pending') && (
                <button onClick={() => handleCancelRequest(req.id)} className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline px-2 py-1 bg-rose-500/10 rounded-lg cursor-pointer mt-1">
                  Cancel Request
                </button>
              )}
              {canEditItem(req.createdAt) && (
                <button onClick={() => setEditingItem({ type: 'scheduling_request', id: req.id, data: { ...req } })} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline px-2 py-1 bg-emerald-500/10 rounded-lg cursor-pointer flex items-center gap-1 mt-1">
                  <Pencil className="w-3.5 h-3.5" /> Edit ({getRemainingEditTime(req.createdAt)})
                </button>
              )}
            </>
          )}

          {(req.actionBy || req.tlName) && (
            <p className="text-[10px] text-slate-400 mt-2">Handled by: {req.actionBy || req.tlName}</p>
          )}
        </div>
        
        {req._cType === 'sched' && (
          <div className="w-full mt-2 pt-2 border-t border-white/5">
            <RequestReplyThread request={req} currentUser={currentUser} collectionName="requests" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-100 font-display text-left">All My Requests</h2>
        <p className="text-slate-400 text-sm text-left">Review status, details and feedback on all your submitted requests.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
          <div className="relative flex-grow max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by ID, Name, Phone, details..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-sans" />
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center">
            <input type="date" title="Filter by submission date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full md:w-36 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-sans cursor-pointer h-9 [color-scheme:dark]" />
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full md:w-40 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-sans cursor-pointer h-9">
              <option value="all" className="bg-slate-800">All Types</option>
              <option value="sched" className="bg-slate-800">Leaves/Swaps</option>
              <option value="inq" className="bg-slate-800">Inquiries</option>
              <option value="tt" className="bg-slate-800">Tabby/Tamara</option>
              <option value="comp" className="bg-slate-800">Complaints</option>
              <option value="comm" className="bg-slate-800">Client Comms</option>
            </select>
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className="px-2 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold hover:bg-rose-500/20 whitespace-nowrap h-9"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <ClipboardList className="w-10 h-10 mx-auto text-indigo-400 opacity-50" />
              <p>No requests found matching your filter.</p>
            </div>
          ) : (
            filtered.map(renderCard)
          )}
        </div>
      </div>
    </div>
  );
};
