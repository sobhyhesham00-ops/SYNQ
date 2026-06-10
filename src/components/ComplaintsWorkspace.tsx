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
  Pencil
} from "lucide-react";
import { CopyWrap } from "./CopyWrap";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { RequestReplyThread } from "./RequestReplyThread";
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

  const selectedComp = filteredComps.find(c => c.id === selectedComplaintId) || filteredComps[0];

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full min-h-[600px] animate-fade-in font-sans">
      {/* LEFT COLUMN: Compact Row List */}
      <div className="lg:col-span-4 flex flex-col gap-3 max-h-[820px] overflow-y-auto pr-2 custom-scrollbar">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 pl-1 text-left font-sans">
          📁 {filteredComps.length} Complaints Found
        </p>
        {filteredComps.map((comp) => {
          const isSel = selectedComp?.id === comp.id;
          const isPendingTL = comp.status === "pending_tl";
          const isNeedContact = comp.status === "need_contact";
          const isClosed = comp.status === "closed";

          const compAgeMs = Date.now() - new Date(comp.createdAt).getTime();
          const compAgeHours = compAgeMs / 3600000;
          const compAgeLabel = compAgeHours < 1
            ? `${Math.max(1, Math.floor(compAgeMs / 60000))}m`
            : `${Math.floor(compAgeHours)}h`;

          return (
            <div
              key={comp.id}
              id={`list-row-${comp.id}`}
              onClick={() => setSelectedComplaintId(comp.id)}
              className={`p-4 rounded-xl border transition-all text-left cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                isSel
                  ? "bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5"
                  : isNeedContact
                    ? "bg-rose-500/5 hover:bg-rose-500/[0.08] border-rose-500/20"
                    : isPendingTL
                      ? "bg-amber-500/5 hover:bg-amber-500/[0.08] border-amber-500/20"
                      : "bg-[#1e1e1e]/20 hover:bg-[#1e1e1e]/40 border-white/5"
              }`}
            >
              {/* Priority Accent Stripe */}
              <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${
                isNeedContact ? "bg-rose-500 animate-pulse" :
                isPendingTL ? "bg-amber-500" :
                isClosed ? "bg-emerald-500" : "bg-slate-500"
              }`} />

              <div className="flex justify-between items-start gap-2 pl-2 font-sans">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-100 font-sans truncate">
                    {comp.patientName}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate font-semibold font-sans">
                    Case: {comp.fileNumber || "N/A"}
                  </p>
                </div>
                <span className="text-[9px] text-slate-500 font-mono shrink-0 font-bold">
                  {compAgeLabel === "0m" ? "now" : `${compAgeLabel} ago`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pl-2 font-sans">
                {comp.clinicName && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300">
                    {comp.clinicName}
                  </span>
                )}
                <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md font-sans ${
                  isPendingTL
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                    : isNeedContact
                      ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                      : isClosed
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : ""
                }`}>
                  {compStatusLabels[comp.status] || comp.status}
                </span>
              </div>

              <div className="flex justify-between items-center pl-2 pt-2 border-t border-white/5 text-[9px] text-slate-400 font-mono mt-1 font-sans">
                <span className="font-sans font-semibold">📞 {comp.phoneNumber}</span>
                {comp.assignedTo && (
                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 truncate max-w-[80px]">
                    📌 {comp.assignedTo}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT COLUMN: Selected Complaint Detail Panel */}
      <div className="lg:col-span-8 bg-[#1e1e1e]/30 border border-white/5 rounded-2xl p-6 flex flex-col gap-6 animate-fade-in min-h-[600px] text-left">
        {(() => {
          const comp = selectedComp;
          const isPendingTL = comp.status === "pending_tl";
          const isNeedContact = comp.status === "need_contact";
          const isClosed = comp.status === "closed";

          const compAgeMs = Date.now() - new Date(comp.createdAt).getTime();
          const compAgeHours = compAgeMs / 3600000;
          const compAgeLabel = compAgeHours < 1
            ? `${Math.max(1, Math.floor(compAgeMs / 60000))}m open`
            : `${Math.floor(compAgeHours)}h open`;

          return (
            <div className="space-y-6 text-left font-sans">
              {/* Detail Panel Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
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
                  <h3 className="text-lg font-black text-slate-100 font-sans tracking-tight">
                    {comp.patientName}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:self-end">
                  <span className="px-2.5 py-1 rounded bg-black/30 border border-white/5 text-[10px] font-bold text-slate-300 font-mono">
                    ⏱ {compAgeLabel}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-lg font-sans ${
                    isPendingTL ? "bg-amber-500/10 border border-amber-500/30 text-amber-300" :
                    isNeedContact ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse" :
                    isClosed ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : ""
                  }`}>
                    {compStatusLabels[comp.status] || comp.status}
                  </span>
                </div>
              </div>

              {/* Patient Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs">
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
                <div className="bg-[#1e1e1e]/60 border border-white/5 p-3.5 rounded-xl text-xs flex justify-between items-center">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                    🚨 Patient Complaint Details
                  </span>
                </div>
                <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-xs text-slate-200 leading-relaxed italic relative">
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
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
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
              <div className="border bg-slate-800/20 border-white/5 p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                <div className="text-left font-sans">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5 font-sans">
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
                <div className="p-5 bg-rose-500/[0.02] border border-rose-500/20 rounded-xl space-y-4 animate-fade-in mt-1 text-left">
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
                              ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-fade-in"
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
                {/* Copy Complete Request info */}
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

                {/* DELETE Option */}
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
                    Edit ({getRemainingEditTime(comp.createdAt)})
                  </button>
                )}

                {/* TL Commentary Trigger Button */}
                {isTLOreSupport && isPendingTL && activeComplaintHandlingId !== comp.id && (
                  <button
                    onClick={() => {
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
                  <button
                    onClick={() => handleToggleContactComplaint(comp.id, "contacted")}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 active:scale-95 text-black font-extrabold font-sans text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1"
                  >
                    {isNeedContact ? "Mark Case Closed" : "Force Close Case"}
                  </button>
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
                  collectionName="tt_complaints"
                  addSystemNotification={addSystemNotification}
                  requestType="Complaint"
                  requestAgentName={comp.agentName}
                />
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
