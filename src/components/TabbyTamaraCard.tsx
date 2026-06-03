import React from 'react';
import { Copy, ExternalLink, MessageCircle, AlertCircle, Phone, CheckCircle2, Hospital, Hash, User, Calendar, DollarSign, PenTool, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { RequestReplyThread } from './RequestReplyThread';

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
  isWithinFiveMinutes,
  getRemainingEditTimeStr,
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
    req.platform === "tabby" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
    req.platform === "tamara" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" :
    req.platform === "one_time_payment" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  return (
    <div className={`relative bg-[#16161a] border border-white/5 rounded-2xl p-5 overflow-hidden group hover:border-white/10 transition-all ${isPendingContact ? "bg-gradient-to-b from-rose-500/[0.02] to-transparent ring-1 ring-rose-500/10" : isAwaitingConfirm ? "bg-gradient-to-b from-amber-500/[0.02] to-transparent" : "opacity-90"}`}>
      {/* Top Border Accent */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        req.platform === "tabby" ? "bg-amber-500" :
        req.platform === "tamara" ? "bg-pink-500" :
        req.platform === "one_time_payment" ? "bg-indigo-500" : "bg-emerald-500"
      } opacity-80`} />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 mt-2 border-b border-white/5 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${platformBadgeColor}`}>
              {req.platform === "one_time_payment" ? "One Time Paid" : req.platform}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border border-white/5 ${req.isOldCustomer ? "bg-slate-800 text-slate-300" : "bg-indigo-500/10 text-indigo-300"}`}>
              {req.isOldCustomer ? "Old Customer" : "New Customer"}
            </span>
            {req.status === "not_confirmed" ? (
              <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                Pending TL
              </span>
            ) : req.status === "rejected" ? (
              <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Rejected
              </span>
            ) : isCompleted ? (
              <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Contacted
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                Contact Pending
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-white font-display mb-1 text-left">{req.patientName || "Unknown Patient"}</h3>
          <p className="text-[11px] text-slate-400 flex items-center gap-2 font-mono text-left">
             <User className="w-3.5 h-3.5 text-slate-500" /> <span className="font-sans font-medium text-slate-300">{req.agentName}</span>
             <span className="text-slate-600">|</span>
             <Calendar className="w-3.5 h-3.5 text-slate-500" /> <span className="font-sans">{new Date(req.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
          </p>
        </div>

        <div className="text-right whitespace-nowrap pt-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Amount To Collect</p>
          <div className="flex items-baseline gap-1.5 justify-end">
             <span className="text-emerald-400 font-bold text-sm">AED</span>
             <span className="text-3xl font-black text-white font-sans tracking-tight leading-none">{req.priceWithoutTax}</span>
          </div>
          <p className="text-[10px] text-indigo-400 font-medium mt-1">AED {(!isNaN(Number(req.priceWithoutTax)) ? (Number(req.priceWithoutTax) * 1.05).toFixed(2) : "-")} w/ Tax</p>
        </div>
      </div>

      {/* Grid Data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-left">
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">
            <Hash className="w-3.5 h-3.5 text-indigo-400" />
            File / ID
          </div>
          <p className="text-slate-200 font-mono text-sm font-bold truncate" title={req.fileNumber || req.idNumber || "N/A"}>
            {req.fileNumber ? `F: ${req.fileNumber}` : (req.idNumber || "N/A")}
          </p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            Contact
          </div>
          <p className="text-slate-200 font-mono text-sm font-bold truncate">
            {req.phoneNumber || "N/A"}
          </p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">
            <Hospital className="w-3.5 h-3.5 text-rose-400" />
            Clinic
          </div>
          <p className="text-slate-200 font-sans text-sm font-bold truncate">
            {req.clinicName || "N/A"}
          </p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Plan Length
          </div>
          <p className="text-slate-200 font-sans text-sm font-bold truncate">
            {req.paymentLength ? `${req.paymentLength} Months` : "Default"}
          </p>
        </div>
      </div>

      {req.notes && (
        <div className="bg-slate-900/50 rounded-xl p-3.5 mb-4 text-sm text-slate-300 italic border-l-2 border-l-indigo-500 shadow-inner text-left tracking-wide">
           {req.notes}
        </div>
      )}

      {/* Attachments */}
      <AttachmentsDisplay
        photos={[
          ...(req.photos || []),
          ...(req.paymentScreenshot ? [req.paymentScreenshot] : []),
        ]}
        links={req.links}
      />

      {/* Payment Link Block */}
      {req.paymentLink && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm text-left">
          <div className="truncate w-full space-y-1">
            <h4 className="text-[10px] text-emerald-400 uppercase font-black tracking-widest flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 bg-emerald-500/20 rounded-full p-0.5" />
              Generated Payment URL
            </h4>
            <p className="text-emerald-50 font-mono text-sm truncate pl-6">{req.paymentLink}</p>
          </div>
          <div className="flex gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => {
                navigator.clipboard.writeText(req.paymentLink || "");
                toast.success("Payment link copied!");
              }}
              className="flex-1 md:flex-none px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-slate-400" /> Copy
            </button>
            <a
              href={req.paymentLink.startsWith("http") ? req.paymentLink : `https://${req.paymentLink}`}
              target="_blank"
              referrerPolicy="no-referrer"
              className="flex-1 md:flex-none px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" /> Open Link
            </a>
          </div>
        </div>
      )}

      {/* TL Notes */}
      {req.tlNotes && (
        <div className="mt-4 bg-[#fbbf24]/10 border border-amber-500/20 rounded-xl p-4 text-left">
          <h4 className="text-[10px] text-amber-400 uppercase font-black tracking-widest mb-2 flex items-center gap-1.5">
             <MessageCircle className="w-4 h-4 bg-amber-500/20 rounded pl-0.5 pr-0.5" />
             Team Leader Response
          </h4>
          <p className="text-amber-50 text-sm leading-relaxed pl-6">{req.tlNotes}</p>
          {req.tlLinks && (
             <div className="mt-3 pl-6 flex flex-wrap gap-2">
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
                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-200 text-[10px] font-bold transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" /> Link {idx + 1}
                    </a>
                  );
                })}
             </div>
          )}
        </div>
      )}

      {/* Inline TL Reply Input Form */}
      {activeFintechHandlingId === req.id && isTLOreSupport && (
        <div className="mt-4 p-4 bg-slate-900 border border-amber-500/30 rounded-xl space-y-3.5 text-left shadow-lg">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
              Payment Link / URL *
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={tlFintechPaymentLink}
              onChange={(e) => setTlFintechPaymentLink(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
              TL Notes & Guidance (Optional)
            </label>
            <textarea
              placeholder="Add notes, pointers, or remarks..."
              value={tlFintechNotes}
              onChange={(e) => setTlFintechNotes(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans min-h-[60px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
              Links / anything else (Optional, comma-separated)
            </label>
            <input
              type="text"
              placeholder="https://link1.com, https://link2.com"
              value={tlFintechLinks}
              onChange={(e) => setTlFintechLinks(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setActiveFintechHandlingId(null)}
              className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleConfirmTabbyTamara(req.id, tlFintechPaymentLink, tlFintechNotes, tlFintechLinks, "rejected");
                setActiveFintechHandlingId(null);
              }}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/20 text-rose-300 text-[10px] font-bold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => {
                handleConfirmTabbyTamara(req.id, tlFintechPaymentLink, tlFintechNotes, tlFintechLinks, "confirmed");
                setActiveFintechHandlingId(null);
              }}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 text-slate-950 text-[11px] font-black font-sans rounded-lg shadow-md cursor-pointer transition-all flex items-center gap-1"
            >
              Confirm & Approve
            </button>
          </div>
        </div>
      )}

      {/* Status Timers */}
      {req.status === "confirmed" && (
        <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/[0.05] flex items-center justify-between text-xs font-sans">
          <div className="space-y-0.5 text-left">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
              Confirmed by {req.confirmedBy}:
            </p>
            <p className="text-[10px] text-slate-300">
              {new Date(req.confirmedAt || req.createdAt).toLocaleString()}
            </p>
          </div>
          {isCompleted && (
            <div className="text-right space-y-0.5">
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                Turnaround:
              </p>
              <p className="font-mono text-[11px] font-black px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10">
                {getElapsedTimerString(req.confirmedAt || req.createdAt, req.contactedAt)}
              </p>
            </div>
          )}
        </div>
      )}
      
      {req.status === "rejected" && (
        <div className="mt-4 p-3 bg-rose-950/20 rounded-xl border border-rose-500/10 flex items-center justify-between text-xs font-sans">
          <div className="space-y-0.5 text-left text-rose-300">
            <p className="text-[9px] text-rose-400 uppercase font-black tracking-widest">
              Rejected by {req.confirmedBy || "TL"}:
            </p>
            <p className="text-[10px]">
              {req.confirmedAt ? new Date(req.confirmedAt).toLocaleString() : new Date(req.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Action Footers */}
      <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-4 border-t border-white/5">
        {/* DELETE Option */}
        {isSuperAdmin && (
          <button
            onClick={() => handleDeleteTabbyTamara(req.id)}
            className="mr-auto px-2 py-1.5 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/10 rounded-lg text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Delete Request"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* User Edit */}
        {isWithinFiveMinutes(req.createdAt) && (
          <button
            onClick={() => setEditingItem({ type: "tt_request", id: req.id, data: { ...req } })}
            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title={`Edit request (${getRemainingEditTimeStr(req.createdAt)})`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit ({getRemainingEditTimeStr(req.createdAt)})
          </button>
        )}

        {/* TL Actions */}
        {isTLOreSupport && (
          <>
            <button
              onClick={() => {
                const text = `Tabby / Tamara Request Data:
Patient: ${req.patientName}
File: ${req.fileNumber}
Phone: ${req.phoneNumber}
Price: ${req.priceWithoutTax}
ID/Type: ${req.idNumber || (req.isOldCustomer ? "Old" : "New")}
Platform: ${req.platform}
Clinic: ${req.clinicName}
Status: ${req.status}
Details: ${req.notes}
Links: ${(req.links || []).join(", ")}
`;
                navigator.clipboard.writeText(text);
                toast.success("Details copied to clipboard!");
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1.5"
              title="Copy Request details"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Details
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
               className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                 activeFintechHandlingId === req.id 
                   ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400" 
                   : "bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 shadow-lg"
               }`}
            >
               {activeFintechHandlingId === req.id ? <PenTool className="w-3.5 h-3.5" /> : <span>👑</span>}
               {activeFintechHandlingId === req.id ? "Cancel Handling" : "Reply & Review"}
            </button>
            
            {req.status === "confirmed" && req.customerContacted !== "contacted" && (
              <button
                 onClick={() => handleMarkPatientContactedTT(req.id)}
                 className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 text-[11px] font-bold transition-all flex items-center gap-1.5"
              >
                 <CheckCircle2 className="w-3.5 h-3.5" />
                 Mark Contacted
              </button>
            )}
          </>
        )}

        {/* Undo Contact For Agent */}
        {currentUser?.role === "agent" && req.status === "confirmed" && req.customerContacted === "contacted" && (
          <button
             onClick={() => handleMarkPatientContactedTT?.(req.id, "not_contacted")} 
             className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold font-sans text-[10px] rounded-lg border border-white/5 transition-all cursor-pointer flex items-center gap-1"
          >
             Undo Contact
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

