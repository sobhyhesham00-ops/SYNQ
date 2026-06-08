import React, { useState } from 'react';
import { 
  Copy, ExternalLink, MessageCircle, AlertCircle, Phone, CheckCircle2, 
  Hospital, Hash, User, Calendar, DollarSign, PenTool, Trash2, Pencil, 
  Check, Clock, CheckIcon, Download, LinkIcon, FileText, Share, CornerDownRight, ChevronDown, ChevronUp 
} from 'lucide-react';
import { toast } from 'sonner';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { RequestReplyThread } from './RequestReplyThread';
import { MultiAttachmentUpload } from './MultiAttachmentUpload';
import { formatCaseRef, normalizePhone, copyToClipboard, extractLinks, normalizeUrl } from '../utils';

// REUSABLE COMPONENTS

const StatusBadge = ({ status, customerContacted, className = "" }: any) => {
  if (status === "not_confirmed") {
    return (
      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5" /> Pending TL
      </span>
    );
  } else if (status === "rejected") {
    return (
      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1.5 ${className}`}>
        <Trash2 className="w-3.5 h-3.5" /> Rejected
      </span>
    );
  } else if (status === "confirmed" && customerContacted === "contacted") {
    return (
      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" /> Contacted
      </span>
    );
  } else {
    return (
      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1.5 ${className}`}>
        <Clock className="w-3.5 h-3.5" /> Contact Pending
      </span>
    );
  }
};

