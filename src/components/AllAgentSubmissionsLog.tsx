import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ClipboardList, Clock, CheckCircle2, XCircle, Copy, Phone, 
  MessageSquare, ChevronDown, ChevronUp, AlertCircle, User as UserIcon, AlertTriangle
} from 'lucide-react';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { RequestReplyThread } from './RequestReplyThread';
import { InquiryCard } from "./InquiryCard";
import { TabbyTamaraCard } from "./TabbyTamaraCard";
import { ComplaintCard } from "./ComplaintCard";
import { ClientCommCard } from "./ClientCommCard";
import { getClinicLabel,  CLINIC_OPTIONS,  formatCaseRef, formatPhoneForCopy, formatPhoneLocalForCopy, getSLAStatus, copyToClipboard, extractLinks, calculateTabbyTamaraPrice , generateInquiryCopyText, generateComplaintCopyText, generateTabbyTamaraCopyText} from "../utils";

const CopyButton = ({ text, tooltip, icon: Icon = Copy }: { text: string, tooltip: string, icon?: any }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(text, `${tooltip} copied!`);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
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

const RequestCard = ({ req, currentUser, addSystemNotification }: any) => {
  const [expanded, setExpanded] = useState(false);
  const [showReply, setShowReply] = useState(false);

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending', pending_partner: 'Awaiting Partner',
    pending_tl: 'Pending TL', not_confirmed: 'Awaiting Confirm',
    approved: 'Approved', answered: 'Answered',
    confirmed: 'Confirmed', closed: 'Closed', contacted: 'Contacted',
    rejected: 'Rejected', cancelled: 'Cancelled', declined: 'Declined',
    need_contact: 'Act: Contact Patient', in_progress: 'In Progress',
    submitted: 'Submitted', sent: 'Sent to Partner',
    tl_reviewing: 'TL Reviewing', sent_to_clinic: 'Sent to Clinic'
  };

  let title = "Request";
  let copyData = "";
  let primaryContent = null;
  let secondaryContent = null;
  let tlResponseContent = null;
  const agentName = req.agentName || req.callCenterAgentName || "Unknown Agent";

  if (req._cType === 'sched') {
    title = req.type === 'swap' ? 'Shift Swap Request' : 'Annual Leave Request';
    copyData = [
      req.type === 'swap' ? '🔄 Shift Swap Request' : '🏖️ Annual Leave Request',
      `👤 Agent: ${agentName}`,
      req.type === 'swap'
        ? `📅 Swap Date: ${req.date} | 🤝 With: ${req.swapWithAgent} | 🕐 Their Shift: ${req.swapWithShift}`
        : `📅 Leave: ${req.startDate} to ${req.endDate}`,
      req.notes ? `📝 Notes: ${req.notes}` : '',
      (req.links || []).length > 0 ? `🔗 Links: ${(req.links || []).join(', ')}` : '',
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {req.type === 'swap' ? (
          <>
            <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Swap Date</p><p className="text-xs text-slate-200 mt-0.5">{req.date}</p></div>
            {req.swapWithAgent && <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">With Agent</p><p className="text-xs text-slate-200 mt-0.5">{req.swapWithAgent} ({req.swapWithShift})</p></div>}
          </>
        ) : (
          <>
            <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">Start Date</p><p className="text-xs text-slate-200 mt-0.5">{req.startDate}</p></div>
            <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">End Date</p><p className="text-xs text-slate-200 mt-0.5">{req.endDate}</p></div>
          </>
        )}
      </div>
    );
    if (req.notes) {
      secondaryContent = <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📝 Notes</p><p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap break-words italic pl-2 border-l-2 border-white/8">{req.notes}</p></div>;
    }
  } else if (req._cType === 'inq') {
    title = 'Clinic Inquiry';
    copyData = [
      '❓ Clinic Inquiry',
      `👤 Agent: ${agentName}`,
      `🏥 Clinic: ${getClinicLabel(req.clinicName)}`,
      `📞 Phone: ${formatPhoneForCopy(req.phoneNumber || '')}`,
      `💬 Inquiry: ${req.text}`,
      req.answer ? `✅ Answer: ${req.answer}` : '',
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-transparent flex items-center gap-1.5">
            ❓ Clinic Inquiry
          </span>
          {req.answer && (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-transparent border border-white/12 text-white text-emerald-400 border border-transparent flex items-center gap-1.5">
              💬 Answered
            </span>
          )}
        </div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">🏥 Clinic</p><p className="text-xs text-slate-200 mt-0.5">{getClinicLabel(req.clinicName)}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📞 Phone</p><p className="text-xs text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">💬 Inquiry</p><p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.text}</p></div>
        {req.answer && (
          <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">✅ Answer</p><p className="text-xs text-emerald-200 mt-0.5 whitespace-pre-wrap break-words">{req.answer}</p></div>
        )}
      </div>
    );
  } else if (req._cType === 'tt_request') {
    title = 'Tabby/Tamara Request';
    const pricing = calculateTabbyTamaraPrice(req.priceWithoutTax || 0);
    copyData = [
      `💳 ${req.platform === 'tabby' ? 'Tabby' : req.platform === 'tamara' ? 'Tamara' : 'Tabby/Tamara'} Request`,
      `👤 Agent: ${agentName}`,
      `👤 Patient: ${req.patientName} | 📁 File: ${req.fileNumber || 'N/A'}`,
      `📞 Phone: ${formatPhoneForCopy(req.phoneNumber || '')}`,
      `🏥 Clinic: ${getClinicLabel(req.clinicName)}`,
      `💰 Amount: ${pricing.finalPriceFormatted}`,
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1"><UserIcon className="w-3 h-3 text-slate-500" /> Patient</p><p className="text-xs text-slate-200 mt-0.5">{req.patientName || 'N/A'} <span className="text-slate-400 text-[11px]">({req.platform})</span></p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📞 Phone</p><p className="text-xs text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">🏥 Clinic</p><p className="text-xs text-slate-200 mt-0.5">{getClinicLabel(req.clinicName)}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">💰 Amount</p><p className="text-xs text-slate-200 mt-0.5 font-mono">{pricing.finalPriceFormatted} <span className="text-[11px] text-slate-500">({pricing.priceBeforeFeeFormatted} + 5%)</span></p></div>
      </div>
    );
    if (req.notes) {
      secondaryContent = <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📝 Notes</p><p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap break-words italic pl-2 border-l-2 border-white/8">{req.notes}</p></div>;
    }
  } else if (req._cType === 'tt_complaint') {
    title = 'Complaint';
    copyData = [
      '⚠️ Complaint',
      `👤 Agent: ${agentName}`,
      `👤 Patient: ${req.patientName} | 📁 File: ${req.fileNumber || 'N/A'}`,
      `📞 Phone: ${formatPhoneForCopy(req.phoneNumber || '')}`,
      `🏥 Clinic: ${getClinicLabel(req.clinicName)}`,
      `📝 Complaint: ${req.complaintDetails}`,
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1"><UserIcon className="w-3 h-3 text-slate-500" /> Patient</p><p className="text-xs text-slate-200 mt-0.5">{req.patientName || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📞 Phone</p><p className="text-xs text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">🏥 Clinic</p><p className="text-xs text-slate-200 mt-0.5">{getClinicLabel(req.clinicName)}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-slate-500" /> Complaint</p><p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.complaintDetails}</p></div>
      </div>
    );
    if (req.tlComment) {
      tlResponseContent = <div><p className="text-[11px] uppercase text-amber-500 font-semibold tracking-wider">TL Comment</p><p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.tlComment}</p></div>;
    }
  } else if (req._cType === 'comm') {
    title = 'Client Communication';
    copyData = [
      '💬 Client Communication',
      `👤 Agent: ${agentName}`,
      `👤 Patient: ${req.patientName || 'N/A'}`,
      `📞 Phone: ${formatPhoneForCopy(req.phoneNumber || '')}`,
      `🏥 Clinic: ${getClinicLabel(req.clinicName)}`,
      `🌐 Language: ${req.language || 'N/A'}`,
      `📝 Notes: ${req.notes || 'N/A'}`,
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1"><UserIcon className="w-3 h-3 text-slate-500" /> Patient</p><p className="text-xs text-slate-200 mt-0.5">{req.patientName || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📞 Phone</p><p className="text-xs text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">🏥 Clinic</p><p className="text-xs text-slate-200 mt-0.5">{getClinicLabel(req.clinicName)}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📝 Notes</p><p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.notes || 'No notes yet'}</p></div>
      </div>
    );
    if (req.handlingNotes) {
      tlResponseContent = <div><p className="text-[11px] uppercase text-sky-500 font-semibold tracking-wider">TL Handling Notes</p><p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.handlingNotes}</p></div>;
    }
  }

  const resolvedStatuses = ['approved', 'answered', 'confirmed', 'closed', 'contacted', 'rejected', 'declined', 'cancelled'];
  const sla = getSLAStatus(req.createdAt, req.status, resolvedStatuses);
  
  let statusClass = "bg-slate-800 text-slate-300 border-white/8";
  let statusIcon = <Clock className="w-3.5 h-3.5" />;
  if (['pending_partner', 'pending', 'pending_tl', 'not_confirmed', 'submitted', 'sent'].includes(req.status)) {
    statusClass = "bg-amber-500/10 text-amber-400 border-transparent";
    statusIcon = <Clock className="w-3.5 h-3.5" />;
  } else if (['approved', 'answered', 'confirmed', 'closed', 'contacted', 'in_progress'].includes(req.status)) {
    statusClass = "bg-emerald-500/10 text-emerald-400 border-transparent";
    statusIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
  } else if (['rejected', 'cancelled', 'declined'].includes(req.status)) {
    statusClass = "bg-rose-500/10 text-rose-400 border-transparent";
    statusIcon = <XCircle className="w-3.5 h-3.5" />;
  } else if (req.status === 'need_contact') {
    statusClass = "bg-blue-500/10 text-blue-400 border-transparent";
    statusIcon = <AlertCircle className="w-3.5 h-3.5" />;
  }

  const collectionMap: Record<string, string> = {
    sched: 'scheduling_requests', inq: 'inquiries', tt_request: 'tt_requests',
    tt_complaint: 'tt_complaints', comm: 'client_comms'
  };

  const allLinks = [];
  if (req.links && Array.isArray(req.links)) {
    allLinks.push(...req.links);
  } else if (typeof req.links === 'string') {
    allLinks.push(req.links);
  }
  if (req.paymentLink) {
    allLinks.push(req.paymentLink);
  }
  const extractedLinks = extractLinks(allLinks);

  const hasAttachments = (req.photos && req.photos.length > 0) || (extractedLinks && extractedLinks.length > 0) || req.screenshot || req.imageUrl || req.paymentScreenshot || (req.attachments && req.attachments.length > 0) || (req.tlPhotos && req.tlPhotos.length > 0) || req.tlLinks;
  const handlerLabel = req.tlName || req.actionBy || req.handledBy;

  return (
    <div id={`request-${req.id}`} className="flex flex-col bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden transition-all hover:border-white/15">
      
      {/* Header */}
      <div className="p-4 border-b border-white/8 bg-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold uppercase tracking-wider ${statusClass}`}>
            {statusIcon}
            <span>{STATUS_LABELS[req.status] || req.status?.replace(/_/g, ' ')}</span>
          </div>
          <div className="text-[15px] font-semibold text-slate-100 flex items-center gap-2">
            {title}
            <span className="text-xs text-slate-500 font-sans px-2 py-0.5 bg-transparent rounded">
              {formatCaseRef(req.id, req._cType, req.createdAt, req.caseRef)}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 opacity-70" />
            {new Date(req.createdAt).toLocaleString()}
          </div>
          <div className={`px-2 py-0.5 rounded text-[11px] font-mono border ${sla.color}`}>
            {sla.label}
          </div>
        </div>
      </div>

      {/* Prominent Agent Identification Bar */}
      <div className="px-4 py-2 bg-transparent border border-white/12 text-white border-b border-white/8 flex items-center gap-2">
        <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[11px] font-semibold text-indigo-300">Agent:</span>
        <span className="text-[11px] font-bold text-slate-200">{agentName}</span>
      </div>

      {/* Body */}
      <div className="p-4">
        {primaryContent}
        
        {(expanded || secondaryContent || tlResponseContent || hasAttachments) && (
          <div className="mt-4 pt-4 border-t border-white/8 space-y-4">
            {secondaryContent}
            {tlResponseContent && (
              <div className="bg-slate-800/50 rounded-xl p-3 border border-white/8">
                 {tlResponseContent}
              </div>
            )}
            {hasAttachments && (
               <div>
                  <p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider mb-2">Attachments & Links</p>
                  <AttachmentsDisplay 
                     photos={[...(req.photos || []), ...(req.screenshot ? [req.screenshot] : []), ...(req.imageUrl ? [req.imageUrl] : []), ...(req.paymentScreenshot ? [req.paymentScreenshot] : [])]} 
                     attachments={(req as any).attachments}
                     links={extractedLinks} 
                     tlPhotos={req.tlPhotos}
                     tlLinks={req.tlLinks}
                     showSideBadges={true}
                  />
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
      <div className="flex items-center justify-between px-3 py-2 bg-transparent border-t border-white/8 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <CopyButton text={copyData} tooltip="Copy Full Request" icon={ClipboardList} />
          {req.phoneNumber && (
            <CopyButton 
              text={formatPhoneLocalForCopy(req.phoneNumber)} 
              tooltip={`Copy Phone (${formatPhoneLocalForCopy(req.phoneNumber)})`} 
              icon={Phone} 
            />
          )}
          {(req._cType === 'tt_request' || req._cType === 'tt_complaint' || req._cType === 'comm') && req.patientName && (
            <CopyButton text={req.patientName} tooltip="Copy Patient Name" icon={UserIcon} />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {collectionMap[req._cType] && (
            <button 
              onClick={() => setShowReply(!showReply)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors text-xs font-semibold cursor-pointer ${showReply ? 'bg-indigo-500/10 text-indigo-300' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reply / Conversation</span>
            </button>
          )}

          <button 
            onClick={() => setExpanded(!expanded)} 
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
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
        <div className="bg-white/[0.02] border-t border-white/8 px-4 pb-4 pt-2">
          <RequestReplyThread 
            request={req} 
            currentUser={currentUser} 
            collectionName={collectionMap[req._cType]} 
            addSystemNotification={addSystemNotification}
            requestType={req._cType === 'sched' ? 'Scheduling' : req._cType === 'inq' ? 'Inquiry' : req._cType === 'tt_request' ? 'TT/Tamara' : req._cType === 'tt_complaint' ? 'Complaint' : 'Client Comm'}
            requestAgentName={agentName}
          />
        </div>
      )}

    </div>
  );
};


export const AllAgentSubmissionsLog = ({ 
  currentUser, 
  requests, 
  inquiries, 
  tabbyTamaraRequests, 
  complaints, 
  clientComms,
  addSystemNotification
}: any) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterClinics, setFilterClinics] = useState<string[]>([]);
  const [filterPhone, setFilterPhone] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc'|'date_asc'|'status'>('date_desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isTLOreSupport = currentUser?.role === 'tl' || currentUser?.role === 'qa' || currentUser?.role === 'support' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'super_admin';

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  
  const allRequests = useMemo(() => {
    const res: any[] = [];
    
    requests.forEach((r: any) => res.push({...r, _cType: 'sched'}));
    inquiries.forEach((r: any) => res.push({...r, _cType: 'inq'}));
    tabbyTamaraRequests.forEach((r: any) => res.push({...r, _cType: 'tt_request'}));
    complaints.forEach((r: any) => res.push({...r, _cType: 'tt_complaint'}));
    clientComms.forEach((r: any) => res.push({...r, _cType: 'comm'}));
    
    return res.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, inquiries, tabbyTamaraRequests, complaints, clientComms]);

  const agentsList = useMemo(() => {
    const namesSet = new Set<string>();
    allRequests.forEach(r => {
      const name = r.agentName || r.callCenterAgentName;
      if (name) {
        namesSet.add(name.trim());
      }
    });
    return Array.from(namesSet).sort();
  }, [allRequests]);

  const pendingCount = useMemo(() => {
    return allRequests.filter(r => ['pending','pending_partner','submitted','not_confirmed','pending_tl'].includes(r.status)).length;
  }, [allRequests]);

  const resolvedCount = useMemo(() => {
    return allRequests.filter(r => ['approved','answered','confirmed','closed','contacted'].includes(r.status)).length;
  }, [allRequests]);

  const isNoFiltersActive = !filterDate && filterClinics.length === 0 && !filterPhone && search === '' && filterType === 'all' && filterAgent === 'all';

  const filtered = allRequests.filter(r => {
    const s = search.toLowerCase();
    const agentName = r.agentName || r.callCenterAgentName || "Unknown Agent";
    
    const matchesSearch = !s || 
      (r.id && r.id.toLowerCase().includes(s)) ||
      (agentName && agentName.toLowerCase().includes(s)) ||
      (r.patientName && r.patientName.toLowerCase().includes(s)) ||
      (r.text && r.text.toLowerCase().includes(s)) ||
      (r.complaintDetails && r.complaintDetails.toLowerCase().includes(s)) ||
      (r.notes && r.notes.toLowerCase().includes(s));
      
    if (!matchesSearch) return false;
    if (filterType !== 'all' && r._cType !== filterType) return false;

    if (filterAgent !== 'all' && agentName.toLowerCase() !== filterAgent.toLowerCase()) {
      return false;
    }

    if (isNoFiltersActive) {
      return ['pending', 'pending_partner', 'pending_tl', 'not_confirmed', 'need_contact', 'in_progress', 'submitted', 'sent', 'tl_reviewing', 'sent_to_clinic'].includes(r.status);
    }

    const matchesDate = !filterDate || (r.createdAt && r.createdAt.startsWith(filterDate));
    const matchesClinic = filterClinics.length === 0 || (r.clinicName && filterClinics.includes(r.clinicName));
    const matchesPhone = !filterPhone || (r.phoneNumber || '').replace(/\D/g, '').includes(filterPhone.replace(/\D/g, ''));

    return matchesDate && matchesClinic && matchesPhone;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 font-sans text-left">
          Agent Submissions Log (Management)
        </h2>
        <p className="text-slate-400 text-xs text-left mt-1">
          Monitor all agents' submission statuses, inquiries, and custom action requests in real-time.
        </p>
      </div>

      {/* 4-Stat Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.04] border border-white/8 p-4 rounded-xl flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-100">{allRequests.length}</span>
          <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mt-1">Total Lifetime</span>
        </div>
        <div className="bg-white/[0.04] border border-indigo-800 p-4 rounded-xl flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-indigo-400">{filtered.length}</span>
          <span className="text-[11px] text-indigo-500/70 uppercase tracking-widest font-bold mt-1">Matched Filtered</span>
        </div>
        <div className="bg-white/[0.04] border border-amber-900/40 p-4 rounded-xl flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-amber-400">
            {filtered.filter(r => ['pending','pending_partner','submitted','not_confirmed','pending_tl'].includes(r.status)).length}
          </span>
          <span className="text-[11px] text-amber-500/70 uppercase tracking-widest font-bold mt-1">Pending Filtered</span>
        </div>
        <div className="bg-white/[0.04] border border-emerald-900/40 p-4 rounded-xl flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-emerald-400">
            {filtered.filter(r => ['approved','answered','confirmed','closed','contacted'].includes(r.status)).length}
          </span>
          <span className="text-[11px] text-emerald-500/70 uppercase tracking-widest font-bold mt-1">Resolved Filtered</span>
        </div>
      </div>

      <div className="bg-slate-950 border border-white/8 rounded-xl p-5 space-y-4">
        <div className='flex justify-between items-center flex-wrap gap-2 mb-4 pb-4 border-b border-white/8'>
          <div className="flex gap-2 flex-wrap">
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-white/8 rounded-xl text-[11px] uppercase tracking-wider font-bold text-slate-300'>
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{allRequests.length} Total</span>
            </div>
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-transparent rounded-xl text-[11px] uppercase tracking-wider font-bold text-amber-400'>
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingCount} Pending</span>
            </div>
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-transparent rounded-xl text-[11px] uppercase tracking-wider font-bold text-emerald-400'>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{resolvedCount} Resolved</span>
            </div>
          </div>
          <div className="text-xs font-medium text-slate-400">
            Showing {sorted.length} of {allRequests.length} total
          </div>
        </div>

        {isNoFiltersActive && (
          <div className="bg-amber-500/10 border border-transparent text-amber-500 px-4 py-2 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Showing all pending requests. Use filters to view history.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 pb-4 border-b border-white/8">
          <div className="relative w-full xl:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search ID, Agent, Patient..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 bg-slate-900/60 border border-white/8/40 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-sans" />
          </div>
          
          {/* New Filters Start */}
          <input 
            type="date" 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)} 
            className="w-full bg-white/[0.03] border border-white/8/40 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 [color-scheme:dark]" 
          />
          <div className="relative">
            <select 
              value="" 
              onChange={(e) => {
                const val = e.target.value;
                if (val && !filterClinics.includes(val)) {
                  setFilterClinics([...filterClinics, val]);
                }
              }} 
              className="w-full bg-white/[0.03] border border-white/8/40 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">➕ Add Clinic to Filter...</option>
              {CLINIC_OPTIONS.filter(c => !filterClinics.includes(c.value)).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {filterClinics.length > 0 && (
              <div className="absolute top-full left-0 z-50 mt-1 flex flex-wrap gap-1 bg-slate-800 p-2 rounded-xl border border-white/8 w-64">
                <span className="w-full text-[11px] text-slate-400 font-bold mb-1 flex justify-between">
                  Selected Clinics:
                  <button onClick={() => setFilterClinics([])} className="text-rose-400 hover:text-rose-300">Clear</button>
                </span>
                {filterClinics.map(c => {
                  const label = CLINIC_OPTIONS.find(opt => opt.value === c)?.label || c;
                  return (
                    <span key={c} className="bg-transparent border border-white/12 text-white text-indigo-300 border-none px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1">
                      {label}
                      <button onClick={() => setFilterClinics(prev => prev.filter(x => x !== c))} className="hover:text-white cursor-pointer">&times;</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <input 
            type="text" 
            placeholder="Search by phone..." 
            value={filterPhone} 
            onChange={(e) => setFilterPhone(e.target.value)} 
            className="w-full bg-white/[0.03] border border-white/8/40 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-slate-500" 
          />
          {/* New Filters End */}

          <div className="flex gap-2 w-full xl:col-span-2 items-center flex-wrap lg:justify-end">
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="bg-slate-900/60 border border-white/8/40 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="all">All Agents</option>
              {agentsList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-900/60 border border-white/8/40 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="all">All Types</option>
              <option value="sched">Leaves/Swaps</option>
              <option value="inq">Inquiries</option>
              <option value="tt_request">Tabby/Tamara</option>
              <option value="tt_complaint">Complaints</option>
              <option value="comm">Client Comms</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-900/60 border border-white/8/40 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="status">By Status</option>
            </select>
            {(!isNoFiltersActive) && (
              <button 
                onClick={() => {
                  setFilterDate('');
                  setFilterClinics([]);
                  setFilterPhone('');
                  setSearch('');
                  setFilterType('all');
                  setFilterAgent('all');
                }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 border border-white/8 rounded-xl text-xs font-bold hover:bg-slate-700 whitespace-nowrap cursor-pointer transition-colors"
                title="Clear Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <ClipboardList className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-xs">No agent submissions matched your criteria.</p>
            </div>
          ) : (
            sorted.map((req) => {
              const uniqueKey = req._cType + "-" + req.id;
              const isExpanded = expandedId === uniqueKey;
              const onToggle = () => setExpandedId(isExpanded ? null : uniqueKey);

              if (req._cType === 'sched') {
                return (
                  <RequestCard 
                    key={uniqueKey} 
                    req={req} 
                    currentUser={currentUser} 
                    addSystemNotification={addSystemNotification}
                  />
                );
              }

              if (req._cType === 'inq') {
                return (
                  <InquiryCard
                    key={uniqueKey}
                    inq={req}
                    currentUser={currentUser}
                    isExpanded={isExpanded}
                    onToggle={onToggle}
                    isTLOreSupport={isTLOreSupport}
                    isSuperAdmin={isSuperAdmin}
                    addSystemNotification={addSystemNotification}
                  />
                );
              }

              if (req._cType === 'tt_request') {
                return (
                  <TabbyTamaraCard
                    key={uniqueKey}
                    req={req}
                    currentUser={currentUser}
                    isExpanded={isExpanded}
                    onToggle={onToggle}
                    isTLOreSupport={isTLOreSupport}
                    isSuperAdmin={isSuperAdmin}
                    addSystemNotification={addSystemNotification}
                  />
                );
              }

              if (req._cType === 'tt_complaint') {
                return (
                  <ComplaintCard
                    key={uniqueKey}
                    comp={req}
                    currentUser={currentUser}
                    isExpanded={isExpanded}
                    onToggle={onToggle}
                    isTLOreSupport={isTLOreSupport}
                    isSuperAdmin={isSuperAdmin}
                    addSystemNotification={addSystemNotification}
                  />
                );
              }

              if (req._cType === 'comm') {
                return (
                  <ClientCommCard
                    key={uniqueKey}
                    comm={req}
                    currentUser={currentUser}
                    isExpanded={isExpanded}
                    onToggle={onToggle}
                    isTLOreSupport={isTLOreSupport}
                    isSuperAdmin={isSuperAdmin}
                    addSystemNotification={addSystemNotification}
                  />
                );
              }

              return null;
            })
          )}
        </div>
      </div>
    </div>
  );
};
