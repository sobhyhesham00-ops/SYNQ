import React from "react";
import { 
  AlertTriangle, 
  PenTool, 
  CheckCircle2, 
  Copy, 
  Trash2, 
  Pencil,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { CopyWrap } from "./CopyWrap";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { RequestReplyThread } from "./RequestReplyThread";
import { CaseTimeline } from "./CaseTimeline";
import { SlideToConfirm } from "./SlideToConfirm";
import { TabbyTamaraComplaint, User as UserType, INITIAL_AGENTS } from "../types";
import { 
  getClinicLabel,  
  formatCaseRef, 
  normalizePhone, 
  copyToClipboard,
  getAgentLOB
} from "../utils";

const compStatusLabels: Record<string, string> = {
  pending_tl: "⏳ Pending TL review",
  need_contact: "📞 Pending contact",
  closed: "✅ Resolved & Closed"
};

interface ComplaintCardProps {
  comp: TabbyTamaraComplaint;
  currentUser: UserType | null;
  isTLOreSupport: boolean;
  isSuperAdmin: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  activeComplaintHandlingId?: string | null;
  setActiveComplaintHandlingId?: (id: string | null) => void;
  tlComplaintResolutionType?: string;
  setTlComplaintResolutionType?: (type: string) => void;
  tlComplaintComment?: string;
  setTlComplaintComment?: (comment: string) => void;
  handleTLCommentComplaint?: (id: string, comment: string, resolutionType: string) => void;
  handleToggleContactComplaint?: (id: string, status: "not_contacted" | "contacted") => void;
  handleDeleteComplaint?: (id: string) => void;
  handleAssignRecord?: (
    recordId: string,
    collectionName: string,
    toAgent: string,
    recordType: string,
    fromAgent: string
  ) => void;
  addSystemNotification?: any;
  canEditItem?: (createdAt: string | number | Date) => boolean;
  getRemainingEditTime?: (createdAt: string | number | Date) => string;
  setEditingItem?: (item: any) => void;
  getElapsedTimerString?: (confirmedAtISO: string, contactedAtISO?: string) => string;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  comp,
  currentUser,
  isTLOreSupport,
  isSuperAdmin,
  isExpanded,
  onToggle,
  activeComplaintHandlingId,
  setActiveComplaintHandlingId = () => {},
  tlComplaintResolutionType,
  setTlComplaintResolutionType = () => {},
  tlComplaintComment,
  setTlComplaintComment = () => {},
  handleTLCommentComplaint = () => {},
  handleToggleContactComplaint = () => {},
  handleDeleteComplaint = () => {},
  handleAssignRecord = () => {},
  addSystemNotification,
  canEditItem = () => false,
  getRemainingEditTime = () => "",
  setEditingItem = () => {},
  getElapsedTimerString = () => ""
}) => {
  const isPendingTL = comp.status === "pending_tl";
  const isNeedContact = comp.status === "need_contact";
  const isClosed = comp.status === "closed";

  const compAgeMs = Date.now() - new Date(comp.createdAt).getTime();
  const compAgeHours = compAgeMs / 3600000;
  const compAgeLabel = compAgeHours < 1
    ? `${Math.max(1, Math.floor(compAgeMs / 60000))}m`
    : `${Math.floor(compAgeHours)}h`;

  const STATUS_BORDER_COLORS: Record<string, string> = {
    pending_tl: "border-l-amber-500",
    need_contact: "border-l-rose-500",
    closed: "border-l-emerald-500"
  };
  const borderLeftColor = STATUS_BORDER_COLORS[comp.status] || "border-l-slate-700";

  return (
    <div
      onClick={() => {
        if (!isExpanded) {
          onToggle();
        }
      }}
      className={`p-5 bg-white/5 border border-white/[0.08] rounded-[24px] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300 relative flex flex-col w-full overflow-hidden shadow-sm ${
        isExpanded ? "shadow-md ring-1 ring-white/10 space-y-4" : "cursor-pointer hover:shadow-md"
      }`}
    >
      <div className={`absolute top-0 bottom-0 left-0 w-[5px] ${borderLeftColor.replace('border-l-', 'bg-')}`} />
      
      {/* Unexpanded / Header State */}
      <div 
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full ${isExpanded ? "border-b border-white/5 pb-3 cursor-pointer hover:opacity-80" : ""}`}
        onClick={(e) => {
          if (isExpanded) {
            e.stopPropagation();
            onToggle();
          }
        }}
      >
        <div className="flex flex-col space-y-1">
          {/* Row 1: Agent & Badges */}
          <div className="flex items-center gap-2 flex-wrap text-left">
            <span
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(comp.agentName || "", "Agent name copied!");
              }}
              className="text-xs font-bold text-slate-100 uppercase tracking-wide cursor-pointer hover:text-indigo-300 transition-colors shrink-0"
            >
              {comp.agentName}
            </span>
            <span className="text-[10px] text-slate-400 lowercase tracking-wide bg-white/5 border border-white/5 px-2 py-0.5 rounded font-sans shrink-0">
              {getAgentLOB(comp.agentName)}
            </span>
            <span className="font-mono text-[10px] text-slate-500 bg-black/20 px-1.5 py-0.5 rounded shrink-0">
              {formatCaseRef(comp.id, "tt_complaint", comp.createdAt, comp.caseRef)}
            </span>
            <span className="text-[9px] text-slate-500 font-mono shrink-0">
              {new Date(comp.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Row 2: Patient Name, Clinic, Phone */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 flex-wrap">
            {comp.patientName && <span className="font-bold">{comp.patientName}</span>}
            {comp.clinicName && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-xs sm:text-[13px] font-black font-sans text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md tracking-wide">
                  {getClinicLabel(comp.clinicName)}
                </span>
              </>
            )}
            {comp.phoneNumber && <span>• {comp.phoneNumber}</span>}
            
            <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 border border-white/10 rounded font-sans font-bold flex items-center gap-1 shrink-0 ml-2">
               📁 File: {comp.fileNumber || "N/A"}
            </span>
          </div>
        </div>

        {/* Right side: Status, Badges, Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const text = `Complaint: ${comp.patientName} - ${getClinicLabel(comp.clinicName)} - ${comp.phoneNumber}`;
              copyToClipboard(text, 'Complaint details copied!');
            }}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer hidden sm:flex"
            title="Copy Details"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>
          {(comp.assignedToName || comp.assignedTo) && (
            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 max-w-[100px] truncate leading-none">
              📌 {comp.assignedToName || comp.assignedTo}
            </span>
          )}
          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md font-sans leading-none ${
            isPendingTL
              ? "bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-pulse"
              : isNeedContact
                ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse"
                : isClosed
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-slate-700 text-slate-300"
          }`}>
            {compStatusLabels[comp.status] || comp.status}
          </span>
          <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg shrink-0 flex items-center gap-1 ${isClosed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-700 text-slate-400 border-white/10"}`}>
            ⏱ {compAgeLabel} open
          </span>
          <div className="text-slate-400 hover:text-indigo-400 p-1 rounded-md transition-all shrink-0 ml-1 flex items-center justify-center">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
      </div>

      {/* EXPANDABLE DETAIL BLOCK */}
      {isExpanded && (
        <div className="w-full overflow-hidden transition-all duration-300 flex flex-col text-left space-y-4">
          {/* Patient Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs">
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                SUBMITTING AGENT
              </span>
              <span className="text-slate-200 font-bold font-sans">
                <CopyWrap text={comp.agentName || ""} label="Agent Name">
                  👤 {comp.agentName}
                </CopyWrap>
              </span>
            </div>

            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                CUSTOMER TYPE
              </span>
              <span className="text-slate-200 font-bold font-sans">
                {comp.isOldCustomer ? "👴 Old Customer" : "🆕 New Customer"}
              </span>
            </div>

            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                CONTACT MOBILE
              </span>
              <span className="text-slate-200 font-bold font-mono">
                <CopyWrap text={normalizePhone(comp.phoneNumber || "")} label="Phone Number">
                  📞 {comp.phoneNumber}
                </CopyWrap>
              </span>
            </div>

            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                FILE NUMBER
              </span>
              <span className="text-slate-200 font-bold font-mono">
                📁 {comp.fileNumber || "N/A"}
              </span>
            </div>
          </div>

          {/* Patient ID Code Block if New Customer */}
          {!comp.isOldCustomer && comp.idNumber && (
            <div className="bg-[#1e1e1e]/60 border border-white/5 p-3.5 rounded-xl text-xs flex justify-between items-center">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5">
                  ID NUMBER (NEW CUSTOMER REQUIREMENT)
                </span>
                <span className="text-slate-200 font-mono font-bold text-sm">
                  {comp.idNumber}
                </span>
              </div>
              <CopyWrap text={comp.idNumber} label="ID Number">
                <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 border border-white/5 transition-all cursor-pointer">
                  Copy ID
                </button>
              </CopyWrap>
            </div>
          )}

          {/* COMPLAINT ISSUE DESCRIPTION */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
              🚨 Patient Complaint Details
            </span>
            <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-xs text-slate-200 leading-relaxed italic">
              <p className="whitespace-pre-line">
                "{comp.complaintDetails}"
              </p>
            </div>
          </div>

          {/* PHOTO & LINK ATTACHMENTS */}
          {((comp.photos && comp.photos.length > 0) || comp.imageUrl || (comp.links && comp.links.length > 0)) && (
            <div className="space-y-3 bg-[#1e1e1e]/20 border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
                📎 Uploaded Attachments & Proofs
              </span>
              <div className="grid grid-cols-1 gap-4">
                <AttachmentsDisplay
                  photos={[
                    ...(comp.photos || []),
                    ...(comp.imageUrl ? [comp.imageUrl] : []),
                    ...(comp.screenshot ? [comp.screenshot] : [])
                  ]}
                  links={comp.links || []}
                />
              </div>
            </div>
          )}

          {/* TEAM LEADER RESOLUTION DISPLAY */}
          {comp.tlComment && (
            <div className="border border-rose-500/20 bg-rose-500/[0.02] p-5 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 text-sm font-bold">📋</span>
                  <p className="text-[10px] text-rose-400 uppercase tracking-wider font-extrabold font-sans">
                    Team Leader Answer ({comp.tlName || "TL"})
                  </p>
                </div>
                {comp.tlResolutionType && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 rounded-md text-[9px] font-black uppercase text-rose-300 tracking-wider font-sans">
                    {comp.tlResolutionType === "refund" ? "💳 Refund" :
                     comp.tlResolutionType === "replacement" ? "🔄 Replacement" :
                     comp.tlResolutionType === "apology" ? "✉ apology" :
                     comp.tlResolutionType === "escalated" ? "⬆ Escalated" :
                     comp.tlResolutionType === "no_action" ? "🚫 No Action" :
                     comp.tlResolutionType === "follow_up" ? "⏳ Follow Up Required" : comp.tlResolutionType}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-semibold whitespace-pre-line font-sans">
                {comp.tlComment}
              </p>
              {comp.tlHandledAt && (
                <p className="text-[9px] text-slate-500 mt-1 font-mono">
                  Updated by {comp.tlHandledBy || "TL"} at {new Date(comp.tlHandledAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* CASE TIMERS AND SLA ACCENTS */}
          {isNeedContact && (
            <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between text-xs font-sans">
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Reviewed on:
                </p>
                <p className="text-[10px] text-slate-300 font-mono">
                  {comp.commentedAt
                    ? new Date(comp.commentedAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>

              <div className="text-right space-y-0.5 font-sans">
                <p className="text-[10px] text-rose-400 uppercase font-black tracking-wider">
                  SLA Timer on Agent:
                </p>
                <p className="font-mono text-xs font-black px-3 py-1 rounded text-rose-400 bg-rose-500/10 animate-pulse border border-rose-500/20">
                  {getElapsedTimerString(
                    comp.commentedAt || comp.createdAt
                  )}
                </p>
              </div>
            </div>
          )}

          {isClosed && (
            <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between text-xs font-sans">
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Closed at:
                </p>
                <p className="text-[10px] text-slate-300 font-mono">
                  {comp.closedAt
                    ? new Date(comp.closedAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>

              <div className="text-right space-y-0.5 font-sans">
                <p className="text-[10px] text-emerald-400 uppercase font-black tracking-wider">
                  Completion Resolution SLA:
                </p>
                <p className="font-mono text-xs font-black px-3 py-1 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  {getElapsedTimerString(
                    comp.createdAt,
                    comp.closedAt,
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ASSIGN TO AGENT SELECTION CONTROL */}
          <div className="border bg-slate-800/20 border-white/5 p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap">
            <div className="text-left font-sans">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5">
                ASSIGNED WORKER
              </span>
              <span className="text-xs text-slate-200 font-bold flex items-center gap-1">
                📌 {(comp.assignedToName || comp.assignedTo) ? `Assigned to ${comp.assignedToName || comp.assignedTo}` : "Unassigned Case"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="bg-slate-800 border border-slate-600/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-[#10b981] cursor-pointer font-bold font-sans"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAssignRecord(
                      comp.id,
                      "tt_complaints",
                      e.target.value,
                      "Complaint",
                      comp.agentName || "Unknown"
                    );
                    e.target.value = "";
                  }
                }}
              >
                <option value="">📌 Assign to...</option>
                {INITIAL_AGENTS.filter(
                  (a) => a !== comp.agentName
                ).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC TL RESOLUTION FORM */}
          {activeComplaintHandlingId === comp.id && isTLOreSupport && (
            <div className="p-5 bg-rose-500/[0.02] border border-rose-500/20 rounded-xl space-y-4 animate-fade-in mt-1 text-left w-full">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5" /> TL Resolution Panel
              </p>

              {/* Resolution Type Buttons */}
              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-2">
                  Resolution Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { value: "refund", label: "💳 Refund" },
                    { value: "replacement", label: "🔄 Replacement" },
                    { value: "apology", label: "✉ apology" },
                    { value: "escalated", label: "⬆ Escalated" },
                    { value: "no_action", label: "🚫 No Action" },
                    { value: "follow_up", label: "⏳ Follow Up Required" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTlComplaintResolutionType(opt.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left cursor-pointer ${
                        tlComplaintResolutionType === opt.value
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                          : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TL Comment text Area */}
              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-2">
                  Resolution Details / Instructions for Agent <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Explain the resolution, what action the agent must take, and any instructions for the patient contact..."
                  value={tlComplaintComment}
                  onChange={(e) => setTlComplaintComment(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-slate-100 font-sans min-h-[100px] resize-none focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveComplaintHandlingId(null)}
                  className="px-4 py-2 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!tlComplaintComment.trim() || !tlComplaintResolutionType}
                  onClick={() => handleTLCommentComplaint(comp.id, tlComplaintComment, tlComplaintResolutionType)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit Resolution
                </button>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS ROW */}
          <div className="flex flex-wrap gap-2 items-center justify-end pt-4 border-t border-white/5 font-sans">
            {/* Copy Complete Request info */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const photoLines = (comp.photos || []).length > 0
                  ? `Attachments: ${comp.photos.length} photo(s) attached`
                  : "";
                const screenshotLine = (comp.screenshot || comp.imageUrl)
                  ? `Screenshot: 1 image attached`
                  : "";
                const linkLines = (comp.links || []).length > 0
                  ? `Links:\n${(comp.links || []).join("\n")}`
                  : "";

                const text = [
                  ` Complaint`,
                  `Ref: ${formatCaseRef(comp.id, "tt_complaint", comp.createdAt, comp.caseRef)}`,
                  `Patient: ${comp.patientName} | File: ${comp.fileNumber || "N/A"}`,
                  `Phone: ${normalizePhone(comp.phoneNumber || "")}`,
                  `ID Type: ${comp.idNumber || (comp.isOldCustomer ? "Old Customer" : "New Customer")}`,
                  `Clinic: ${getClinicLabel(comp.clinicName)}`,
                  `Status: ${comp.status}`,
                  `Complaint: ${comp.complaintDetails}`,
                  comp.tlComment ? `TL Comment: ${comp.tlComment}` : "",
                  photoLines, screenshotLine, linkLines,
                ].filter(Boolean).join("\n");

                copyToClipboard(text, "Complaint details copied — including attachments info!");
              }}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-100 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-auto"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy details
            </button>

            {/* DELETE Option */}
            {isSuperAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteComplaint(comp.id);
                }}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/10 rounded-lg text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-2"
                title="Delete Complaint"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}

            {canEditItem(comp.createdAt) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingItem({
                    type: "tt_complaint",
                    id: comp.id,
                    data: { ...comp },
                  });
                }}
                className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title={`Edit complaint (${getRemainingEditTime(comp.createdAt)})`}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit ({getRemainingEditTime(comp.createdAt)})
              </button>
            )}

            {/* TL Commentary Trigger Button */}
            {isTLOreSupport && isPendingTL && activeComplaintHandlingId !== comp.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveComplaintHandlingId(comp.id);
                  setTlComplaintComment("");
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-sans font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                Reply & Review
              </button>
            )}

            {/* Agent or TL Mark Contacted Closed Case button */}
            {(isNeedContact || (isTLOreSupport && !isClosed)) && (
              <div className="w-full sm:w-64" onClick={(e) => e.stopPropagation()}>
                <SlideToConfirm
                  label={isNeedContact ? "Slide to Close Case" : "Slide to Force Close"}
                  confirmedLabel="Closed!"
                  colorClass="from-emerald-500 to-teal-500"
                  onConfirm={() => handleToggleContactComplaint(comp.id, "contacted")}
                />
              </div>
            )}

            {/* Reopen Closed Case if done in error */}
            {["agent", "sme"].includes(currentUser?.role as string) && isClosed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleContactComplaint(comp.id, "not_contacted");
                }}
                className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold font-sans text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 hover:brightness-110"
              >
                Reopen Case
              </button>
            )}
          </div>

          {/* THREAD OF DISCUSSIONS & REPLIES */}
          <div className="w-full mt-4 pt-4 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
            <RequestReplyThread
              request={comp}
              currentUser={currentUser}
              collectionName="tt_complaints"
              addSystemNotification={addSystemNotification}
              requestType="Complaint"
              requestAgentName={comp.agentName}
            />
          </div>

          {/* Case Activity Audit Trail */}
          <div className="w-full mt-4 pt-4 border-t border-white/5 space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
              Case Activity Timeline
            </h4>
            <CaseTimeline entityType="tt_complaint" entityId={comp.id} />
          </div>
        </div>
      )}
    </div>
  );
};
