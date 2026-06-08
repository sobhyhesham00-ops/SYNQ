import React, { useState } from "react";
import { 
  X, 
  User, 
  Calendar, 
  Building, 
  Phone, 
  FileText, 
  Activity, 
  MessageSquare, 
  Paperclip, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  ExternalLink,
  Copy,
  Send,
  HelpCircle,
  Clock,
  Briefcase,
  Layers,
  Check,
  AlertOctagon,
  CornerUpLeft,
  ChevronsRight,
  RefreshCw
} from "lucide-react";
import { CRMCase } from "./CRMTypes";
import { AssignmentControl } from "./AssignmentControl";
import { CaseConversation } from "./CaseConversation";
import { CaseAttachments } from "./CaseAttachments";
import { CaseActivityTimeline } from "./CaseActivityTimeline";
import { buildCaseClipboardPayload, copyToClipboard } from "../../utils";
import { toast } from "sonner";

interface CaseDetailDrawerProps {
  caseData: CRMCase | null;
  onClose: () => void;
  currentUser: any;
  isTLOreSupport: boolean;
  addSystemNotification?: (
    title: string, 
    message: string, 
    type: any, 
    target: string, 
    stableId?: string, 
    entityType?: any, 
    entityId?: string
  ) => void;
  onAssignCase: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara', agentName: string) => Promise<void>;
  onClaimCase: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara') => Promise<void>;
  onDeleteCase: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara') => Promise<void>;
  onEditItem: (editingItem: { type: string; id: string; data: any }) => void;
  onSendToPartner: (caseId: string, notes: string, photos: string[]) => Promise<void>;
  onMarkInquirySent: (inquiryId: string) => Promise<void>;
  onMarkPatientContactedTT: (caseId: string, type: 'complaint' | 'tabby_tamara', contactedStatus: 'contacted' | 'attempted' | 'not_contacted') => Promise<void>;
  onTLCommentComplaint: (complaintId: string, comment: string, resolutionType: string) => Promise<void>;
  onCloseComplaint: (complaintId: string) => Promise<void>;
  onReopenComplaint: (complaintId: string) => Promise<void>;
}

