import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ClipboardList, Clock, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { RequestReplyThread } from './RequestReplyThread';
import { CopyWrap } from './CopyWrap';

const formatCaseRef = (id: string, cType: string): string => {
  const typeMap: Record<string, string> = {
    sched: 'SCH',
    inq: 'INQ',
    tt_request: 'TTR',
    tt_complaint: 'TTC',
    comm: 'COM',
  };
  const prefix = typeMap[cType] || 'REF';
  const tsMatch = id.match(/(\d{10,13})/);
  if (!tsMatch) return `${prefix}-??????`;
  const ts = parseInt(tsMatch[1]);
  const d = new Date(ts > 9999999999 ? ts : ts * 1000);
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const suffix = String(ts).slice(-4);
  return `${prefix}-${ymd}-${suffix}`;
};

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

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  
  const allRequests = useMemo(() => {
    if (!currentUser || currentUser.role !== 'agent') return [];
    const res: any[] = [];
    
    requests.filter((r: any) => r.agentName === currentUser.name).forEach((r: any) => res.push({...r, _cType: 'sched'}));
    inquiries.filter((r: any) => r.agentName === currentUser.name).forEach((r: any) => res.push({...r, _cType: 'inq'}));
    tabbyTamaraRequests.filter((r: any) => r.agentName === currentUser.name).forEach((r: any) => res.push({...r, _cType: 'tt_request'}));
    complaints.filter((r: any) => r.agentName === currentUser.name).forEach((r: any) => res.push({...r, _cType: 'tt_complaint'}));
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
      typeLab = <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${req.type === 'swap' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>{title}</span>;
      copyData = `ID: ${req.id}\nType: ${title}\nDate: ${new Date(req.createdAt).toLocaleString()}\nStatus: ${req.status}`;
      content = (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {req.type === 'swap' ? (
             <>
               <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Swap shift for</p><p className="text-sm text-slate-200"><CopyWrap text={req.date || ''}>{req.date}</CopyWrap></p></div>
               {req.swapWithAgent && <div><p className="text-[10px] uppercase tracking-wider text-slate-500">With Agent</p><p className="text-sm text-slate-200"><CopyWrap text={req.swapWithAgent || ''}>{req.swapWithAgent}</CopyWrap></p></div>}
             </>
          ) : (
             <>
               <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Start Date</p><p className="text-sm text-slate-200"><CopyWrap text={req.startDate || ''}>{req.startDate}</CopyWrap></p></div>
               <div><p className="text-[10px] uppercase tracking-wider text-slate-500">End Date</p><p className="text-sm text-slate-200"><CopyWrap text={req.endDate || ''}>{req.endDate}</CopyWrap></p></div>
             </>
          )}
          {req.notes && <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Notes</p><div className="text-sm text-slate-200 italic">"<CopyWrap text={req.notes || ''}>{req.notes}</CopyWrap>"</div></div>}
        </div>
      );
    } else if (req._cType === 'inq') {
      title = 'QA Inquiry';
      typeLab = <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-300">{title}</span>;
      copyData = `ID: ${req.id}\nPatient Phone: ${req.phoneNumber}\nClinic: ${req.clinicName}\nInquiry: ${req.text}\nStatus: ${req.status}`;
      content = (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Clinic</p><p className="text-sm text-slate-200"><CopyWrap text={req.clinicName || 'N/A'}>{req.clinicName || 'N/A'}</CopyWrap></p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Phone</p><p className="text-sm text-slate-200 font-mono"><CopyWrap text={req.phoneNumber || 'N/A'} phoneMode={true} label='Phone'>{req.phoneNumber || 'N/A'}</CopyWrap></p></div>
          <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Inquiry</p><div className="text-sm text-slate-200"><CopyWrap text={req.text || ''}>{req.text}</CopyWrap></div></div>
          {req.answer && (
             <div className="col-span-2 mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
               <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Answered</p>
               <p className="text-sm text-slate-200">{req.answer}</p>
             </div>
          )}
        </div>
      );
    } else if (req._cType === 'tt_request') {
      title = 'Tabby/Tamara Request';
      typeLab = <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 text-orange-300">{title}</span>;
      copyData = `ID: ${req.id}\nPatient: ${req.patientName}\nPhone: ${req.phoneNumber}\nClinic: ${req.clinicName}\nPlatform: ${req.platform}\nStatus: ${req.status}`;
      content = (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Patient</p><p className="text-sm text-slate-200"><CopyWrap text={req.patientName || 'N/A'}>{req.patientName || 'N/A'}</CopyWrap> <span className="text-slate-400 text-xs font-normal">({req.platform})</span></p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Phone</p><p className="text-sm text-slate-200 font-mono"><CopyWrap text={req.phoneNumber || 'N/A'} phoneMode={true} label='Phone'>{req.phoneNumber || 'N/A'}</CopyWrap></p></div>
          <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Clinic</p><p className="text-sm text-slate-200"><CopyWrap text={req.clinicName || 'N/A'}>{req.clinicName || 'N/A'}</CopyWrap></p></div>
          {req.notes && <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Notes</p><p className="text-sm text-slate-200 italic font-sans">"<CopyWrap text={req.notes || ''}>{req.notes}</CopyWrap>"</p></div>}
        </div>
      );
    } else if (req._cType === 'tt_complaint') {
      title = 'Complaint';
      typeLab = <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-300">{title}</span>;
      copyData = `ID: ${req.id}\nPatient: ${req.patientName}\nPhone: ${req.phoneNumber}\nClinic: ${req.clinicName}\nComplaint: ${req.complaintDetails}\nStatus: ${req.status}`;
      content = (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Patient</p><p className="text-sm text-slate-200"><CopyWrap text={req.patientName || 'N/A'}>{req.patientName || 'N/A'}</CopyWrap></p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Phone</p><p className="text-sm text-slate-200 font-mono"><CopyWrap text={req.phoneNumber || 'N/A'} phoneMode={true} label='Phone'>{req.phoneNumber || 'N/A'}</CopyWrap></p></div>
          <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Clinic</p><p className="text-sm text-slate-200"><CopyWrap text={req.clinicName || 'N/A'}>{req.clinicName || 'N/A'}</CopyWrap></p></div>
          <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Complaint</p><div className="text-sm text-slate-200"><CopyWrap text={req.complaintDetails || ''}>{req.complaintDetails}</CopyWrap></div></div>
          {req.tlComment && (
             <div className="col-span-2 mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
               <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-1">TL Comment</p>
               <p className="text-sm text-slate-200">{req.tlComment}</p>
             </div>
          )}
        </div>
      );
    } else if (req._cType === 'comm') {
      title = 'Client Communication';
      typeLab = <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">{title}</span>;
      copyData = `ID: ${req.id}\nPatient: ${req.patientName}\nPhone: ${req.phoneNumber}\nClinic: ${req.clinicName}\nNotes: ${req.handlingNotes}\nStatus: ${req.status}`;
      content = (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Patient</p><p className="text-sm text-slate-200"><CopyWrap text={req.patientName || 'N/A'}>{req.patientName || 'N/A'}</CopyWrap></p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Phone</p><p className="text-sm text-slate-200 font-mono"><CopyWrap text={req.phoneNumber || 'N/A'} phoneMode={true} label='Phone'>{req.phoneNumber || 'N/A'}</CopyWrap></p></div>
          <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Clinic</p><p className="text-sm text-slate-200"><CopyWrap text={req.clinicName || 'N/A'}>{req.clinicName || 'N/A'}</CopyWrap></p></div>
          <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Notes</p><div className="text-sm text-slate-200"><CopyWrap text={req.handlingNotes || ''}>{req.handlingNotes || 'No notes yet'}</CopyWrap></div></div>
        </div>
      );
    }

    let statusClass = "bg-slate-800 border-slate-700 text-slate-300";
    if (req.status === 'pending_partner' || req.status === 'pending') {
      statusClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
    } else if (req.status === 'approved' || req.status === 'answered' || req.status === 'closed') {
      statusClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    } else if (req.status === 'rejected' || req.status === 'cancelled') {
      statusClass = "bg-rose-500/10 border-rose-500/20 text-rose-400";
    }

    let statusLabel = req.status?.replace(/_/g, ' ') || '';

    return (
      <div key={req.id + req._cType} className="flex flex-col p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all text-left space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {typeLab}
            <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase shrink-0 ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
             <CopyWrap text={req.id || ''}>{formatCaseRef(req.id, req._cType)}</CopyWrap> &bull; {new Date(req.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-1">
          {content}
          <AttachmentsDisplay photos={[...(req.photos || []), ...(req.screenshot ? [req.screenshot] : []), ...(req.imageUrl ? [req.imageUrl] : []), ...(req.paymentScreenshot ? [req.paymentScreenshot] : [])]} links={req.links} />
        </div>

        {/* Action Row */}
        <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
          <div className="text-[10px] text-slate-400">
            {(req.actionBy || req.tlName) ? `Handled by: ${req.actionBy || req.tlName}` : ''}
          </div>
          <div className="flex items-center justify-end gap-2">
            {req._cType === 'sched' && (req.status === 'pending_partner' || req.status === 'pending') && (
              <button 
                onClick={() => handleCancelRequest(req.id)} 
                className="px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg cursor-pointer"
              >
                Cancel Request
              </button>
            )}

            <button 
              onClick={(e) => copyText(e, copyData)} 
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-colors"
            >
              Copy Details
            </button>

            {canEditItem(req.createdAt) && (
              <button 
                onClick={() => {
                  let editType = 'scheduling_request';
                  if (req._cType === 'inq') editType = 'inquiry';
                  if (req._cType === 'tt_request') editType = 'tt_request';
                  if (req._cType === 'tt_complaint') editType = 'tt_complaint';
                  if (req._cType === 'comm') editType = 'client_comm';
                  setEditingItem({ type: editType, id: req.id, data: { ...req } });
                }} 
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 bg-emerald-500/10 rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit ({getRemainingEditTime(req.createdAt)})
              </button>
            )}
          </div>
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
              <option value="tt_request" className="bg-slate-800">Tabby/Tamara</option>
              <option value="tt_complaint" className="bg-slate-800">Complaints</option>
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
