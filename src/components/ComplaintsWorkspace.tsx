import React from "react";
import { 
  AlertTriangle, 
  Search, 
  Calendar, 
  History, 
  PenTool, 
  CheckCircle2, 
  Copy, 
  Trash2, 
  Pencil,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { CopyWrap } from "./CopyWrap";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { RequestReplyThread } from "./RequestReplyThread";
import { SlideToConfirm } from "./SlideToConfirm";
import { TabbyTamaraComplaint, User as UserType, INITIAL_AGENTS } from "../types";
import { 
  formatCaseRef, 
  normalizePhone, 
  copyToClipboard
} from "../utils";

const compStatusLabels: Record<string, string> = {
  pending_tl: "⏳ Pending TL review",
  need_contact: "📞 Pending contact",
  closed: "✅ Resolved & Closed"
};

interface ComplaintsWorkspaceProps {
  tabbyTamaraComplaints: TabbyTamaraComplaint[];
  currentUser: UserType | null;
  isTLOreSupport: boolean;
  isSuperAdmin: boolean;
  complaintSearch: string;
  selectedComplaintId: string | null;
  setSelectedComplaintId: (id: string | null) => void;
  complaintListFilter: "all" | "pending_tl" | "need_contact" | "closed";
  compDateFilter: string;
  tcFilterClinic: string;
  
  // Handling action callbacks
  activeComplaintHandlingId: string | null;
  setActiveComplaintHandlingId: (id: string | null) => void;
  tlComplaintResolutionType: string;
  setTlComplaintResolutionType: (type: string) => void;
  tlComplaintComment: string;
  setTlComplaintComment: (comment: string) => void;
  
  handleTLCommentComplaint: (id: string, comment: string, resolutionType: string) => void;
  handleToggleContactComplaint: (id: string, status: "not_contacted" | "contacted") => void;
  handleDeleteComplaint: (id: string) => void;
  handleAssignRecord: (
    recordId: string,
    collectionName: string,
    toAgent: string,
    recordType: string,
    fromAgent: string
  ) => void;
  addSystemNotification: any;
  canEditItem: (createdAt: string | number | Date) => boolean;
  getRemainingEditTime: (createdAt: string | number | Date) => string;
  setEditingItem: (item: any) => void;
  getElapsedTimerString: (confirmedAtISO: string, contactedAtISO?: string) => string;
}

export const ComplaintsWorkspace: React.FC<ComplaintsWorkspaceProps> = ({
  tabbyTamaraComplaints,
  currentUser,
  isTLOreSupport,
  isSuperAdmin,
  complaintSearch,
  selectedComplaintId,
  setSelectedComplaintId,
  complaintListFilter,
  compDateFilter,
  tcFilterClinic,
  activeComplaintHandlingId,
  setActiveComplaintHandlingId,
  tlComplaintResolutionType,
  setTlComplaintResolutionType,
  tlComplaintComment,
  setTlComplaintComment,
  handleTLCommentComplaint,
  handleToggleContactComplaint,
  handleDeleteComplaint,
  handleAssignRecord,
  addSystemNotification,
  canEditItem,
  getRemainingEditTime,
  setEditingItem,
  getElapsedTimerString
}) => {
  const filteredComps = tabbyTamaraComplaints.filter((c) => {
    const isMyComplaint =
      c.agentName?.toLowerCase() ===
      currentUser?.name?.toLowerCase();
    if (!isTLOreSupport && !isMyComplaint)
      return false;

    const sq = complaintSearch.toLowerCase();
    const matchesSearch =
      !sq ||
      (c.patientName || "")
        .toLowerCase()
        .includes(sq) ||
      (c.phoneNumber || "")
        .toLowerCase()
        .includes(sq.replace(/\D/g, "")) ||
      (c.clinicName || "")
        .toLowerCase()
        .includes(sq) ||
      (c.agentName || "")
        .toLowerCase()
        .includes(sq) ||
      (c.complaintDetails || "")
        .toLowerCase()
        .includes(sq);

    const matchesStatus =
      complaintListFilter === "all" ||
      c.status === complaintListFilter;

    const matchesProvider =
      tcFilterClinic === "all" ||
      (c.clinicName &&
        c.clinicName?.toLowerCase() ===
          tcFilterClinic.toLowerCase());

    const matchesDate =
      !compDateFilter ||
      (c.createdAt &&
        c.createdAt.startsWith(
          compDateFilter,
        ));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProvider &&
      matchesDate
    );
  });

  if (filteredComps.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-white/10 backdrop-blur-md/[0.02] space-y-2 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
          <AlertTriangle className="w-6 h-6 text-pink-500" />
        </div>
        <p className="text-sm font-bold text-slate-100 font-sans">
          No complaints matching criteria.
        </p>
        <p className="text-xs text-slate-400 font-sans">
          Logged complaints, issues and dispute timelines will load here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1 animate-fade-in font-sans">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold pl-1 text-left">
        📁 {filteredComps.length} Complaints Found
      </p>

      {filteredComps.map((comp) => {
        const isExpanded = selectedComplaintId === comp.id;
        const isPendingTL = comp.status === "pending_tl";
        const isNeedContact = comp.status === "need_contact";
        const isClosed = comp.status === "closed";

        const compAgeMs = Date.now() - new Date(comp.createdAt).getTime();
        const compAgeHours = compAgeMs / 3600000;
        const compAgeLabel = compAgeHours < 1
          ? `${Math.max(1, Math.floor(compAgeMs / 60000))}m open`
          : `${Math.floor(compAgeHours)}h open`;

        return (
          <div
            key={comp.id}
            onClick={() => {
              if (!isExpanded) {
                setSelectedComplaintId(comp.id);
              }
            }}
            className={`p-5 bg-[#18181c] border border-slate-700/60 rounded-2xl transition-all relative flex flex-col gap-4 overflow-hidden ${
              !isExpanded
                ? "hover:bg-white/[0.04] cursor-pointer shadow-md"
                : "shadow-xl ring-1 ring-indigo-500/15"
            }`}
          >
            {/* Top Accent line */}
            <div className={`absolute top-0 right-0 left-0 h-1.5 flex ${
              isNeedContact ? "bg-rose-500 animate-pulse" :
              isPendingTL ? "bg-amber-500" :
              isClosed ? "bg-emerald-500" : "bg-slate-500"
            }`} />

            {/* HEADER ROW */}
            <div 
              onClick={(e) => {
                if (isExpanded) {
                  e.stopPropagation();
                  setSelectedComplaintId(null);
                }
              }}
              className={`flex items-center justify-between gap-4 flex-wrap pt-1 ${isExpanded ? "cursor-pointer hover:opacity-85" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-black text-indigo-400 font-mono">
                  {formatCaseRef(comp.id, "tt_complaint", comp.createdAt, comp.caseRef)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  Reg Date: {new Date(comp.createdAt).toLocaleString()}
                </span>
                {comp.clinicName && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300 font-sans">
                    🏰 {comp.clinicName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black/30 border border-white/5 text-[9px] font-bold text-slate-300 font-mono rounded">
                  ⏱ {compAgeLabel}
                </span>
                <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md font-sans border ${
                  isPendingTL ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                  isNeedContact ? "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse" :
                  isClosed ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ""
                }`}>
                  {compStatusLabels[comp.status] || comp.status}
                </span>
                
                <div 
                  className="text-slate-400 hover:text-indigo-400 p-1 rounded-md transition-all shrink-0 ml-1 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedComplaintId(isExpanded ? null : comp.id);
                  }}
                >
                  {isExpanded ? <ChevronUp className="w-4.5 h-4.5 text-indigo-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
                </div>
              </div>
            </div>

            {/* BODY LEVEL INFO: Patient profile */}
            <div className="flex flex-col gap-1.5 text-left" onClick={(e) => {
              if (isExpanded) {
                e.stopPropagation();
              }
            }}>
              <h3 
                className="text-2xl font-black text-slate-100 font-sans tracking-tight cursor-pointer hover:text-amber-100 active:scale-95 transition-all w-fit flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(comp.patientName || "Unknown", "Patient name copied!");
                }}
              >
                {comp.patientName}
                <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold font-sans">
                Case File Code: {comp.fileNumber || "N/A"}
              </p>
            </div>

            {/* EXPANDED CONTENT UNDERNEATH */}
            {isExpanded && (
              <div className="flex flex-col gap-4 border-t border-white/5 pt-4 w-full overflow-hidden transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                {/* Patient Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs text-left">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1">
                      SUBMITTING AGENT
                    </span>
                    <span className="text-slate-200 font-bold font-sans">
                      <CopyWrap text={comp.agentName || ""} label="Agent Name">
                        👤 {comp.agentName}
                      </CopyWrap>
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1">
                      CUSTOMER TYPE
                    </span>
                    <span className="text-slate-200 font-bold font-sans">
                      {comp.isOldCustomer ? "👴 Old Customer" : "🆕 New Customer"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1">
                      CONTACT MOBILE
                    </span>
                    <span className="text-slate-200 font-bold font-mono">
                      <CopyWrap text={normalizePhone(comp.phoneNumber || "")} label="Phone Number">
                        📞 {comp.phoneNumber}
                      </CopyWrap>
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1">
                      FILE NUMBER
                    </span>
                    <span className="text-slate-200 font-bold font-mono">
                      📁 {comp.fileNumber || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Patient ID Code Block if New Customer */}
                {!comp.isOldCustomer && comp.idNumber && (
                  <div className="bg-[#1e1e1e]/60 border border-white/5 p-3.5 rounded-xl text-xs flex justify-between items-center text-left">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-0.5">
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
                <div className="space-y-2 text-left">
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
                  <div className="space-y-3 bg-[#1e1e1e]/20 border border-white/5 p-4 rounded-xl text-left">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
                      📎 Uploaded Attachments & Proofs
                    </span>
                    <AttachmentsDisplay
                      photos={[
                        ...(comp.photos || []),
                        ...(comp.imageUrl ? [comp.imageUrl] : []),
                        ...(comp.screenshot ? [comp.screenshot] : [])
                      ]}
                      links={comp.links || []}
                    />
                  </div>
                )}

                {/* TEAM LEADER RESOLUTION DISPLAY */}
                {comp.tlComment && (
                  <div className="border border-rose-500/20 bg-rose-500/[0.02] p-5 rounded-xl space-y-3 text-left">
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

                    <div className="text-right space-y-0.5">
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
                      <p className="text-[10px] text-slate-400 tracking-wider font-bold">
                        Closed at:
                      </p>
                      <p className="text-[10px] text-slate-300 font-mono">
                        {comp.closedAt
                          ? new Date(comp.closedAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>

                    <div className="text-right space-y-0.5">
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
                <div className="border bg-slate-800/20 border-white/5 p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap text-left">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5 font-sans">
                      ASSIGNED WORKER
                    </span>
                    <span className="text-xs text-slate-200 font-bold flex items-center gap-1 font-sans">
                      📌 {comp.assignedTo ? `Assigned to ${comp.assignedTo}` : "Unassigned Case"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="bg-slate-800 border border-slate-600/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer font-bold font-sans"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignRecord(
                            comp.id,
                            "tabby_tamara_complaints",
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
                  <div className="p-5 bg-rose-500/[0.02] border border-rose-500/20 rounded-xl space-y-4 text-left">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <PenTool className="w-3.5 h-3.5" /> TL Resolution Panel
                    </p>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-2 font-sans">
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

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-2">
                        Resolution Details / Instructions for Agent <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        placeholder="Explain the resolution, what action the agent must take, and any instructions for the patient contact..."
                        value={tlComplaintComment}
                        onChange={(e) => setTlComplaintComment(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-sans min-h-[100px] resize-none"
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
                  <button
                    onClick={() => {
                      const photoLines = (comp.photos || []).length > 0
                        ? `Attachments: ${comp.photos.length} photo(s) attached`
                        : '';
                      const screenshotLine = (comp.screenshot || comp.imageUrl)
                        ? `Screenshot: 1 image attached`
                        : '';
                      const linkLines = (comp.links || []).length > 0
                        ? `Links:\n${(comp.links || []).join('\n')}`
                        : '';

                      const text = [
                        ` Complaint`,
                        `Ref: ${formatCaseRef(comp.id, "tt_complaint", comp.createdAt, comp.caseRef)}`,
                        `Patient: ${comp.patientName} | File: ${comp.fileNumber || 'N/A'}`,
                        `Phone: ${normalizePhone(comp.phoneNumber || '')}`,
                        `ID Type: ${comp.idNumber || (comp.isOldCustomer ? 'Old Customer' : 'New Customer')}`,
                        `Clinic: ${comp.clinicName}`,
                        `Status: ${comp.status}`,
                        `Complaint: ${comp.complaintDetails}`,
                        comp.tlComment ? `TL Comment: ${comp.tlComment}` : '',
                        photoLines, screenshotLine, linkLines,
                      ].filter(Boolean).join('\n');

                      copyToClipboard(text, 'Complaint details copied — including attachments info!');
                    }}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-100 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-auto"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy details
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDeleteComplaint(comp.id)}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/10 rounded-lg text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-2"
                      title="Delete Complaint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}

                  {canEditItem(comp.createdAt) && (
                    <button
                      onClick={() =>
                        setEditingItem({
                          type: "tt_complaint",
                          id: comp.id,
                          data: { ...comp },
                        })
                      }
                      className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title={`Edit complaint (${getRemainingEditTime(comp.createdAt)})`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}

                  {/* Operational Process Comment Trigger (TL ONLY) */}
                  {isTLOreSupport && isPendingTL && (
                    <button
                      onClick={() => {
                        setActiveComplaintHandlingId(comp.id);
                        setTlComplaintResolutionType("follow_up");
                        setTlComplaintComment("");
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:brightness-110 active:scale-95 text-white text-[10px] font-black rounded-lg shadow-md hover:shadow-rose-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Add TL Resolution
                    </button>
                  )}

                  {/* Agent Contact Slide Confirmation Trigger */}
                  {currentUser?.role === "agent" && isNeedContact && (
                    <div className="w-[180px] shrink-0 font-bold">
                      <SlideToConfirm
                        label="Slide to Contact Patient"
                        confirmedLabel="Closed!"
                        colorClass="from-emerald-500 to-teal-500"
                        onConfirm={() => handleToggleContactComplaint(comp.id, "contacted")}
                      />
                    </div>
                  )}

                  {/* Reopen Closed Case if done in error */}
                  {currentUser?.role === "agent" && isClosed && (
                    <button
                      onClick={() => handleToggleContactComplaint(comp.id, "not_contacted")}
                      className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold font-sans text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 hover:brightness-110"
                    >
                      Reopen Case
                    </button>
                  )}
                </div>

                {/* THREAD OF DISCUSSIONS & REPLIES */}
                <div className="w-full mt-4 pt-4 border-t border-white/5">
                  <RequestReplyThread
                    request={comp}
                    currentUser={currentUser}
                    collectionName="tabby_tamara_complaints"
                    addSystemNotification={addSystemNotification}
                    requestType="Complaint"
                    requestAgentName={comp.agentName}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
