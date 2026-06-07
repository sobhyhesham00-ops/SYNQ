import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ClipboardList, Clock, CheckCircle2, XCircle, Pencil, Copy, Phone, 
  Link as LinkIcon, ExternalLink, Paperclip, MessageSquare, ChevronDown, ChevronUp, Trash2,
  AlertCircle
} from 'lucide-react';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { RequestReplyThread } from './RequestReplyThread';
import { formatCaseRef, normalizePhone, getSLAStatus } from '../utils';

const CopyButton = ({ text, tooltip, icon: Icon = Copy }: { text: string, tooltip: string, icon?: any }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button 
      onClick={handleCopy}
      title={tooltip}
      className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 border border-transparent cursor-pointer"
    >
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Icon className="w-3.5 h-3.5" />}
      <span className="text-[11px] hidden sm:inline">{tooltip}</span>
    </button>
  );
};

const RequestCard = ({ req, currentUser, canEditItem, getRemainingEditTime, setEditingItem, handleCancelRequest, addSystemNotification }: any) => {
  const [expanded, setExpanded] = useState(false);
  const [showReply, setShowReply] = useState(false);

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending', pending_partner: 'Awaiting Partner',
    pending_tl: 'Pending TL', not_confirmed: 'Awaiting Confirm',
    approved: 'Approved', answered: 'Answered',
    confirmed: 'Confirmed', closed: 'Closed', contacted: 'Contacted',
    rejected: 'Rejected', cancelled: 'Cancelled', declined: 'Declined',
    need_contact: 'Act: Contact Patient', in_progress: 'In Progress',
    submitted: 'Submitted', sent: 'Sent to Partner'
  };

  let title = "Request";
  let copyData = "";
  let primaryContent = null;
  let secondaryContent = null;
  let tlResponseContent = null;

  if (req._cType === 'sched') {
    title = req.type === 'swap' ? 'Shift Swap Request' : 'Annual Leave Request';
    copyData = [
      title,
      `Ref: ${formatCaseRef(req.id, 'sched')}`,
      `Date: ${new Date(req.createdAt).toLocaleString()}`,
      `Status: ${STATUS_LABELS[req.status] || req.status}`,
      req.type === 'swap'
        ? `Swap Date: ${req.date} | With: ${req.swapWithAgent} | Their Shift: ${req.swapWithShift}`
        : `Leave: ${req.startDate} to ${req.endDate}`,
      req.notes ? `Notes: ${req.notes}` : '',
      (req.links || []).length > 0 ? `Links: ${(req.links || []).join(', ')}` : '',
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {req.type === 'swap' ? (
          <>
            <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Swap Date</p><p className="text-[13px] text-slate-200 mt-0.5">{req.date}</p></div>
            {req.swapWithAgent && <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">With Agent</p><p className="text-[13px] text-slate-200 mt-0.5">{req.swapWithAgent} ({req.swapWithShift})</p></div>}
          </>
        ) : (
          <>
            <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Start Date</p><p className="text-[13px] text-slate-200 mt-0.5">{req.startDate}</p></div>
            <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">End Date</p><p className="text-[13px] text-slate-200 mt-0.5">{req.endDate}</p></div>
          </>
        )}
      </div>
    );
    if (req.notes) {
      secondaryContent = <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Notes</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words italic pl-2 border-l-2 border-white/10">{req.notes}</p></div>;
    }
  } else if (req._cType === 'inq') {
    title = 'QA Inquiry';
    copyData = [
      title,
      `Ref: ${formatCaseRef(req.id, 'inq')}`,
      `Clinic: ${req.clinicName}`,
      `Phone: ${normalizePhone(req.phoneNumber || '')}`,
      `Inquiry: ${req.text}`,
      `Status: ${STATUS_LABELS[req.status] || req.status}`,
      req.answer ? `Answer: ${req.answer}` : '',
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Clinic</p><p className="text-[13px] text-slate-200 mt-0.5">{req.clinicName || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Phone</p><p className="text-[13px] text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Inquiry</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.text}</p></div>
      </div>
    );
    if (req.answer) {
      tlResponseContent = <div><p className="text-[11px] uppercase text-emerald-500 font-semibold tracking-wider">Answered</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.answer}</p></div>;
    }
  } else if (req._cType === 'tt_request') {
    title = 'Tabby/Tamara Request';
    copyData = [
      title,
      `Ref: ${formatCaseRef(req.id, 'tt_request')}`,
      `Patient: ${req.patientName} | File: ${req.fileNumber || 'N/A'}`,
      `Phone: ${normalizePhone(req.phoneNumber || '')}`,
      `Clinic: ${req.clinicName}`,
      `Platform: ${req.platform?.toUpperCase()}`,
      `Amount: AED ${req.priceWithoutTax || 'N/A'}`,
      `Status: ${STATUS_LABELS[req.status] || req.status}`,
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Patient</p><p className="text-[13px] text-slate-200 mt-0.5">{req.patientName || 'N/A'} <span className="text-slate-400 text-[11px]">({req.platform})</span></p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Phone</p><p className="text-[13px] text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Clinic</p><p className="text-[13px] text-slate-200 mt-0.5">{req.clinicName || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Amount</p><p className="text-[13px] text-slate-200 mt-0.5">AED {req.priceWithoutTax || 'N/A'}</p></div>
      </div>
    );
    if (req.notes) {
      secondaryContent = <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Notes</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words italic pl-2 border-l-2 border-white/10">{req.notes}</p></div>;
    }
  } else if (req._cType === 'tt_complaint') {
    title = 'Complaint';
    copyData = [
      title,
      `Ref: ${formatCaseRef(req.id, 'tt_complaint')}`,
      `Patient: ${req.patientName} | File: ${req.fileNumber || 'N/A'}`,
      `Phone: ${normalizePhone(req.phoneNumber || '')}`,
      `Clinic: ${req.clinicName}`,
      `Complaint: ${req.complaintDetails}`,
      `Status: ${STATUS_LABELS[req.status] || req.status}`,
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Patient</p><p className="text-[13px] text-slate-200 mt-0.5">{req.patientName || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Phone</p><p className="text-[13px] text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Clinic</p><p className="text-[13px] text-slate-200 mt-0.5">{req.clinicName || 'N/A'}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Complaint</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.complaintDetails}</p></div>
      </div>
    );
    if (req.tlComment) {
      tlResponseContent = <div><p className="text-[11px] uppercase text-amber-500 font-semibold tracking-wider">TL Comment</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.tlComment}</p></div>;
    }
  } else if (req._cType === 'comm') {
    title = 'Client Communication';
    copyData = [
      title,
      `Ref: ${formatCaseRef(req.id, 'comm')}`,
      `Patient: ${req.patientName || 'N/A'}`,
      `Phone: ${normalizePhone(req.phoneNumber || '')}`,
      `Clinic: ${req.clinicName}`,
      `Language: ${req.language || 'N/A'}`,
      `Notes: ${req.notes || 'N/A'}`,
      `Status: ${STATUS_LABELS[req.status] || req.status}`,
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Patient</p><p className="text-[13px] text-slate-200 mt-0.5">{req.patientName || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Phone</p><p className="text-[13px] text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Clinic</p><p className="text-[13px] text-slate-200 mt-0.5">{req.clinicName || 'N/A'}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Notes</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.notes || 'No notes yet'}</p></div>
      </div>
    );
    if (req.handlingNotes) {
      tlResponseContent = <div><p className="text-[11px] uppercase text-sky-500 font-semibold tracking-wider">TL Handling Notes</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.handlingNotes}</p></div>;
    }
  }

  const resolvedStatuses = ['approved', 'answered', 'confirmed', 'closed', 'contacted', 'rejected', 'declined', 'cancelled'];
  const canShowEdit = canEditItem(req.createdAt) && !resolvedStatuses.includes(req.status);
  const isCancellable = req._cType === 'sched' && (req.status === 'pending_partner' || req.status === 'pending');
  const sla = getSLAStatus(req.createdAt, req.status, resolvedStatuses);
  
  let statusClass = "bg-slate-800 text-slate-300 border-slate-700";
  let statusIcon = <Clock className="w-3.5 h-3.5" />;
  if (['pending_partner', 'pending', 'pending_tl', 'not_confirmed', 'submitted', 'sent'].includes(req.status)) {
    statusClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    statusIcon = <Clock className="w-3.5 h-3.5" />;
  } else if (['approved', 'answered', 'confirmed', 'closed', 'contacted', 'in_progress'].includes(req.status)) {
    statusClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    statusIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
  } else if (['rejected', 'cancelled', 'declined'].includes(req.status)) {
    statusClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    statusIcon = <XCircle className="w-3.5 h-3.5" />;
  } else if (req.status === 'need_contact') {
    statusClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    statusIcon = <AlertCircle className="w-3.5 h-3.5" />;
  }

  const collectionMap: Record<string, string> = {
    sched: 'scheduling_requests', inq: 'inquiries', tt_request: 'tt_requests',
    tt_complaint: 'tt_complaints', comm: 'client_comms'
  };

  const hasAttachments = (req.photos && req.photos.length > 0) || (req.links && req.links.length > 0) || req.screenshot || req.imageUrl || req.paymentScreenshot;
  const handlerLabel = req.tlName || req.actionBy || req.handledBy;

  return (
    <div className="flex flex-col bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden shadow-sm transition-all hover:border-white/20">
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold uppercase tracking-wider ${statusClass}`}>
            {statusIcon}
            <span>{STATUS_LABELS[req.status] || req.status?.replace(/_/g, ' ')}</span>
          </div>
          <div className="text-[15px] font-semibold text-slate-100 flex items-center gap-2">
            {title}
            <span className="text-[12px] text-slate-500 font-mono px-2 py-0.5 bg-black/20 rounded">
              {formatCaseRef(req.id, req._cType)}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 opacity-70" />
            {new Date(req.createdAt).toLocaleString()}
          </div>
          <div className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sla.color}`}>
            {sla.label}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {primaryContent}
        
        {(expanded || secondaryContent || tlResponseContent || hasAttachments) && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
            {secondaryContent}
            {tlResponseContent && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                 {tlResponseContent}
              </div>
            )}
            {hasAttachments && (
               <div>
                  <p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider mb-2">Attachments & Links</p>
                  <AttachmentsDisplay photos={[...(req.photos || []), ...(req.screenshot ? [req.screenshot] : []), ...(req.imageUrl ? [req.imageUrl] : []), ...(req.paymentScreenshot ? [req.paymentScreenshot] : [])]} links={req.links} />
               </div>
            )}
            {handlerLabel && (
              <div className="pt-2 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Handled By: <span className="text-slate-300">{handlerLabel}</span> 
                {req.handledAt && <span> at {new Date(req.handledAt).toLocaleString()}</span>}
                {req.updatedAt && <span> (Updated: {new Date(req.updatedAt).toLocaleString()})</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/20 border-t border-white/10 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <CopyButton text={copyData} tooltip="Copy Full Request" icon={ClipboardList} />
          {req.phoneNumber && <CopyButton text={req.phoneNumber} tooltip="Copy Phone" icon={Phone} />}
          {(req.links || []).map((lnk: string, idx: number) => (
             <React.Fragment key={idx}>
               <CopyButton text={lnk} tooltip={`Copy Link`} icon={LinkIcon} />
               <a href={lnk} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer" title={`Open Link`}>
                 <ExternalLink className="w-3.5 h-3.5" />
               </a>
             </React.Fragment>
          ))}
        </div>
        
        <div className="flex items-center gap-1">
          {canShowEdit && (
            <>
              <button 
                onClick={() => {
                  let editType = 'scheduling_request';
                  if (req._cType === 'inq') editType = 'inquiry';
                  if (req._cType === 'tt_request') editType = 'tt_request';
                  if (req._cType === 'tt_complaint') editType = 'tt_complaint';
                  if (req._cType === 'comm') editType = 'client_comm';
                  setEditingItem({ type: editType, id: req.id, data: { ...req } });
                }} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[12px] font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Edit ({getRemainingEditTime(req.createdAt)})</span>
                <span className="sm:hidden">Edit</span>
              </button>
              <button 
                onClick={() => {
                  let editType = 'scheduling_request';
                  if (req._cType === 'inq') editType = 'inquiry';
                  if (req._cType === 'tt_request') editType = 'tt_request';
                  if (req._cType === 'tt_complaint') editType = 'tt_complaint';
                  if (req._cType === 'comm') editType = 'client_comm';
                  setEditingItem({ type: editType, id: req.id, data: { ...req } });
                }} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[12px] font-semibold text-slate-300 transition-colors cursor-pointer"
                 title="Add Attachments"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Attach</span>
              </button>
            </>
          )}

          {isCancellable && (
            <button 
              onClick={() => handleCancelRequest(req.id)} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-[12px] font-semibold text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          )}

          {collectionMap[req._cType] && (
            <button 
              onClick={() => setShowReply(!showReply)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors text-[12px] font-semibold cursor-pointer ${showReply ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reply</span>
            </button>
          )}

          <button 
            onClick={() => setExpanded(!expanded)} 
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[12px] font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            {expanded ? (
               <>
                 <span className="hidden sm:inline">Collapse</span>
                 <ChevronUp className="w-4 h-4 ml-0.5" />
               </>
            ) : (
               <>
                 <span className="hidden sm:inline">Expand</span>
                 <ChevronDown className="w-4 h-4 ml-0.5" />
               </>
            )}
          </button>
        </div>
      </div>

      {/* Reply Thread Area */}
      {showReply && collectionMap[req._cType] && (
        <div className="bg-black/30 border-t border-white/5 px-4 pb-4 pt-2">
          <RequestReplyThread 
            request={req} 
            currentUser={currentUser} 
            collectionName={collectionMap[req._cType]} 
            addSystemNotification={addSystemNotification}
            requestType={req._cType === 'sched' ? 'Scheduling' : req._cType === 'inq' ? 'Inquiry' : req._cType === 'tt_request' ? 'TT/Tamara' : req._cType === 'tt_complaint' ? 'Complaint' : 'Client Comm'}
            requestAgentName={req.agentName || req.openedBy || req.callCenterAgentName || currentUser.name}
          />
        </div>
      )}

    </div>
  );
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
  handleCancelRequest,
  addSystemNotification
}: any) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc'|'date_asc'|'status'>('date_desc');

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

  const pendingCount = useMemo(() => {
    return allRequests.filter(r => ['pending','pending_partner','submitted','not_confirmed','pending_tl'].includes(r.status)).length;
  }, [allRequests]);

  const resolvedCount = useMemo(() => {
    return allRequests.filter(r => ['approved','answered','confirmed','closed','contacted'].includes(r.status)).length;
  }, [allRequests]);

  const filtered = allRequests.filter(r => {
    const s = search.toLowerCase();
    const matchesSearch = !s || 
      (r.id && r.id.toLowerCase().includes(s)) ||
      (r.phoneNumber && r.phoneNumber.toLowerCase().includes(s)) ||
      (r.patientName && r.patientName.toLowerCase().includes(s)) ||
      (r.text && r.text.toLowerCase().includes(s)) ||
      (r.complaintDetails && r.complaintDetails.toLowerCase().includes(s)) ||
      (r.notes && r.notes.toLowerCase().includes(s)) ||
      (r.clinicName && r.clinicName.toLowerCase().includes(s));
      
    if (!matchesSearch) return false;
    if (filterType !== 'all' && r._cType !== filterType) return false;

    if (filterDate) {
      const qDate = new Date(filterDate).toDateString();
      const itemDate = new Date(r.createdAt).toDateString();
      if (qDate !== itemDate) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-100 font-display text-left">All My Requests</h2>
        <p className="text-slate-400 text-[14px] text-left mt-1">Review status, details and track tickets effectively in your workspace.</p>
      </div>

      {/* 4-Stat Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg">
          <span className="text-2xl font-black text-slate-100">{allRequests.length}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Total Lifetime</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg">
          <span className="text-2xl font-black text-indigo-400">{filtered.length}</span>
          <span className="text-[10px] text-indigo-500/70 uppercase tracking-widest font-bold mt-1">Matched</span>
        </div>
        <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg">
          <span className="text-2xl font-black text-amber-400">
            {filtered.filter(r => ['pending','pending_partner','submitted','not_confirmed','pending_tl'].includes(r.status)).length}
          </span>
          <span className="text-[10px] text-amber-500/70 uppercase tracking-widest font-bold mt-1">Pending Filtered</span>
        </div>
        <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg">
          <span className="text-2xl font-black text-emerald-400">
            {filtered.filter(r => ['approved','answered','confirmed','closed','contacted'].includes(r.status)).length}
          </span>
          <span className="text-[10px] text-emerald-500/70 uppercase tracking-widest font-bold mt-1">Resolved Filtered</span>
        </div>
      </div>

      <div className="bg-slate-950 border border-white/5 rounded-2xl shadow-xl p-5 space-y-4">
        <div className='flex gap-2 flex-wrap mb-4 pb-4 border-b border-white/5'>
          <div className='flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-[11px] uppercase tracking-wider font-bold text-slate-300'>
            <ClipboardList className="w-3.5 h-3.5" />
            <span>{allRequests.length} Total</span>
          </div>
          <div className='flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[11px] uppercase tracking-wider font-bold text-amber-400'>
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCount} Pending</span>
          </div>
          <div className='flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[11px] uppercase tracking-wider font-bold text-emerald-400'>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{resolvedCount} Resolved</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
          <div className="relative flex-grow max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by ID, Name, Phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-lg text-[13px] text-white focus:outline-none focus:border-indigo-500 font-sans" />
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center flex-wrap">
            <input type="date" title="Filter by submission date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full md:w-36 px-3 py-2.5 bg-white/5 border border-white/5 rounded-lg text-[13px] text-white focus:outline-none focus:border-indigo-500 font-sans cursor-pointer [color-scheme:dark]" />
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full md:w-36 px-3 py-2.5 bg-white/5 border border-white/5 rounded-lg text-[13px] text-white focus:outline-none focus:border-indigo-500 font-sans cursor-pointer">
              <option value="date_desc" className="bg-slate-900">Newest First</option>
              <option value="date_asc" className="bg-slate-900">Oldest First</option>
              <option value="status" className="bg-slate-900">By Status</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full md:w-40 px-3 py-2.5 bg-white/5 border border-white/5 rounded-lg text-[13px] text-white focus:outline-none focus:border-indigo-500 font-sans cursor-pointer">
              <option value="all" className="bg-slate-900">All Types</option>
              <option value="sched" className="bg-slate-900">Leaves/Swaps</option>
              <option value="inq" className="bg-slate-900">Inquiries</option>
              <option value="tt_request" className="bg-slate-900">Tabby/Tamara</option>
              <option value="tt_complaint" className="bg-slate-900">Complaints</option>
              <option value="comm" className="bg-slate-900">Client Comms</option>
            </select>
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className="px-3 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[12px] font-bold hover:bg-rose-500/20 whitespace-nowrap cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <ClipboardList className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-[14px]">No requests found matching your filter.</p>
            </div>
          ) : (
            sorted.map((req) => (
              <RequestCard 
                key={req.id + req._cType} 
                req={req} 
                currentUser={currentUser} 
                canEditItem={canEditItem} 
                getRemainingEditTime={getRemainingEditTime} 
                setEditingItem={setEditingItem} 
                handleCancelRequest={handleCancelRequest} 
                addSystemNotification={addSystemNotification}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
