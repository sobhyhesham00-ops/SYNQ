import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ClipboardList, Clock, CheckCircle2, XCircle, Pencil, Copy, Phone, 
  Link as LinkIcon, ExternalLink, Paperclip, MessageSquare, ChevronDown, ChevronUp, Trash2,
  AlertCircle, User
} from 'lucide-react';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { RequestReplyThread } from './RequestReplyThread';
import { InquiryCard } from "./InquiryCard";
import { TabbyTamaraCard } from "./TabbyTamaraCard";
import { ComplaintCard } from "./ComplaintCard";
import { ClientCommCard } from "./ClientCommCard";
import { getClinicLabel,  CLINIC_OPTIONS,  formatCaseRef, normalizePhone, formatPhoneForCopy, formatPhoneLocalForCopy, getSLAStatus, copyToClipboard, extractLinks, calculateTabbyTamaraPrice , generateInquiryCopyText, generateComplaintCopyText, generateTabbyTamaraCopyText} from "../utils";

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

const RequestCard = ({ req, currentUser, canEditItem, getRemainingEditTime, editLimitMs, setEditingItem, handleCancelRequest, addSystemNotification }: any) => {
  const [expanded, setExpanded] = useState(false);
  const [showReply, setShowReply] = useState(false);

  // Compute expiry time if editLimitMs is present and not infinity
  let expiryTimeStr = '';
  if (editLimitMs && editLimitMs !== Infinity && req.createdAt) {
      const expiryDate = new Date(new Date(req.createdAt).getTime() + editLimitMs);
      expiryTimeStr = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const STATUS_LABELS: Record<string, string> = {
    pending: '⏳ Pending', pending_partner: '🤝 Awaiting Partner',
    pending_tl: '🧑💼 Pending TL', not_confirmed: '❔ Awaiting Confirm',
    approved: '✅ Approved', answered: '💬 Answered',
    confirmed: '✅ Confirmed', closed: '🔒 Closed', contacted: '📞 Contacted',
    rejected: '❌ Rejected', cancelled: '🚫 Cancelled', declined: '🚫 Declined',
    need_contact: '📲 Act: Contact Patient', in_progress: '🔄 In Progress',
    submitted: '📨 Submitted', sent: '📤 Sent to Partner',
    tl_reviewing: '👀 TL Reviewing', sent_to_clinic: '📤 Sent to Clinic',
    completed: '✅ Closed'
  };

  let title = "Request";
  let copyData = "";
  let primaryContent = null;
  let secondaryContent = null;
  let tlResponseContent = null;

  if (req._cType === 'sched') {
    title = req.type === 'swap' ? 'Shift Swap Request' : 'Annual Leave Request';
    copyData = [
      req.type === 'swap' ? '🔄 Shift Swap Request' : '🏖️ Annual Leave Request',
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
      secondaryContent = <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📝 Notes</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words italic pl-2 border-l-2 border-white/10">{req.notes}</p></div>;
    }
  } else if (req._cType === 'inq') {
    title = 'Clinic Inquiry';
    copyData = [
      '❓ Clinic Inquiry',
      `👤 Patient Name: ${req.patientName || 'N/A'}`,
      `📞 Phone: ${formatPhoneForCopy(req.phoneNumber || '')}`,
      req.platform ? `🌐 Platform: ${req.platform}` : '',
      req.customerType ? `🏷️ Customer Status: ${req.customerType === 'new' ? 'New Customer' : 'Old Customer'}` : '',
      req.fileNumber ? `📁 File/ID: ${req.fileNumber}` : '',
      `🏥 Clinic: ${getClinicLabel(req.clinicName)}`,
      `💬 Inquiry: ${req.text}`,
      req.answer ? `✅ Answer: ${req.answer}` : '',
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
            ❓ Clinic Inquiry
          </span>
          {req.platform && (
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-slate-500/10 text-slate-300 border border-slate-500/20 flex items-center gap-1.5">
              🌐 {req.platform}
            </span>
          )}
          {req.customerType && (
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${
              req.customerType === 'new' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}>
              {req.customerType === 'new' ? '🆕 New Customer' : '📂 Old Customer'}
            </span>
          )}
          {req.answer && (
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              💬 Answered
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
          <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">👤 Patient Name</p><p className="text-[13px] text-slate-200 mt-0.5 font-bold">{req.patientName || 'N/A'}</p></div>
          <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📞 Phone</p><p className="text-[13px] text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
          <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">🏥 Clinic</p><p className="text-[13px] text-slate-200 mt-0.5">{getClinicLabel(req.clinicName)}</p></div>
          {req.fileNumber ? (
            <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📁 File Number</p><p className="text-[13px] text-amber-300 mt-0.5 font-mono font-bold">{req.fileNumber}</p></div>
          ) : (
            <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📂 Customer Type</p><p className="text-[13px] text-slate-300 mt-0.5">New Customer (No File)</p></div>
          )}
        </div>
        <div>
          <p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">💬 Inquiry Description</p>
          <p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words bg-black/10 p-2.5 rounded-lg border border-white/5">{req.text}</p>
        </div>
        {req.answer && (
          <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
            <p className="text-[11px] uppercase text-emerald-500 font-semibold tracking-wider">✅ Answer / Resolution</p>
            <p className="text-[13px] text-emerald-200 mt-0.5 whitespace-pre-wrap break-words">{req.answer}</p>
          </div>
        )}
      </div>
    );
  } else if (req._cType === 'tt_request') {
    title = 'Tabby/Tamara Request';
    const pricing = calculateTabbyTamaraPrice(req.priceWithoutTax || 0);
    copyData = [
      `💳 ${req.platform === 'tabby' ? 'Tabby' : req.platform === 'tamara' ? 'Tamara' : 'Tabby/Tamara'} Request`,
      `👤 Patient: ${req.patientName} | 📁 File: ${req.fileNumber || 'N/A'}`,
      `📞 Phone: ${formatPhoneForCopy(req.phoneNumber || '')}`,
      `🏥 Clinic: ${getClinicLabel(req.clinicName)}`,
      `💰 Amount: ${pricing.finalPriceFormatted}`,
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">👤 Patient</p><p className="text-[13px] text-slate-200 mt-0.5">{req.patientName || 'N/A'} <span className="text-slate-400 text-[11px]">({req.platform})</span></p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📞 Phone</p><p className="text-[13px] text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">🏥 Clinic</p><p className="text-[13px] text-slate-200 mt-0.5">{getClinicLabel(req.clinicName)}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">💰 Amount</p><p className="text-[13px] text-slate-200 mt-0.5 font-mono">{pricing.finalPriceFormatted} <span className="text-[10px] text-slate-500">({pricing.priceBeforeFeeFormatted} + 5%)</span></p></div>
      </div>
    );
    if (req.notes) {
      secondaryContent = <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📝 Notes</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words italic pl-2 border-l-2 border-white/10">{req.notes}</p></div>;
    }
  } else if (req._cType === 'tt_complaint') {
    title = 'Complaint';
    copyData = [
      '⚠️ Complaint',
      `👤 Patient: ${req.patientName} | 📁 File: ${req.fileNumber || 'N/A'}`,
      `📞 Phone: ${formatPhoneForCopy(req.phoneNumber || '')}`,
      `🏥 Clinic: ${getClinicLabel(req.clinicName)}`,
      `📝 Complaint: ${req.complaintDetails}`,
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">👤 Patient</p><p className="text-[13px] text-slate-200 mt-0.5">{req.patientName || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📞 Phone</p><p className="text-[13px] text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">🏥 Clinic</p><p className="text-[13px] text-slate-200 mt-0.5">{getClinicLabel(req.clinicName)}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">⚠️ Complaint</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.complaintDetails}</p></div>
      </div>
    );
    if (req.tlComment) {
      tlResponseContent = <div><p className="text-[11px] uppercase text-amber-500 font-semibold tracking-wider">TL Comment</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.tlComment}</p></div>;
    }
  } else if (req._cType === 'comm') {
    title = 'Client Communication';
    copyData = [
      '💬 Client Communication',
      `👤 Patient: ${req.patientName || 'N/A'}`,
      `📞 Phone: ${formatPhoneForCopy(req.phoneNumber || '')}`,
      `🏥 Clinic: ${getClinicLabel(req.clinicName)}`,
      `🌐 Language: ${req.language || 'N/A'}`,
      `📝 Notes: ${req.notes || 'N/A'}`,
    ].filter(Boolean).join('\n');

    primaryContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">👤 Patient</p><p className="text-[13px] text-slate-200 mt-0.5">{req.patientName || 'N/A'}</p></div>
        <div><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📞 Phone</p><p className="text-[13px] text-slate-200 mt-0.5 font-mono">{req.phoneNumber || 'N/A'}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">🏥 Clinic</p><p className="text-[13px] text-slate-200 mt-0.5">{getClinicLabel(req.clinicName)}</p></div>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider">📝 Notes</p><p className="text-[13px] text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{req.notes || 'No notes yet'}</p></div>
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
    <div id={`request-${req.id}`} className="flex flex-col bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden shadow-sm transition-all hover:border-white/20">
      
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
              {formatCaseRef(req.id, req._cType, req.createdAt, req.caseRef)}
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
      <div className="flex items-center justify-between px-3 py-2 bg-black/20 border-t border-white/10 gap-2 flex-wrap">
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
            <CopyButton text={req.patientName} tooltip="Copy Patient Name" icon={User} />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {canShowEdit ? (
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
          ) : (!resolvedStatuses.includes(req.status) && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/5 border border-rose-500/10 rounded-lg">
              <span className="text-[10px] text-rose-400/80 font-mono tracking-wider uppercase font-semibold flex items-center gap-1">
                 <Clock className="w-3 h-3" />
                 Editing period expired {expiryTimeStr && `at ${expiryTimeStr}`}
              </span>
              <span className="text-[10px] text-slate-400 border-l border-white/5 pl-2">Use</span>
              <button 
                onClick={() => document.getElementById(`reply-input-${req.id}`)?.focus()}
                className="text-[10px] text-sky-400 hover:text-sky-300 hover:underline font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                Reply / Add Update
              </button>
            </div>
          ))}

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
    if (!currentUser) return [];
    const isTlOrAdmin = currentUser.role === 'tl' || currentUser.role === 'qa' || currentUser.role === 'admin' || currentUser.role === 'super_admin' || isTLOreSupport;
    const myName = currentUser.name;
    const res: any[] = [];
    
    // An agent is actively searching if search keyword is typed or filters are placed.
    const isSearching = search.trim() !== '' || filterPhone.trim() !== '' || filterDate !== '' || filterClinics.length > 0 || filterType !== 'all';

    const myReqs = (arr: any[], nameField: string) =>
      (isTlOrAdmin || isSearching) ? arr : arr.filter(r => (r[nameField] || '').toLowerCase() === myName.toLowerCase());

    myReqs(requests, 'agentName').forEach(r => res.push({...r, _cType: 'sched'}));
    myReqs(inquiries, 'agentName').forEach(r => res.push({...r, _cType: 'inq'}));
    myReqs(tabbyTamaraRequests, 'agentName').forEach(r => res.push({...r, _cType: 'tt_request'}));
    myReqs(complaints, 'agentName').forEach(r => res.push({...r, _cType: 'tt_complaint'}));
    
    // Client comms: check both fields
    if (isTlOrAdmin || isSearching) {
      clientComms.forEach(r => res.push({...r, _cType: 'comm'}));
    } else {
      clientComms.filter(r =>
        (r.callCenterAgentName || '').toLowerCase() === myName.toLowerCase() ||
        (r.agentName || '').toLowerCase() === myName.toLowerCase()
      ).forEach(r => res.push({...r, _cType: 'comm'}));
    }
    
    return res.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, inquiries, tabbyTamaraRequests, complaints, clientComms, currentUser, isTLOreSupport, search, filterPhone, filterDate, filterClinics, filterType]);

  const pendingCount = useMemo(() => {
    return allRequests.filter(r => ['pending','pending_partner','submitted','not_confirmed','pending_tl'].includes(r.status)).length;
  }, [allRequests]);

  const resolvedCount = useMemo(() => {
    return allRequests.filter(r => ['approved','answered','confirmed','closed','contacted'].includes(r.status)).length;
  }, [allRequests]);

  const isNoFiltersActive = !filterDate && filterClinics.length === 0 && !filterPhone && search === '' && filterType === 'all';
  const todayIso = new Date().toISOString().split('T')[0];

  const filtered = allRequests.filter(r => {
    const s = search.toLowerCase();
    const matchesSearch = !s || 
      (r.id && r.id.toLowerCase().includes(s)) ||
      (r.patientName && r.patientName.toLowerCase().includes(s)) ||
      (r.text && r.text.toLowerCase().includes(s)) ||
      (r.complaintDetails && r.complaintDetails.toLowerCase().includes(s)) ||
      (r.notes && r.notes.toLowerCase().includes(s));
      
    if (!matchesSearch) return false;
    if (filterType !== 'all' && r._cType !== filterType) return false;

    if (isNoFiltersActive) {
      const isPending = ['pending', 'pending_partner', 'pending_tl', 'not_confirmed', 'need_contact', 'in_progress', 'submitted', 'sent', 'tl_reviewing', 'sent_to_clinic'].includes(r.status);
      const isToday = r.createdAt && r.createdAt.startsWith(todayIso);
      return isPending && isToday;
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
        <h2 className="text-3xl font-bold text-slate-100 font-display text-left">
          {["agent", "sme"].includes(currentUser?.role as string) ? "My Submissions Log" : "All Submissions Log"}
        </h2>
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
        <div className='flex justify-between items-center flex-wrap gap-2 mb-4 pb-4 border-b border-white/5'>
          <div className="flex gap-2 flex-wrap">
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
          <div className="text-[12px] font-medium text-slate-400">
            Showing {sorted.length} of {allRequests.length} total
          </div>
        </div>

        {isNoFiltersActive && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg text-[13px] font-medium mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Showing today's pending cases. Use filters to search history.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 pb-4 border-b border-white/5">
          <div className="relative w-full xl:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by ID, Name..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 bg-slate-900/60 border border-slate-700/40 rounded-lg text-[12px] text-white focus:outline-none focus:border-indigo-500 font-sans" />
          </div>
          
          {/* New Filters Start */}
          <input 
            type="date" 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)} 
            className="w-full bg-slate-900/60 border border-slate-700/40 rounded-lg text-[12px] text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 [color-scheme:dark]" 
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
              className="w-full bg-slate-900/60 border border-slate-700/40 rounded-lg text-[12px] text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">➕ Add Clinic to Filter...</option>
              {CLINIC_OPTIONS.filter(c => !filterClinics.includes(c.value)).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {filterClinics.length > 0 && (
              <div className="absolute top-full left-0 z-50 mt-1 flex flex-wrap gap-1 bg-slate-800 p-2 rounded-lg border border-slate-700 shadow-xl w-64">
                <span className="w-full text-xs text-slate-400 font-bold mb-1 flex justify-between">
                  Selected Clinics:
                  <button onClick={() => setFilterClinics([])} className="text-rose-400 hover:text-rose-300">Clear</button>
                </span>
                {filterClinics.map(c => {
                  const label = CLINIC_OPTIONS.find(opt => opt.value === c)?.label || c;
                  return (
                    <span key={c} className="bg-indigo-500/20 text-indigo-300 border-none px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
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
            className="w-full bg-slate-900/60 border border-slate-700/40 rounded-lg text-[12px] text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-slate-500" 
          />
          {/* New Filters End */}

          <div className="flex gap-2 w-full xl:col-span-2 items-center flex-wrap lg:justify-end">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-900/60 border border-slate-700/40 rounded-lg text-[12px] text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="all" className="bg-slate-900">All Types</option>
              <option value="sched" className="bg-slate-900">Leaves/Swaps</option>
              <option value="inq" className="bg-slate-900">Inquiries</option>
              <option value="tt_request" className="bg-slate-900">Tabby/Tamara</option>
              <option value="tt_complaint" className="bg-slate-900">Complaints</option>
              <option value="comm" className="bg-slate-900">Client Comms</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-900/60 border border-slate-700/40 rounded-lg text-[12px] text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="date_desc" className="bg-slate-900">Newest First</option>
              <option value="date_asc" className="bg-slate-900">Oldest First</option>
              <option value="status" className="bg-slate-900">By Status</option>
            </select>
            {(!isNoFiltersActive) && (
              <button 
                onClick={() => {
                  setFilterDate('');
                  setFilterClinics([]);
                  setFilterPhone('');
                  setSearch('');
                  setFilterType('all');
                }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[12px] font-bold hover:bg-slate-700 whitespace-nowrap cursor-pointer transition-colors"
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
              <p className="text-[14px]">No requests found matching your filter.</p>
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
                    canEditItem={canEditItem} 
                    getRemainingEditTime={getRemainingEditTime} 
                    setEditingItem={setEditingItem} 
                    handleCancelRequest={handleCancelRequest} 
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
                    canEditItem={canEditItem}
                    getRemainingEditTime={getRemainingEditTime}
                    setEditingItem={(editingItem: any) => setEditingItem({ type: 'inquiry', id: req.id, data: { ...req } })}
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
                    canEditItem={canEditItem}
                    getRemainingEditTime={getRemainingEditTime}
                    setEditingItem={(editingItem: any) => setEditingItem({ type: 'tt_request', id: req.id, data: { ...req } })}
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
                    canEditItem={canEditItem}
                    getRemainingEditTime={getRemainingEditTime}
                    setEditingItem={(editingItem: any) => setEditingItem({ type: 'tt_complaint', id: req.id, data: { ...req } })}
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
                    canEditItem={canEditItem}
                    getRemainingEditTime={getRemainingEditTime}
                    setEditingItem={(editingItem: any) => setEditingItem({ type: 'client_comm', id: req.id, data: { ...req } })}
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