const ProviderGlowBadge = ({ platform, className = "" }: any) => {
  let colorClass = "from-slate-500/20 to-slate-500/5 text-slate-400 border-slate-500/20";
  let label = platform?.toUpperCase() || "N/A";
  if (platform === "tabby") {
    colorClass = "from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/20";
  } else if (platform === "tamara") {
    colorClass = "from-rose-500/20 to-rose-500/5 text-rose-500 border-rose-500/20";
  } else if (platform === "one_time_payment") {
    colorClass = "from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/20";
    label = "ONE TIME PAID";
  }

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border bg-gradient-to-r flex items-center gap-1 ${colorClass} ${className}`}>
      {label}
    </span>
  );
};

const CRMField = ({ icon: Icon, label, value, isBold, onClick, valueClass = "text-slate-300" }: any) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
      return;
    }
    const isPhone = label === 'Phone' || /^(\+971|0)\d{9}/.test(String(value));
    const copyValue = isPhone ? String(value).replace(/^0+/, '').replace(/^\+971\s?/, '') : String(value);
    const msg = isPhone ? 'Phone copied (starts from 5)' : `${label} copied!`;
    const ok = await copyToClipboard(copyValue, msg);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group text-left border border-transparent hover:border-white/5" onClick={handleCopy}>
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold tracking-widest uppercase">
        <span className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-slate-600" /> {label}</span>
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className={`text-sm break-words leading-tight ${isBold ? 'font-bold' : 'font-medium'} ${valueClass}`} title={String(value)}>
        {value}
      </div>
    </div>
  );
};

const TimelineStep = ({ completed, label, active }: { completed: boolean, label: string, active?: boolean }) => (
  <div className={`flex flex-col items-center shrink-0 w-24 sm:w-32 z-10 ${completed || active ? 'opacity-100' : 'opacity-70'}`}>
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-[#0d0d10] transition-colors ${completed ? 'border-indigo-500 bg-indigo-500/10' : active ? 'border-slate-500' : 'border-slate-800'}`}>
      {completed && <Check className="w-3.5 h-3.5 text-indigo-400" />}
    </div>
    <span className={`text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-wide text-center ${completed ? 'text-indigo-400' : active ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
  </div>
);

export const TabbyTamaraCard = ({ 
  req, 
  currentUser, 
  isTLOreSupport, 
  isSuperAdmin,
  activeFintechHandlingId, 
  setActiveFintechHandlingId,
  tlFintechPaymentLink, setTlFintechPaymentLink,
  tlFintechNotes, setTlFintechNotes,
  tlFintechLinks, setTlFintechLinks,
  handleConfirmTabbyTamara,
  handleMarkPatientContactedTT,
  getElapsedTimerString,
  handleDeleteTabbyTamara,
  canEditItem,
  getRemainingEditTime,
  editLimitMs,
  setEditingItem,
  addSystemNotification
}: any) => {
  const hasAttachments = Boolean((req.photos && req.photos.length > 0) || (req.links && req.links.length > 0) || req.paymentScreenshot);
  const [expandedNotes, setExpandedNotes] = useState(Boolean(req.notes || hasAttachments));
  
  const [isContactingMode, setIsContactingMode] = useState(false);
  const [contactNotes, setContactNotes] = useState("");
  const [contactPhotos, setContactPhotos] = useState<string[]>([]);
  const [isContactingUploading, setIsContactingUploading] = useState(false);
  
  const isPendingContact = req.status === "confirmed" && req.customerContacted === "not_contacted";
  const elapsedMins = req.confirmedAt && req.customerContacted !== 'contacted'
    ? (Date.now() - new Date(req.confirmedAt).getTime()) / 60000 : 0;
  const isOverdue = elapsedMins > 60;
  const isWarning = elapsedMins > 30 && !isOverdue;

  const getAllAttachments = () => {
    const rawPhotos = [
      ...(req.photos || []),
      ...(req.screenshot ? [req.screenshot] : []),
      ...(req.paymentScreenshot ? [req.paymentScreenshot] : []),
      ...(req.imageUrl ? [req.imageUrl] : []),
      ...(req.attachments || [])
    ];
    if (Array.isArray(req.replies)) {
      req.replies.forEach((reply: any) => {
        if (reply.photos) rawPhotos.push(...reply.photos);
        if (reply.screenshot) rawPhotos.push(reply.screenshot);
        if (reply.imageUrl) rawPhotos.push(reply.imageUrl);
        if (reply.attachments) rawPhotos.push(...reply.attachments);
      });
    }
    return Array.from(new Set(rawPhotos)).filter(Boolean);
  };

  const buildRequestText = (request: any, attachments: string[]) => {
    let photoLines = '';
    if (attachments.length > 0) {
      photoLines = `\nAttachments (${attachments.length}):\n` + attachments.map((att, idx) => {
         const isPdf = typeof att === 'string' && (att.includes('application/pdf') || att.includes('.pdf'));
         if (typeof att === 'string' && att.startsWith('http')) {
             return `- attachment-${idx + 1}${isPdf ? '.pdf' : '.jpg'}: ${att}`;
         }
         return `- attachment-${idx + 1}${isPdf ? '.pdf' : '.jpg'}`;
      }).join('\n');
    }
    const linkLines = (request.links || []).length > 0
      ? `\nLinks:\n${(request.links || []).map(normalizeUrl).join('\n')}` : '';
    const tlLinkLines = request.tlLinks 
      ? `\nTL Links:\n${extractLinks(request.tlLinks).map(normalizeUrl).join('\n')}` : '';

    const amountTax = !isNaN(Number(request.priceWithoutTax)) ? (Number(request.priceWithoutTax) * 1.05).toFixed(2) : "-";

    return [
      `[${request.platform?.toUpperCase() || 'N/A'}] Request - ${request.patientName || 'Unknown'}`,
      `Ref: ${formatCaseRef(request.id, 'tt_request')}`,
      `File: ${request.fileNumber || 'N/A'} | Phone: ${normalizePhone(request.phoneNumber)}`,
      `Clinic: ${request.clinicName || 'N/A'}`,
      `Amount w/o Tax: AED ${request.priceWithoutTax || 0}`,
      `Amount w/ Tax: AED ${amountTax}`,
      `Status: ${request.status}`,
      request.agentName ? `Agent: ${request.agentName}` : '',
      request.paymentLink ? `Payment Link: ${normalizeUrl(request.paymentLink)}` : '',
      request.notes ? `Agent Notes:\n${request.notes}` : '',
      request.tlNotes ? `TL Notes:\n${request.tlNotes}` : '',
      request.agentContactNotes ? `Contact Notes:\n${request.agentContactNotes}` : '',
      linkLines,
      tlLinkLines,
      photoLines,
    ].filter(Boolean).join('\n');
  };

  const buildRequestHtml = (request: any, attachments: string[]) => {
    let html = `<div><strong>[${request.platform?.toUpperCase() || 'N/A'}] Request - ${request.patientName || 'Unknown'}</strong><br/>`;
    html += `Ref: ${formatCaseRef(request.id, 'tt_request')}<br/>`;
    html += `File: ${request.fileNumber || 'N/A'} | Phone: ${normalizePhone(request.phoneNumber)}<br/>`;
    html += `Clinic: ${request.clinicName || 'N/A'}<br/>`;
    
    const amountTax = !isNaN(Number(request.priceWithoutTax)) ? (Number(request.priceWithoutTax) * 1.05).toFixed(2) : "-";
    html += `Amount w/o Tax: AED ${request.priceWithoutTax || 0}<br/>`;
    html += `Amount w/ Tax: AED ${amountTax}<br/>`;
    html += `Status: ${request.status}<br/>`;
    
    if (request.agentName) html += `Agent: ${request.agentName}<br/>`;
    if (request.paymentLink) html += `Payment Link: <a href="${normalizeUrl(request.paymentLink)}">${normalizeUrl(request.paymentLink)}</a><br/>`;
    if (request.notes) html += `Agent Notes:<br/>${request.notes.replace(/\n/g, '<br/>')}<br/>`;
    if (request.tlNotes) html += `TL Notes:<br/>${request.tlNotes.replace(/\n/g, '<br/>')}<br/>`;
    if (request.agentContactNotes) html += `Contact Notes:<br/>${request.agentContactNotes.replace(/\n/g, '<br/>')}<br/>`;
    
    if ((request.links || []).length > 0) {
      html += `Links:<br/>${(request.links || []).map((l: string) => `<a href="${normalizeUrl(l)}">${normalizeUrl(l)}</a>`).join('<br/>')}<br/>`;
    }
    if (request.tlLinks) {
      html += `TL Links:<br/>${extractLinks(request.tlLinks).map(l => `<a href="${normalizeUrl(l)}">${normalizeUrl(l)}</a>`).join('<br/>')}<br/>`;
    }
    
    if (attachments.length > 0) {
      html += `<br/><strong>Attachments (${attachments.length}):</strong><br/>`;
      attachments.forEach((att, idx) => {
         const isPdf = typeof att === 'string' && (att.includes('application/pdf') || att.includes('.pdf'));
         if (isPdf) {
             html += `<a href="${att}">attachment-${idx + 1}.pdf</a><br/>`;
         } else {
             html += `<img src="${att}" alt="attachment-${idx + 1}" style="max-height: 300px; max-width: 100%; margin-top: 8px; display: block;" /><br/>`;
         }
      });
    }
    html += `</div>`;
    return html;
  };

  const handleCopyTextOnly = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const uniquePhotos = getAllAttachments();
    const text = buildRequestText(req, uniquePhotos);
    const html = buildRequestHtml(req, uniquePhotos);
    const success = await copyToClipboard(text, "Request details copied successfully!", html);
    if (!success) {
      toast.error("Failed to copy request details.");
    }
  };

  const handleShareAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const uniquePhotos = getAllAttachments();
    const text = buildRequestText(req, uniquePhotos);
    
    const tempFiles: File[] = [];
    
    for (let i = 0; i < uniquePhotos.length; i++) {
        const photo = uniquePhotos[i];
        if (typeof photo === 'string' && photo.startsWith('data:')) {
            try {
                const res = await fetch(photo);
                const blob = await res.blob();
                const mimeType = blob.type;
                let ext = mimeType.split('/')[1] || 'jpeg';
                // handle simple mime type extractions or defaults
                if (mimeType.includes('pdf')) ext = 'pdf';
                const file = new File([blob], `attachment-${i + 1}.${ext}`, { type: mimeType });
                tempFiles.push(file);
            } catch (err) {
                console.error("Error converting photo", err);
            }
        }
    }

    const shareData: ShareData = {
      title: `Request ${formatCaseRef(req.id, 'tt_request')}`,
      text: text,
    };

    try {
      if (navigator.share) {
        if (tempFiles.length > 0 && navigator.canShare && navigator.canShare({ files: tempFiles })) {
           await navigator.share({ ...shareData, files: tempFiles });
           toast.success("Request details and attachments shared successfully!");
        } else {
           await navigator.share({ title: shareData.title, text: shareData.text });
           toast.success("Request details shared successfully!");
           if (tempFiles.length > 0) {
             toast.info("Request details shared. Download or share the attachments separately.");
           }
        }
      } else {
        await handleCopyTextOnly(e);
        toast.info("Request details copied. Download or share the attachments separately.");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
         toast.error("Failed to share request.");
         console.error(err);
      }
    }
  };

  const isApproved = req.status === "confirmed";
  const isRejected = req.status === "rejected";
  const isContacted = req.customerContacted === "contacted";

  let borderColor = "border-t-slate-500";
  if (req.platform === "tabby") borderColor = "border-t-amber-500";
  else if (req.platform === "tamara") borderColor = "border-t-rose-500";
  else if (req.platform === "one_time_payment") borderColor = "border-t-blue-500";

  const amountTax = !isNaN(Number(req.priceWithoutTax)) ? (Number(req.priceWithoutTax) * 1.05).toFixed(2) : "-";

  return (
    <div id={`request-${req.id}`} className={`bg-[#0d0d10] border-x border-b border-t-2 border-x-white/10 border-b-white/10 ${borderColor} rounded-2xl flex flex-col relative overflow-hidden transition-all shadow-lg max-w-full group/card`}>
      {/* SLA Accent Row */}
      {isPendingContact && (
        <div className={`h-1 w-full ${isOverdue ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'} absolute top-0 left-0`} />
      )}

      {/* HEADER STRIP */}
      <div className='flex items-center justify-between px-4 pt-3 pb-2'>
         <div className="flex items-center gap-3">
           <ProviderGlowBadge platform={req.platform} />
         </div>
         <div className="flex items-center gap-2">
           {isPendingContact && (
              <span className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20 ${isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}`}>
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> {getElapsedTimerString(req.confirmedAt || req.createdAt)}
              </span>
           )}
           <div className="font-mono text-[11px] text-slate-500 uppercase tracking-widest hidden sm:block mr-2">
             Ref: {formatCaseRef(req.id, 'tt_request')}
           </div>
           <StatusBadge status={req.status} customerContacted={req.customerContacted} />
         </div>
      </div>

      {/* BODY */}
      <div className='px-4 pb-3 border-b border-white/[0.05]'>
        <h3 
          className='text-xl md:text-2xl font-black text-white tracking-tight cursor-pointer hover:text-amber-100 transition-colors w-fit flex items-center gap-2 group/name' 
          onClick={() => copyToClipboard(req.patientName || "Unknown", "Patient name copied!")}
          title="Copy Patient Name"
        >
          {req.patientName || "Unknown"}
          <Copy className="w-4 h-4 opacity-0 group-hover/name:opacity-100 transition-opacity text-amber-100/50" />
        </h3>
        <div className='flex items-center flex-wrap gap-2 mt-1'>
          <span className='text-[10px] text-slate-400 font-mono'>File: {req.fileNumber || req.idNumber || 'N/A'}</span>
          <span className='w-1 h-1 rounded-full bg-slate-700' />
          {req.isOldCustomer && (
            <>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-slate-800 text-slate-300 border border-slate-700">Returning Pt</span>
              <span className='w-1 h-1 rounded-full bg-slate-700' />
            </>
          )}
          <span className='text-[10px] text-slate-400 font-semibold flex items-center gap-1'><User className="w-3 h-3"/> By {req.agentName}</span>
        </div>
      </div>

      <div className='grid grid-cols-3 divide-x divide-white/[0.05] border-b border-white/[0.05]'>
        <div
          className="px-3 py-2 cursor-pointer hover:bg-white/[0.02] transition-colors group/phone"
          onClick={() => copyToClipboard(req.phoneNumber, "Phone number copied!")}
          title="Copy Phone"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Phone className="w-3 h-3 text-blue-400" /> Phone</span>
            <span className="text-sm font-bold text-slate-200 mt-0.5 truncate">{req.phoneNumber || "N/A"}</span>
          </div>
        </div>
        <div className="px-3 py-2 flex flex-col overflow-hidden">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Hospital className="w-3 h-3 text-emerald-400" /> Clinic</span>
          <span className="text-sm font-bold text-slate-200 mt-0.5 truncate">{req.clinicName || "N/A"}</span>
        </div>
        <div className="px-3 py-2 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> Date</span>
          <span className="text-xs font-bold text-slate-200 mt-0.5 truncate">{new Date(req.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      
      <div className='px-4 py-2.5 flex flex-wrap items-baseline justify-between border-b border-white/[0.05] bg-white/[0.01]'>
        <div className='flex items-baseline gap-1.5'>
          <span className='text-xs text-emerald-500 font-bold'>AED</span>
          <span className='text-2xl md:text-3xl font-black text-white font-mono tracking-tight'>{req.priceWithoutTax || 0}</span>
          {req.paymentLength && <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white/[0.05] px-2 py-0.5 rounded-full">{req.paymentLength} Mo. Plan</span>}
        </div>
        <span className='text-[10px] text-slate-500 font-mono font-medium'>w/tax: AED {amountTax}</span>
      </div>

      {/* PROGRESS TIMELINE */}
      <div className='px-4 py-3 border-b border-white/[0.05]'>
        <div className='flex items-center gap-0'>
          {[
            { label: 'Submitted', done: true },
            { label: req.status === 'rejected' ? 'TL Rejected' : 'TL Confirmed', done: req.status === 'confirmed' || req.status === 'rejected' },
            { label: 'Pt Contacted', done: req.customerContacted === 'contacted' },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <div className='flex flex-col items-center gap-1 w-20 shrink-0'>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${step.done ? 'bg-indigo-500 border-indigo-400' : 'bg-transparent border-slate-700'}`}>
                  {step.done && <Check className='w-2.5 h-2.5 text-white' />}
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-widest whitespace-nowrap ${step.done ? 'text-indigo-400' : 'text-slate-500'}`}>{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 mx-1 sm:mx-2 transition-all ${arr[i+1].done ? 'bg-indigo-500' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* NOTES & ATTACHMENTS (COLLAPSIBLE) */}
      <div className="border-b border-white/5 bg-white/[0.02]">
        <button onClick={() => setExpandedNotes(!expandedNotes)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center gap-3">
             <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" /> Notes & Attachments
             </span>
             {hasAttachments && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">Has Files</span>}
          </div>
          {expandedNotes ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />}
        </button>
        {expandedNotes && (
          <div className="px-5 pb-5 space-y-5">
             {req.notes && (
               <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-300 font-medium leading-relaxed">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Agent Notes</span> 
                 {req.notes}
               </div>
             )}
             {hasAttachments && (
               <div className="space-y-3">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Attached Files</span>
                 <AttachmentsDisplay photos={[...(req.photos || []), ...(req.paymentScreenshot ? [req.paymentScreenshot] : [])]} links={req.links} />
               </div>
             )}
          </div>
        )}
      </div>

      {/* TL NOTES SECTION */}
      {req.status === "confirmed" && (
        <div className="p-4 md:p-5 border-b border-white/5 bg-indigo-950/5 relative overflow-hidden">
           <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400"></div>
           <div className="flex flex-col gap-4 pl-3">
             <div className="flex flex-col gap-1.5 w-full">
               <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-1 opacity-80">
                 <CheckCircle2 className="w-3 h-3" /> Link Issued by TL
               </span>
               <div className="flex items-center group/link relative w-full border border-white/5 bg-black/20 rounded-lg p-3 hover:border-amber-500/30 transition-colors">
                  <ExternalLink className="w-4 h-4 text-amber-500/50 mr-3 shrink-0" />
                  <a href={normalizeUrl(req.paymentLink) || req.paymentLink} target="_blank" rel="noreferrer" onClick={() => copyToClipboard(req.paymentLink, "Payment Link Copied!")} className="flex-1 truncate text-sm text-amber-100 font-mono hover:text-white transition-colors cursor-pointer block pr-10">
                    {normalizeUrl(req.paymentLink) || req.paymentLink || "No payment link generated"}
                  </a>
                  <div className="opacity-0 group-hover/link:opacity-100 transition-opacity flex items-center absolute right-3 pointer-events-none">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                  </div>
               </div>
             </div>

             {req.tlNotes && (
               <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl mt-1">
                 <div className="text-[10px] font-bold text-emerald-500/70 mb-2 flex justify-between items-center">
                   <span className="uppercase tracking-widest">TL NOTES — {req.confirmedBy || "System"}</span>
                   <span className="text-emerald-500/40 font-mono">{new Date(req.confirmedAt || req.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                 </div>
                 <div className="text-sm text-emerald-100/90 font-medium leading-relaxed">
                   {req.tlNotes}
                 </div>
               </div>
             )}
             
             {req.tlLinks && (
                <div className="mt-1 space-y-2">
                   <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest block">TL Links</span>
                   <div className="flex flex-col gap-2">
                     {extractLinks(req.tlLinks).map((link: string, idx: number) => (
                       <a key={idx} href={normalizeUrl(link)} target="_blank" rel="noreferrer" className="flex gap-3 text-sm bg-black/40 border border-emerald-500/10 p-3 rounded-xl items-center text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors">
                         <LinkIcon className="w-4 h-4 shrink-0 text-emerald-500/50" />
                         <span className="truncate">{link}</span>
                       </a>
                     ))}
                   </div>
                </div>
             )}
           </div>
        </div>
      )}

      {req.status === "rejected" && (
        <div className="p-4 md:p-5 border-b border-white/5 bg-red-950/5 relative overflow-hidden">
           <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500"></div>
           <div className="pl-3">
             <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-xl">
               <div className="text-[10px] font-bold text-red-500/70 mb-2 flex justify-between items-center">
                 <span className="uppercase tracking-widest">REJECTION REASON — {req.confirmedBy || "System"}</span>
                 <span className="text-red-500/40 font-mono">{new Date(req.confirmedAt || req.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
               </div>
               <div className="text-sm text-red-100/90 font-medium leading-relaxed">
                 {req.tlNotes || "Request rejected by TL."}
               </div>
             </div>
           </div>
        </div>
      )}

      {/* TL INLINE HANDLING FORM */}
      {activeFintechHandlingId === req.id && isTLOreSupport && req.status === "not_confirmed" && (
        <div className="bg-[#0f0f15] border-y border-indigo-500/20 p-5 space-y-4">
           <h4 className="text-xs font-black text-indigo-400 flex items-center gap-2 mb-3 uppercase tracking-widest"><CornerDownRight className="w-4 h-4" /> Processing Panel</h4>
           <div className="space-y-4">
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex justify-between">
                 <span>Payment Link <span className="text-red-400">*</span></span>
               </label>
               <input type="text" value={tlFintechPaymentLink} onChange={(e) => setTlFintechPaymentLink(e.target.value)} placeholder="https://payment..." className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex justify-between">
                 <span>Guidance Notes</span>
               </label>
               <textarea value={tlFintechNotes} onChange={(e) => setTlFintechNotes(e.target.value)} placeholder="Add remarks..." className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-[80px] resize-none transition-all" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex justify-between">
                 <span>Supporting Links <span className="text-slate-600 font-medium">(Optional)</span></span>
               </label>
               <input type="text" value={tlFintechLinks} onChange={(e) => setTlFintechLinks(e.target.value)} placeholder="https://link1.com, https://link2.com" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" />
             </div>
             <div className="flex gap-3 justify-end pt-3 border-t border-white/5">
               <button onClick={() => { handleConfirmTabbyTamara(req.id, tlFintechPaymentLink, tlFintechNotes, tlFintechLinks, "rejected"); setActiveFintechHandlingId(null); }} className="px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold text-xs tracking-wider uppercase rounded-xl transition-colors flex items-center gap-1.5 shrink-0">
                 <Trash2 className="w-4 h-4" /> Reject
               </button>
               <button onClick={() => { handleConfirmTabbyTamara(req.id, tlFintechPaymentLink, tlFintechNotes, tlFintechLinks, "confirmed"); setActiveFintechHandlingId(null); }} className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center gap-1.5 w-full sm:w-auto justify-center">
                 <CheckCircle2 className="w-4 h-4" /> Issue Link
               </button>
             </div>
           </div>
        </div>
      )}

      {/* ACTION FOOTER */}
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap bg-white/[0.01] border-t border-white/5">
        {/* LEFT group: delete and edit */}
        <div className='mr-auto flex items-center gap-2'>
          {isSuperAdmin && (
            <button onClick={() => handleDeleteTabbyTamara(req.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20" title="Delete Request (Admin)">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {(canEditItem(req.createdAt) && !['confirmed', 'rejected'].includes(req.status)) && (
            <button onClick={() => setEditingItem({ type: "tt_request", id: req.id, data: { ...req } })} className="px-3 py-1.5 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[10px] uppercase tracking-widest border border-blue-500/20">
              <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Edit</span>
            </button>
          )}
        </div>

        {/* RIGHT group: copy, share, handle, contact */}
        {isTLOreSupport && (
           <button onClick={handleShareAction} className="px-3 py-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[10px] uppercase tracking-widest border border-indigo-500/20 hidden md:flex">
              <Share className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Share</span>
           </button>
        )}

        <button onClick={handleCopyTextOnly} className="px-3 py-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[10px] uppercase tracking-widest border border-white/5">
          <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy</span>
        </button>

        {isTLOreSupport && req.status === "not_confirmed" && (
          <>
            <button
               onClick={() => handleMarkPatientContactedTT(req.id, "contacted")}
               className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
               title="Force Close without notes"
            >
              <span className="hidden sm:inline">Force Close</span>
            </button>
            <button
               onClick={() => {
                 if (activeFintechHandlingId === req.id) {
                   setActiveFintechHandlingId(null);
                 } else {
                   setActiveFintechHandlingId(req.id);
                   setTlFintechPaymentLink(req.paymentLink || "");
                   setTlFintechNotes(req.tlNotes || "");
                   setTlFintechLinks(req.tlLinks || "");
                 }
               }}
               className={`px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all ${activeFintechHandlingId === req.id ? 'bg-slate-700 text-white shadow-inner' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'}`}
            >
              <PenTool className="w-3.5 h-3.5" /> {activeFintechHandlingId === req.id ? "Cancel" : "TL Handle"}
            </button>
          </>
        )}

        {(isTLOreSupport || currentUser?.role === "agent") && req.status === "confirmed" && req.customerContacted !== "contacted" && (
           <button
              onClick={() => setIsContactingMode(!isContactingMode)}
              className={`px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all ${isContactingMode ? 'bg-slate-700 text-white shadow-inner' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'}`}
           >
              <CheckCircle2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{isContactingMode ? 'Cancel' : 'Mark Contacted'}</span>
           </button>
        )}

        {currentUser?.role === "agent" && req.status === "confirmed" && req.customerContacted === "contacted" && (
          <button
             onClick={() => handleMarkPatientContactedTT?.(req.id, "not_contacted")} 
             className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors border border-white/5"
          >
             <AlertCircle className="w-3.5 h-3.5 opacity-70" /> Undo Contact
          </button>
        )}
      </div>

      {isContactingMode && (
        <div className="p-4 md:p-5 bg-emerald-950/20 border-t border-emerald-500/10 flex flex-col gap-4">
           <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-100 uppercase tracking-widest">Mark as Contacted</h3>
           </div>
           
           <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest block mb-1">Contact Notes (Optional)</label>
                <textarea
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="E.g., Called patient, they will complete the payment link..."
                  className="w-full bg-black/40 border border-emerald-500/20 rounded-xl p-3 text-sm text-white placeholder-emerald-500/30 focus:outline-none focus:border-emerald-500/50 resize-none h-24"
                />
              </div>
              
              <MultiAttachmentUpload
                 photos={contactPhotos}
                 links={[]}
                 onPhotosChange={setContactPhotos}
                 onLinksChange={() => {}}
                 photosLabel="Attach Proof / Screenshots (Optional)"
                 onUploadStateChange={setIsContactingUploading}
              />
              
              <div className="flex justify-end gap-2 pt-2">
                 <button
                    disabled={isContactingUploading}
                    onClick={() => {
                       handleMarkPatientContactedTT(req.id, "contacted", contactNotes, "", contactPhotos);
                       setIsContactingMode(false);
                       setContactNotes("");
                       setContactPhotos([]);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest flex items-center gap-2"
                 >
                   {isContactingUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                   Confirm Contacted
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ALWAYS VISIBLE REPLY THREAD */}
      <div className="bg-black/20 pt-4 pb-5 px-4 md:px-5">
        <RequestReplyThread
          request={req}
          currentUser={currentUser}
          collectionName="tt_requests"
          addSystemNotification={addSystemNotification}
          requestType="FinTech"
          requestAgentName={req.agentName}
        />
      </div>
    </div>
  );
};
