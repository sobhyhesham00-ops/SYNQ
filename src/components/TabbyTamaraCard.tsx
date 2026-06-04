import React from 'react';
import { Copy, ExternalLink, MessageCircle, AlertCircle, Phone, CheckCircle2, Hospital, Hash, User, Calendar, DollarSign, PenTool, Trash2, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { RequestReplyThread } from './RequestReplyThread';

const CopyableField = ({ icon: Icon, label, value, isBold = false }: { icon: any, label: string, value: string, isBold?: boolean }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied!`, { icon: '📋' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5 flex flex-col justify-center group hover:bg-white/[0.04] transition-all cursor-pointer" onClick={handleCopy}>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1 text-[9px] text-slate-400 uppercase tracking-wider font-bold">
          <Icon className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
          {label}
        </div>
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <p className={`text-slate-200 text-xs break-words break-all font-sans ${isBold ? 'font-black text-white' : 'font-semibold'}`} title={value}>
        {value}
      </p>
    </div>
  );
};

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
  setEditingItem
}: any) => {
  const isPendingContact = req.status === "confirmed" && req.customerContacted === "not_contacted";
  const isAwaitingConfirm = req.status === "not_confirmed";
  const isCompleted = req.customerContacted === "contacted";

  const getThemeColor = () => {
    if (req.platform === "tabby") return "amber";
    if (req.platform === "tamara") return "pink";
    if (req.platform === "one_time_payment") return "indigo";
    return "emerald";
  };

  const platformBadgeColor = 
    req.platform === "tabby" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]" :
    req.platform === "tamara" ? "bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.1)]" :
    req.platform === "one_time_payment" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]" :
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]";

  return (
    <div className={`relative bg-[#111113] border border-white/10 rounded-xl p-3 md:p-4 overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-xl ${isPendingContact ? "bg-gradient-to-b from-rose-500/[0.03] to-transparent ring-1 ring-rose-500/20" : isAwaitingConfirm ? "bg-gradient-to-b from-amber-500/[0.03] to-transparent" : "opacity-95 hover:opacity-100"}`}>
      {/* Top Border Accent - Glow effect */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        req.platform === "tabby" ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" :
        req.platform === "tamara" ? "bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]" :
        req.platform === "one_time_payment" ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
      } opacity-90`} />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-3 border-b border-white border-opacity-5 pb-3">
        <div className="flex-1 w-full text-left">
          <div className="flex flex-wrap items-center gap-1.5 mb-2 cursor-default">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${platformBadgeColor}`}>
              {req.platform === "one_time_payment" ? "One Time Paid" : req.platform}
            </span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${req.isOldCustomer ? "bg-slate-800/80 text-slate-300 border-white/5" : "bg-indigo-500/15 text-indigo-300 border-indigo-500/20"}`}>
              {req.isOldCustomer ? "👤 Old Customer" : "✨ New Customer"}
            </span>
            {req.status === "not_confirmed" ? (
              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Pending TL
              </span>
            ) : req.status === "rejected" ? (
              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Disabled / Rejected
              </span>
            ) : isCompleted ? (
              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Contacted
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3" /> Contact Pending
              </span>
            )}
          </div>
          <div className="group/name relative inline-block cursor-pointer" onClick={() => {
             navigator.clipboard.writeText(req.patientName || "");
             toast.success("Patient name copied!");
          }}>
             <h3 className="text-lg font-black text-white font-sans tracking-tight mb-0.5 flex items-center gap-1.5 group-hover/name:text-amber-100 transition-colors">
                {req.patientName || "Unknown Patient"}
                <Copy className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover/name:opacity-100 transition-opacity" />
             </h3>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
             <User className="w-3 h-3 text-slate-500" /> <span className="font-sans font-medium text-slate-300">{req.agentName}</span>
             <span className="text-slate-600">|</span>
             <Calendar className="w-3 h-3 text-slate-500" /> <span className="font-sans">{new Date(req.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
          </p>
        </div>

        <div className="text-right whitespace-nowrap pt-1 bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-xl w-full md:w-auto">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-80">Collection Amount</p>
          <div className="flex items-baseline gap-1 md:justify-end cursor-pointer" onClick={() => {
             navigator.clipboard.writeText(req.priceWithoutTax || "");
             toast.success("Amount copied!");
          }}>
             <span className="text-emerald-400 font-bold text-xs">AED</span>
             <span className="text-2xl font-black text-white font-sans tracking-tight leading-none">{req.priceWithoutTax}</span>
          </div>
          <p className="text-[10px] text-indigo-300 font-medium mt-1 opacity-90 border-t border-white/[0.05] pt-0.5 flex md:justify-end gap-1"><span className="text-slate-400 font-normal">w/ Tax: </span> <span className="font-bold">AED {(!isNaN(Number(req.priceWithoutTax)) ? (Number(req.priceWithoutTax) * 1.05).toFixed(2) : "-")}</span></p>
        </div>
      </div>

      {/* Grid Data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3 text-left">
        <CopyableField icon={Hash} label="File/ID" value={req.fileNumber ? `F: ${req.fileNumber}` : (req.idNumber || "N/A")} isBold />
        <CopyableField icon={Phone} label="Phone" value={req.phoneNumber || "N/A"} isBold />
        <CopyableField icon={Hospital} label="Clinic" value={req.clinicName || "N/A"} />
        <CopyableField icon={Calendar} label="Plan Length" value={req.paymentLength ? `${req.paymentLength} M` : "Default terms"} />
      </div>

      {req.notes && (
        <div className="bg-[#1a1a24] rounded-lg p-3 mb-3 text-xs text-slate-300 border border-indigo-500/20 border-l-2 border-l-indigo-500 shadow-sm text-left tracking-wide leading-relaxed font-sans relative cursor-pointer group/notes flex items-start gap-2" onClick={() => {
          navigator.clipboard.writeText(req.notes);
          toast.success("Notes copied!");
        }}>
           <div className="flex-1">
             <span className="font-bold text-indigo-300 uppercase text-[9px] block mb-0.5 tracking-widest">Agent Notes:</span>
             {req.notes}
           </div>
           <Copy className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/notes:opacity-100 transition-opacity shrink-0" />
        </div>
      )}

      {/* Attachments */}
      <div className="mb-3 text-left">
        <AttachmentsDisplay
          photos={[
            ...(req.photos || []),
            ...(req.paymentScreenshot ? [req.paymentScreenshot] : []),
          ]}
          links={req.links}
        />
      </div>

      {/* Payment Link Block */}
      {req.paymentLink && (
        <div className="mb-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.05)] text-left relative overflow-hidden group/link">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="truncate w-full space-y-0.5 relative z-10">
            <h4 className="text-[9px] text-emerald-400 uppercase font-black tracking-widest flex items-center gap-1.5 mb-0.5">
              <span className="bg-emerald-500/20 px-1 py-0.5 rounded font-black text-emerald-300">LINK</span>
              Generated Payment URL
            </h4>
            <div className="flex items-center gap-1.5 pl-1 cursor-pointer w-fit" onClick={() => {
                navigator.clipboard.writeText(req.paymentLink || "");
                toast.success("Payment link copied!");
            }}>
              <p className="text-emerald-50 font-mono text-xs font-medium truncate select-all">{req.paymentLink}</p>
              <Copy className="w-3 h-3 text-emerald-500/50 hover:text-emerald-400 shrink-0" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0 w-full md:w-auto relative z-10">
            <a
              href={req.paymentLink.startsWith("http") ? req.paymentLink : `https://${req.paymentLink}`}
              target="_blank"
              referrerPolicy="no-referrer"
              className="flex-1 md:flex-none px-3 py-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-md text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Link
            </a>
          </div>
        </div>
      )}

      {/* TL Notes */}
      {req.tlNotes && (
        <div className="mb-3 bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 text-left shadow-inner">
          <h4 className="text-[9px] text-amber-400 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
             <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
             Team Leader Reply / Guidance
          </h4>
          <p className="text-amber-50 text-[11px] leading-relaxed pl-4 font-sans border-l border-amber-500/20 ml-1 py-0.5">{req.tlNotes}</p>
          {req.tlLinks && (
             <div className="mt-2.5 pl-4 flex flex-wrap gap-1.5">
                {req.tlLinks.split(",").map((link: string, idx: number) => {
                  const trimmed = link.trim();
                  if (!trimmed) return null;
                  const href = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
                  return (
                    <a
                      key={idx}
                      href={href}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md text-amber-200 text-[9px] font-bold transition-all flex items-center gap-1 hover:-translate-y-0.5"
                    >
                      <ExternalLink className="w-3 h-3 text-amber-400" /> Linked Resource {idx + 1}
                    </a>
                  );
                })}
             </div>
          )}
        </div>
      )}

      {/* Inline TL Reply Input Form */}
      {activeFintechHandlingId === req.id && isTLOreSupport && (
        <div className="mt-2 mb-6 p-5 bg-[#0f0f12] border border-indigo-500/30 rounded-2xl space-y-4 text-left shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="space-y-1 relative z-10">
            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block ml-1">
              Payment Link / URL *
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={tlFintechPaymentLink}
              onChange={(e) => setTlFintechPaymentLink(e.target.value)}
              className="w-full bg-[#16161a] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-400 focus:bg-[#1a1a20] font-sans font-medium transition-colors"
            />
          </div>
          <div className="space-y-1 relative z-10">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">
              Guidance Notes (Optional)
            </label>
            <textarea
              placeholder="Add notes, pointers, instructions, or remarks for the agent..."
              value={tlFintechNotes}
              onChange={(e) => setTlFintechNotes(e.target.value)}
              className="w-full bg-[#16161a] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-400 focus:bg-[#1a1a20] font-sans font-medium min-h-[80px] transition-colors resize-y"
            />
          </div>
          <div className="space-y-1 relative z-10">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">
              Supporting Links (Optional, comma-separated)
            </label>
            <input
              type="text"
              placeholder="https://link1.com, https://link2.com"
              value={tlFintechLinks}
              onChange={(e) => setTlFintechLinks(e.target.value)}
              className="w-full bg-[#16161a] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-400 focus:bg-[#1a1a20] font-sans font-medium transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-end pt-3 relative z-10 border-t border-white/5 mt-2">
            <button
              type="button"
              onClick={() => setActiveFintechHandlingId(null)}
              className="px-4 py-2 hover:bg-white/5 rounded-xl text-[11px] font-black text-slate-400 cursor-pointer uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleConfirmTabbyTamara(req.id, tlFintechPaymentLink, tlFintechNotes, tlFintechLinks, "rejected");
                setActiveFintechHandlingId(null);
              }}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[11px] font-black rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 uppercase tracking-wider"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reject / Disable
            </button>
            <button
              type="button"
              onClick={() => {
                handleConfirmTabbyTamara(req.id, tlFintechPaymentLink, tlFintechNotes, tlFintechLinks, "confirmed");
                setActiveFintechHandlingId(null);
              }}
              className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white text-[11px] font-black font-sans uppercase tracking-wider rounded-xl shadow-[0_4px_15px_rgba(99,102,241,0.3)] cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Issue Payment Link
            </button>
          </div>
        </div>
      )}

      {/* Status Timers */}
      {req.status === "confirmed" && (
        <div className="mb-3 p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.05] flex flex-wrap gap-3 items-center justify-between text-xs font-sans text-left">
          <div className="space-y-0.5 text-left">
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Authorized By
            </p>
            <p className="text-[10px] text-slate-300 font-bold md:pl-4">
              <span className="text-white">{req.confirmedBy}</span> &bull; {new Date(req.confirmedAt || req.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          {isCompleted && (
            <div className="text-right space-y-0.5">
              <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest md:mr-1">
                Turnaround Time
              </p>
              <p className="font-mono text-[10px] font-black px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 inline-block">
                {getElapsedTimerString(req.confirmedAt || req.createdAt, req.contactedAt)}
              </p>
            </div>
          )}
        </div>
      )}
      
      {req.status === "rejected" && (
        <div className="mb-3 p-2.5 bg-rose-950/20 rounded-lg border border-rose-500/10 flex items-center justify-between text-xs font-sans text-left">
          <div className="space-y-0.5 text-left text-rose-300">
            <p className="text-[8px] text-rose-400/80 uppercase font-black tracking-widest flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-500" />
              Rejected By
            </p>
            <p className="text-[10px] font-bold md:pl-4">
              <span className="text-rose-200">{req.confirmedBy || "TL"}</span> &bull; {req.confirmedAt ? new Date(req.confirmedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short'}) : new Date(req.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Action Footers */}
      <div className="flex flex-wrap items-center justify-end gap-2 mt-1 pt-3 border-t border-white/[0.05]">
        {/* DELETE Option */}
        {isSuperAdmin && (
          <button
            onClick={() => handleDeleteTabbyTamara(req.id)}
            className="mr-auto px-2 py-1.5 hover:bg-rose-500/15 text-rose-400/60 hover:text-rose-400 rounded-md text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer uppercase tracking-widest"
            title="Delete Request"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}

        {/* User Edit */}
        {canEditItem(req.createdAt) && (
          <button
            onClick={() => setEditingItem({ type: "tt_request", id: req.id, data: { ...req } })}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-widest border border-white/5"
          >
            <Pencil className="w-3 h-3" />
            Edit ({getRemainingEditTime(req.createdAt)})
          </button>
        )}

        {/* TL Actions */}
        {isTLOreSupport && (
          <>
            <button
              onClick={() => {
                const text = `Tabby / Tamara Request:
Patient: ${req.patientName} | File: ${req.fileNumber || 'N/A'}
Phone: ${req.phoneNumber}
Price: AED ${req.priceWithoutTax}
Platform: ${req.platform}
Clinic: ${req.clinicName || 'N/A'}
Payment Link: ${req.paymentLink || 'N/A'}
Notes: ${req.notes || 'None'}
`;
                navigator.clipboard.writeText(text);
                toast.success("Summary copied to clipboard!");
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md text-slate-300 text-[10px] font-black transition-all flex items-center gap-1.5 uppercase tracking-widest cursor-pointer"
              title="Copy Request Summary"
            >
              <Copy className="w-3 h-3 opacity-70" /> Copy Summary
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
               className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all flex items-center gap-1.5 uppercase tracking-widest border cursor-pointer ${
                 activeFintechHandlingId === req.id 
                   ? "bg-slate-800 text-white border-white/10 shadow-inner" 
                   : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
               }`}
            >
               {activeFintechHandlingId === req.id ? <AlertCircle className="w-3 h-3 text-slate-400" /> : <PenTool className="w-3 h-3" />}
               {activeFintechHandlingId === req.id ? "Cancel Action" : "Handle Request"}
            </button>
            
            {req.status === "confirmed" && req.customerContacted !== "contacted" && (
              <button
                 onClick={() => handleMarkPatientContactedTT(req.id)}
                 className="px-3 py-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-transparent rounded-md text-[10px] font-black transition-all flex items-center gap-1 uppercase tracking-widest cursor-pointer"
              >
                 <CheckCircle2 className="w-3.5 h-3.5" />
                 Mark Contacted
              </button>
            )}
            
            {req.status === "not_confirmed" && (
              <button
                 onClick={() => handleMarkPatientContactedTT(req.id, "contacted")}
                 className="px-3 py-1.5 bg-emerald-600 text-slate-950 hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-transparent rounded-md text-[10px] font-black transition-all flex items-center gap-1 uppercase tracking-widest cursor-pointer"
              >
                 <CheckCircle2 className="w-3.5 h-3.5" />
                 Force Close
              </button>
            )}
          </>
        )}

        {/* Undo Contact For Agent */}
        {currentUser?.role === "agent" && req.status === "confirmed" && req.customerContacted === "contacted" && (
          <button
             onClick={() => handleMarkPatientContactedTT?.(req.id, "not_contacted")} 
             className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-black font-sans uppercase tracking-widest text-[10px] rounded-md border border-white/5 transition-all cursor-pointer flex items-center gap-1"
          >
             <AlertCircle className="w-3 h-3 opacity-70" /> Undo Contact
          </button>
        )}
      </div>

      <div className="w-full mt-3 pt-3 border-t border-white/5">
        <RequestReplyThread
          request={req}
          currentUser={currentUser}
          collectionName="tabby_tamara"
        />
      </div>
    </div>
  );
};