export const CaseDetailDrawer: React.FC<CaseDetailDrawerProps> = ({
  caseData,
  onClose,
  currentUser,
  isTLOreSupport,
  addSystemNotification,
  onAssignCase,
  onClaimCase,
  onDeleteCase,
  onEditItem,
  onSendToPartner,
  onMarkInquirySent,
  onMarkPatientContactedTT,
  onTLCommentComplaint,
  onCloseComplaint,
  onReopenComplaint,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'conversation' | 'attachments' | 'timeline'>('overview');
  
  // Custom action panel inputs
  const [partnerNotes, setPartnerNotes] = useState('');
  const [showPartnerPanel, setShowPartnerPanel] = useState(false);
  const [isSubmittingPartner, setIsSubmittingPartner] = useState(false);

  // Complaint handling state
  const [complaintComment, setComplaintComment] = useState("");
  const [complaintResType, setComplaintResType] = useState("");
  const [showResPanel, setShowResPanel] = useState(false);
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);

  if (!caseData) {
    return (
      <div id="case-drawer-empty-placeholder" className="h-full flex flex-col items-center justify-center p-8 bg-[#09090c] rounded-2xl border border-white/5 text-center min-h-[500px]">
        <Layers className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">No Case Selected</h3>
        <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
          Select a case from the workspace table to open live tracking details, conversations thread, file attachments, and assignment routing parameters.
        </p>
      </div>
    );
  }

  const handleCopyClipboard = () => {
    try {
      let payloadText = "";
      let payloadHtml = "";

      if (caseData.crmType === "inquiry") {
        const inq = caseData.raw as any;
        const refCode = `INQ-${inq.id.replace('inq_', '').toUpperCase()}`;
        
        payloadText = `[${refCode}] INQUIRY DETAILS\n` +
          `-----------------------------------\n` +
          `Clinic Name: ${inq.clinicName || "N/A"}\n` +
          `Phone Number: ${inq.phoneNumber || "N/A"}\n` +
          `Agent Name: ${inq.agentName || "N/A"}\n` +
          `Inquiry Text: ${inq.text || "N/A"}\n` +
          `Status: ${inq.status?.toUpperCase() || "N/A"}\n` +
          `Answer: ${inq.answer || "N/A"}`;

        payloadHtml = `<div style="font-family: sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5;">` +
          `<h3 style="margin: 0 0 10px 0; color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">[${refCode}] INQUIRY</h3>` +
          `<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">` +
          `<tr><td style="font-weight: bold; width: 120px; padding: 4px 0;">Clinic Name:</td><td>${inq.clinicName || "N/A"}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Phone:</td><td style="font-family: monospace;">${inq.phoneNumber || "N/A"}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Agent:</td><td>${inq.agentName || "N/A"}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Status:</td><td><span style="background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">${inq.status || "N/A"}</span></td></tr>` +
          `</table>` +
          `<p style="font-weight: bold; margin: 10px 0 5px 0;">Inquiry Body:</p>` +
          `<blockquote style="border-left: 3px solid #6366f1; padding-left: 10px; margin: 0; color: #475569; font-style: italic;">${inq.text || "N/A"}</blockquote>` +
          (inq.answer ? `<p style="font-weight: bold; margin: 10px 0 5px 0; color: #10b981;">Answer / Response:</p>` +
          `<blockquote style="border-left: 3px solid #10b981; padding-left: 10px; margin: 0; color: #475569;">${inq.answer}</blockquote>` : "") +
          `</div>`;
      } else {
        const payload = buildCaseClipboardPayload(caseData.raw as any);
        payloadText = payload.text;
        payloadHtml = payload.html;
      }

      copyToClipboard(payloadText, "Case record details captured and copied to your clipboard!", payloadHtml);
    } catch {
      toast.error("Failed to copy clipboard payload.");
    }
  };

  const handlePartnerSubmit = async () => {
    setIsSubmittingPartner(true);
    try {
      await onSendToPartner(caseData.id, partnerNotes, []);
      setShowPartnerPanel(false);
      setPartnerNotes('');
    } finally {
      setIsSubmittingPartner(false);
    }
  };

  const handleResSubmit = async () => {
    if (!complaintComment.trim()) {
      toast.error("Please enter a resolution comment.");
      return;
    }
    if (!complaintResType) {
      toast.error("Please select a resolution type.");
      return;
    }
    setIsSubmittingRes(true);
    try {
      await onTLCommentComplaint(caseData.id, complaintComment, complaintResType);
      setShowResPanel(false);
      setComplaintComment('');
      setComplaintResType('');
    } finally {
      setIsSubmittingRes(false);
    }
  };

  const handleMarkContacted = async (status: 'contacted' | 'attempted') => {
    try {
      await onMarkPatientContactedTT(caseData.id, caseData.crmType === 'complaint' ? 'complaint' : 'tabby_tamara', status);
    } catch (err: any) {
      toast.error("Error setting contacting status: " + err.message);
    }
  };

  const handleInquiryForward = async () => {
    try {
      await onMarkInquirySent(caseData.id);
    } catch (err: any) {
      toast.error("Error forwarding inquiry: " + err.message);
    }
  };

  const handleEditTrigger = () => {
    onEditItem({
      type: caseData.crmType === 'inquiry' ? 'inquiry' : caseData.crmType === 'complaint' ? 'tt_complaint' : 'tt_request',
      id: caseData.id,
      data: caseData.raw,
    });
  };

  const handleRemoveCase = async () => {
    if (confirm("Are you sure you want to permanently delete this case record?")) {
      await onDeleteCase(caseData.id, caseData.crmType);
      onClose();
    }
  };

  const canEdit = currentUser && (
    currentUser.role === "tl" || 
    caseData.raw.agentName?.toLowerCase() === currentUser.name?.toLowerCase() ||
    caseData.raw.submittedByName?.toLowerCase() === currentUser.name?.toLowerCase()
  );

  return (
    <div id="case-crm-detail-drawer" className="h-full flex flex-col bg-[#09090c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Drawer Header Toolbar */}
      <div className="bg-[#121216] border-b border-white/5 p-4 flex items-center justify-between z-10 shrink-0">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#2effc3] bg-[#00e3a5]/5 px-2 py-0.5 rounded border border-[#00e3a5]/10 shrink-0">
            {caseData.crmType === 'inquiry' ? 'Inquiry' : caseData.crmType === 'complaint' ? 'Complaint' : 'Tabby/Tamara'}
          </span>
          <h2 className="text-sm font-black text-slate-100 font-mono mt-1.5 flex items-center gap-1">
            {caseData.referenceId}
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs navigation panel */}
      <div className="bg-[#0b0b0f] border-b border-white/5 px-2 flex justify-start shrink-0 z-10">
        {[
          { id: 'overview', label: 'Overview', icon: <Briefcase className="w-3.5 h-3.5" /> },
          { id: 'conversation', label: 'Timeline & Replies', icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { id: 'attachments', label: 'Files Vault', icon: <Paperclip className="w-3.5 h-3.5" /> },
          { id: 'timeline', label: 'History Logs', icon: <Activity className="w-3.5 h-3.5" /> },
        ].map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-3 border-b-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "border-[#2effc3] text-[#2effc3] bg-white/[0.01]"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrolling dynamic content container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 min-h-0">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fade-in" id="drawer-tab-overview">
            
            {/* Action Bar */}
            <div className="flex flex-wrap gap-2 bg-[#121216] border border-white/5 p-3 rounded-xl">
              <button 
                onClick={handleCopyClipboard}
                className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Log
              </button>

              {canEdit && (
                <button 
                  onClick={handleEditTrigger}
                  className="px-3 py-1.5 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 bg-indigo-500/5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Case
                </button>
              )}

              {isTLOreSupport && (
                <button 
                  onClick={handleRemoveCase}
                  className="px-3 py-1.5 text-rose-400 hover:text-rose-300 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>

            {/* Quick Actions Panel depending on request parameters */}
            {/* Inquiry Partner Forwarding */}
            {caseData.crmType === "inquiry" && isTLOreSupport && caseData.status === "submitted" && (
              <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Unanswered inquiry pending forward</span>
                </div>
                <p className="text-[11px] hover:text-orange-300 cursor-pointer text-slate-300 leading-normal">
                  Send this inquiry officially to the clinic partner for evaluation. Marking it 'Sent' alerts the operations team.
                </p>
                <button
                  onClick={handleInquiryForward}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Mark Sent to Partner
                </button>
              </div>
            )}

            {/* Tabby/Tamara Forwarding */}
            {caseData.crmType === "tabby_tamara" && isTLOreSupport && caseData.status === "not_confirmed" && !showPartnerPanel && (
              <button
                onClick={() => setShowPartnerPanel(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 border border-emerald-500/20"
              >
                <ChevronsRight className="w-4 h-4 animate-pulse" /> Confirm & Send to Fintech Partner
              </button>
            )}

            {/* Custom Send to Partner Widget */}
            {showPartnerPanel && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Fintech Forward Config</span>
                  <button onClick={() => setShowPartnerPanel(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Partner Audit Comments</label>
                  <textarea
                    rows={3}
                    placeholder="Enter notes/resolutions to dispatch to partner or internal log history..."
                    value={partnerNotes}
                    onChange={(e) => setPartnerNotes(e.target.value)}
                    className="w-full bg-[#1b1b22] border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={handlePartnerSubmit}
                  disabled={isSubmittingPartner}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-slate-950 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingPartner ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Submit Case & Mark Confirmed
                </button>
              </div>
            )}

            {/* Complaint Resolution Handling */}
            {caseData.crmType === "complaint" && isTLOreSupport && caseData.status === "submitted" && !showResPanel && (
              <button
                onClick={() => setShowResPanel(true)}
                className="w-full bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/10 border border-rose-500/20"
              >
                <CheckCircle className="w-4 h-4" /> Formulate Complaint Resolution
              </button>
            )}

            {/* Complaint Resolution Widget */}
            {showResPanel && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Complaint Solution Broker</span>
                  <button onClick={() => setShowResPanel(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Resolution Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "apology", label: "🙏 Apology" },
                      { value: "refund", label: "💰 Refund" },
                      { value: "replacement", label: "🔄 Replacement" },
                      { value: "escalated", label: "⬆️ Escalated" },
                      { value: "no_action", label: "🚫 No Action" },
                      { value: "follow_up", label: "📞 Follow Up" }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setComplaintResType(opt.value)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-left transition-all ${
                          complaintResType === opt.value
                            ? "bg-rose-500 text-slate-950 font-bold"
                            : "bg-[#1b1b22] hover:bg-white/[0.04] text-slate-300 border border-white/5"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Resolution Instructions for Agent</label>
                  <textarea
                    rows={3}
                    placeholder="Enter instructions explaining how the agent can close this issue with the patient..."
                    value={complaintComment}
                    onChange={(e) => setComplaintComment(e.target.value)}
                    className="w-full bg-[#1b1b22] border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  onClick={handleResSubmit}
                  disabled={isSubmittingRes}
                  className="w-full bg-rose-500 hover:bg-rose-400 disabled:bg-rose-500/50 text-slate-950 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingRes ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Resolution (Status: Need Contact)
                </button>
              </div>
            )}

            {/* Complaint Closure & Reopening for TL / Agent who needs contact */}
            {caseData.crmType === "complaint" && caseData.status === "need_contact" && (
              <div className="bg-[#121216] border border-white/5 p-4 rounded-xl space-y-2.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Contact Required Status</span>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  The Team Leader has registered a resolution: <span className="text-rose-400 font-extrabold uppercase">{caseData.raw.tlResolutionType || 'Follow Up'}</span>. 
                  Please contact the client and log the dial/contact state:
                </p>
                
                {caseData.raw.tlComment && (
                  <div className="bg-black/30 border border-white/5 p-3 rounded-lg text-xs italic text-slate-400">
                    "{caseData.raw.tlComment}"
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => handleMarkContacted('contacted')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    🚀 Got Contact
                  </button>
                  <button
                    onClick={() => handleMarkContacted('attempted')}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    ⏰ Attempted Dial
                  </button>
                </div>
              </div>
            )}

            {/* Close / Reopen Complaint (TL exclusive) */}
            {caseData.crmType === "complaint" && isTLOreSupport && (
              <div className="flex gap-2.5 w-full">
                {caseData.status !== "closed" ? (
                  <button
                    onClick={() => onCloseComplaint(caseData.id)}
                    className="flex-1 bg-rose-700 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider py-2 border border-rose-600/30 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Close Complaint File
                  </button>
                ) : (
                  <button
                    onClick={() => onReopenComplaint(caseData.id)}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider py-2 border border-amber-500/30 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" /> Reopen Complaint Ticket
                  </button>
                )}
              </div>
            )}

            {/* Case Parameters Structured Grid */}
            <div className="bg-[#121216] border border-white/5 p-4 rounded-xl space-y-3.5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2">Fields & Parameters</h3>
              
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2.5">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">State status</p>
                  <span className="text-xs font-bold text-slate-200 uppercase truncate">
                    {caseData.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Clinic Center</p>
                  <span className="text-xs font-bold text-slate-250 truncate block" title={caseData.clinicName}>
                    {caseData.clinicName}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Phone Dial</p>
                  <span className="text-xs font-bold text-slate-200 block truncate leading-relaxed">
                    {caseData.phoneNumber || "No database dial"}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Dialer Submitter</p>
                  <span className="text-xs font-bold text-slate-250 block truncate">
                    {caseData.agentName}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Date Logged</p>
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {new Date(caseData.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {caseData.raw.priceWithoutTax && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Trx value</p>
                    <span className="text-xs font-black text-slate-200 block truncate">
                      {caseData.raw.priceWithoutTax} AED
                    </span>
                  </div>
                )}
                
                {caseData.raw.platform && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Platform</p>
                    <span className="text-xs font-black text-[#00e3a5] block truncate">
                      {caseData.raw.platform === "tabby" ? "Tabby" : 
                       caseData.raw.platform === "tamara" ? "Tamara" : 
                       caseData.raw.platform === "one_time_payment" ? "One Time Paid" : 
                       caseData.raw.platform?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Original description details log */}
            <div className="bg-[#121216]/50 border border-white/5 p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Description Payload</span>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-medium break-words max-h-48 overflow-y-auto pr-1">
                {caseData.subject || "No content summary entered."}
              </p>
            </div>

            {/* Dynamic Assignment Control Widget */}
            <AssignmentControl
              caseData={caseData}
              currentUser={currentUser}
              isTLOreSupport={isTLOreSupport}
              onAssign={onAssignCase}
              onClaim={onClaimCase}
            />
          </div>
        )}

        {/* TAB 2: CONVERSATION */}
        {activeTab === 'conversation' && (
          <div className="animate-fade-in" id="drawer-tab-conversation">
            <CaseConversation 
              caseData={caseData} 
              currentUser={currentUser} 
              addSystemNotification={addSystemNotification} 
            />
          </div>
        )}

        {/* TAB 3: ATTACHMENTS */}
        {activeTab === 'attachments' && (
          <div className="animate-fade-in" id="drawer-tab-attachments">
            <CaseAttachments caseData={caseData} />
          </div>
        )}

        {/* TAB 4: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="animate-fade-in" id="drawer-tab-timeline">
            <CaseActivityTimeline caseData={caseData} />
          </div>
        )}
      </div>
    </div>
  );
};
