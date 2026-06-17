import React, { useState } from "react";
import {
  Search,
  Calendar,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  FileText,
  Wallet,
  AlertTriangle,
  HelpCircle,
  Copy,
  Pencil,
  Trash2,
  Phone,
  Building,
  Clock,
  User,
  CheckCircle2,
  PenTool
} from "lucide-react";
import { InquiryRepliesViewer } from "./InquiryRepliesViewer";
import { TabbyTamaraCard } from "./TabbyTamaraCard";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { RequestReplyThread } from "./RequestReplyThread";
import { SlideToConfirm } from "./SlideToConfirm";
import { CopyWrap } from "./CopyWrap";
import { Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint, User as UserType, INITIAL_AGENTS } from "../types";
import { CLINIC_OPTIONS,  formatCaseRef, normalizePhone, copyToClipboard , getClinicLabel, generateInquiryCopyText, generateComplaintCopyText, generateTabbyTamaraCopyText} from "../utils";

interface MySubmissionsDashboardProps {
  inquiries: Inquiry[];
  tabbyTamaraRequests: TabbyTamaraRequest[];
  tabbyTamaraComplaints: TabbyTamaraComplaint[];
  currentUser: UserType | null;
  onEditItem: (type: string, item: any) => void;
  canEditItem: (createdAt: string | number | Date) => boolean;
  getRemainingEditTime: (createdAt: string | number | Date) => string;
  getElapsedTimerString: (confirmedAtISO: string, contactedAtISO?: string) => string;
  addSystemNotification: any;

  // TabbyTamaraCard specific props passed down
  isTLOreSupport: boolean;
  isSuperAdmin: boolean;
  activeFintechHandlingId: string | null;
  setActiveFintechHandlingId: (id: string | null) => void;
  tlFintechPaymentLink: string;
  setTlFintechPaymentLink: (link: string) => void;
  tlFintechNotes: string;
  setTlFintechNotes: (notes: string) => void;
  tlFintechLinks: string;
  setTlFintechLinks: (links: string) => void;
  handleConfirmTabbyTamara: any;
  handleMarkPatientContactedTT: any;
  handleDeleteTabbyTamara: any;

  // ComplaintsWorkspace specific props passed down
  handleToggleContactComplaint: (id: string, status: "not_contacted" | "contacted") => void;
  handleDeleteComplaint: (id: string) => void;
  handleAssignRecord: (
    recordId: string,
    collectionName: string,
    toAgent: string,
    recordType: string,
    fromAgent: string
  ) => void;
  activeComplaintHandlingId: string | null;
  setActiveComplaintHandlingId: (id: string | null) => void;
  tlComplaintResolutionType: string;
  setTlComplaintResolutionType: (type: string) => void;
  tlComplaintComment: string;
  setTlComplaintComment: (comment: string) => void;
  handleTLCommentComplaint: (id: string, comment: string, resolutionType: string) => void;
}

type SubmissionItem =
  | { type: "inquiry"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; data: Inquiry }
  | { type: "tabbyTamara"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; data: TabbyTamaraRequest }
  | { type: "complaint"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; data: TabbyTamaraComplaint };

export const MySubmissionsDashboard: React.FC<MySubmissionsDashboardProps> = ({
  inquiries,
  tabbyTamaraRequests,
  tabbyTamaraComplaints,
  currentUser,
  onEditItem,
  canEditItem,
  getRemainingEditTime,
  getElapsedTimerString,
  addSystemNotification,
  isTLOreSupport,
  isSuperAdmin,
  activeFintechHandlingId,
  setActiveFintechHandlingId,
  tlFintechPaymentLink,
  setTlFintechPaymentLink,
  tlFintechNotes,
  setTlFintechNotes,
  tlFintechLinks,
  setTlFintechLinks,
  handleConfirmTabbyTamara,
  handleMarkPatientContactedTT,
  handleDeleteTabbyTamara,
  handleToggleContactComplaint,
  handleDeleteComplaint,
  handleAssignRecord,
  activeComplaintHandlingId,
  setActiveComplaintHandlingId,
  tlComplaintResolutionType,
  setTlComplaintResolutionType,
  tlComplaintComment,
  setTlComplaintComment,
  handleTLCommentComplaint
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters state
  const [subDate, setSubDate] = useState<string>(todayStr);
  const [subClinics, setSubClinics] = useState<string[]>([]);
  const [subPhone, setSubPhone] = useState<string>("");
  const [subStatusFilter, setSubStatusFilter] = useState<"pending" | "all">("pending");

  // Expanded card state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!currentUser) return null;

  // Gather and filter inquiries
  const myInquiries: SubmissionItem[] = inquiries
    .filter((inq) => {
      const matchAgent =
        inq.agentName?.toLowerCase() === currentUser.name.toLowerCase() ||
        inq.assignedTo?.toLowerCase() === currentUser.name.toLowerCase();
      return matchAgent;
    })
    .map((inq) => ({
      type: "inquiry",
      id: inq.id,
      createdAt: inq.createdAt,
      clinicName: inq.clinicName,
      phoneNumber: inq.phoneNumber || "",
      status: inq.status,
      data: inq
    }));

  // Gather and filter Tabby/Tamara requests
  const myTTRequests: SubmissionItem[] = tabbyTamaraRequests
    .filter((req) => {
      const matchAgent =
        req.agentName?.toLowerCase() === currentUser.name.toLowerCase() ||
        req.submittedByName?.toLowerCase() === currentUser.name.toLowerCase() ||
        req.assignedTo?.toLowerCase() === currentUser.name.toLowerCase();
      return matchAgent;
    })
    .map((req) => ({
      type: "tabbyTamara",
      id: req.id,
      createdAt: req.createdAt,
      clinicName: req.clinicName,
      phoneNumber: req.phoneNumber || "",
      status: req.workflowStatus || req.status,
      data: req
    }));

  // Gather and filter complaints
  const myComplaints: SubmissionItem[] = tabbyTamaraComplaints
    .filter((comp) => {
      const matchAgent =
        comp.agentName?.toLowerCase() === currentUser.name.toLowerCase() ||
        comp.assignedTo?.toLowerCase() === currentUser.name.toLowerCase();
      return matchAgent;
    })
    .map((comp) => ({
      type: "complaint",
      id: comp.id,
      createdAt: comp.createdAt,
      clinicName: comp.clinicName,
      phoneNumber: comp.phoneNumber || "",
      status: comp.status,
      data: comp
    }));

  // Combine lists
  const combinedList = [...myInquiries, ...myTTRequests, ...myComplaints];

  // Apply filters
  const filteredList = combinedList.filter((item) => {
    // 1. Date filter (by matching start of createdAt, e.g., "YYYY-MM-DD")
    if (subDate && (!item.createdAt || !item.createdAt.startsWith(subDate))) {
      return false;
    }

    // 2. Clinic filter
    if (subClinics.length > 0 && item.clinicName && !subClinics.includes(item.clinicName)) {
      return false;
    }

    // 3. Phone filter partial match
    if (subPhone) {
      const normQuery = normalizePhone(subPhone);
      const normItem = normalizePhone(item.phoneNumber);
      if (!normItem.includes(normQuery)) {
        return false;
      }
    }

    // 4. Default pending behavior when no filters (i.e., status-pending-only if selected, which defaults to pending)
    if (subStatusFilter === "pending") {
      if (item.type === "inquiry" && item.status === "answered") {
        return false;
      }
      if (item.type === "tabbyTamara" && (item.status === "completed" || item.data.status === "confirmed")) {
        // TabbyTamara completed if workflow is completed or overall status confirmed
        return false;
      }
      if (item.type === "complaint" && item.status === "closed") {
        return false;
      }
    }

    return true;
  });

  // Sort by createdAt descending
  filteredList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleCopyInquiry = (e: React.MouseEvent, inq: any) => {
        e.stopPropagation();
        const text = generateInquiryCopyText(inq);
        copyToClipboard(text);
      };

  const handleCopyComplaint = (e: React.MouseEvent, comp: any) => {
        e.stopPropagation();
        const text = generateComplaintCopyText(comp);
        copyToClipboard(text);
      };

  return (
    <div className="space-y-6 animate-fade-in font-sans p-1">
      {/* Header */}
      <div className="bg-[#181a20] p-6 rounded-[32px] border-none shadow-sm space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-display text-left flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-full">
                <ClipboardList className="w-6 h-6" />
              </div>
              My Submissions
            </h2>
            <p className="text-slate-400 text-sm font-sans text-left mt-2 max-w-xl font-medium">
              Track and review inquiries, Tabby/Tamara Requests, and Patient Complaints submitted by you.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center bg-indigo-500/10 px-4 py-2.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
              {filteredList.length} Matching Records
            </span>
          </div>
        </div>
      </div>

      {/* Unified Search and Filtering Controls */}
      <div className="bg-[#181a20] p-6 rounded-[32px] gap-4 grid grid-cols-1 md:grid-cols-12 items-end">
        {/* Date Picker */}
        <div className="md:col-span-3 space-y-2 my-auto">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-1">
            <Calendar className="w-4 h-4 text-slate-500" />
            Submission Date
          </label>
          <input
            type="date"
            value={subDate}
            onChange={(e) => setSubDate(e.target.value)}
            className="w-full bg-[#1f222a] border-none rounded-2xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none h-12 select-none cursor-pointer font-medium"
          />
        </div>

        {/* Clinic Dropdown */}
        <div className="md:col-span-3 space-y-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-1">
              <Building className="w-4 h-4 text-slate-500" /> Clinics (Multi)
            </label>
            {subClinics.length > 0 && (
              <button
                onClick={() => setSubClinics([])}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (val && !subClinics.includes(val)) {
                setSubClinics([...subClinics, val]);
              }
            }}
            className="w-full bg-[#1f222a] border-none rounded-2xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none h-12 cursor-pointer font-medium appearance-none"
          >
            <option value="">➕ Add Clinic to Filter...</option>
            {CLINIC_OPTIONS.filter(c => !subClinics.includes(c.value)).map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {subClinics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {subClinics.map(c => {
                const label = CLINIC_OPTIONS.find(opt => opt.value === c)?.label || c;
                return (
                  <span key={c} className="bg-indigo-500/10 text-indigo-300 border-none px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5">
                    {label}
                    <button onClick={() => setSubClinics(prev => prev.filter(x => x !== c))} className="hover:text-white cursor-pointer">&times;</button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Phone Input */}
        <div className="md:col-span-3 space-y-2 my-auto">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-1">
            <Phone className="w-4 h-4 text-slate-500" />
            Patient Phone No.
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by phone..."
              value={subPhone}
              onChange={(e) => setSubPhone(e.target.value)}
              className="w-full bg-[#1f222a] border-none rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none h-12 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
          </div>
        </div>

        {/* Status filter */}
        <div className="md:col-span-3 space-y-2 my-auto">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-1">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            Status Category
          </label>
          <select
            value={subStatusFilter}
            onChange={(e) => setSubStatusFilter(e.target.value as "pending" | "all")}
            className="w-full bg-[#1f222a] border-none rounded-2xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none h-12 cursor-pointer font-medium appearance-none"
          >
            <option value="pending">⏳ Pending Cases Only</option>
            <option value="all">📁 All submissions</option>
          </select>
        </div>
      </div>

      {/* Unified Case List Grid */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-16 text-center rounded-[32px] bg-[#181a20] border-none shadow-sm space-y-2 animate-fade-in text-left">
            <div className="w-12 h-12 rounded-full bg-[#1f222a] flex items-center justify-center mx-auto text-slate-400 mb-2">
              <ClipboardList className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-sm font-bold text-slate-200">
              No matching submissions.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please try adjusting your filters (e.g., date, clinic, or change Status Category to "All Submissions") to locate your history.
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemDateLabel = new Date(item.createdAt).toLocaleString();

            // Type specific labels
            let typeBadgeClass = "bg-white/5 text-slate-300 border-white/10";
            let typeIcon = <FileText className="w-3.5 h-3.5 text-slate-400" />;
            let typeName = "Case";

            if (item.type === "inquiry") {
              typeBadgeClass = "bg-amber-500/10 text-amber-300 border-amber-500/20";
              typeIcon = <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
              typeName = "Inquiry";
            } else if (item.type === "tabbyTamara") {
              typeBadgeClass = "bg-[#2bc9d7]/10 text-[#2bc9d7] border-[#2bc9d7]/20";
              typeIcon = <Wallet className="w-3.5 h-3.5 text-[#2bc9d7]" />;
              typeName = "Tabby/Tamara";
            } else if (item.type === "complaint") {
              typeBadgeClass = "bg-rose-500/10 text-rose-300 border-rose-500/20";
              typeIcon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
              typeName = "Complaint";
            }

            // Case reference lookup
            const resolvedRef = formatCaseRef(
              item.id,
              item.type === "inquiry" ? "inq" : item.type === "tabbyTamara" ? "tabby" : "tt_complaint",
              item.createdAt,
              item.data.caseRef
            );

            // Left stripe border color based on urgency or type
            let stripeColor = "bg-slate-500";
            if (item.type === "complaint") {
              stripeColor = item.status === "closed" ? "bg-emerald-500" : "bg-rose-500";
            } else if (item.type === "inquiry") {
              stripeColor = item.status === "closed" ? "bg-emerald-500" : item.status === "answered" ? "bg-teal-500" : "bg-amber-500";
            } else if (item.type === "tabbyTamara") {
              stripeColor = item.data.status === "confirmed" || item.status === "completed" ? "bg-emerald-500" : item.data.status === "rejected" ? "bg-red-500" : "bg-indigo-500";
            }

            return (
              <div
                key={item.id}
                className={`group p-5 bg-[#1f222a] border-none rounded-[24px] hover:bg-[#282c35] transition-all duration-300 relative flex flex-col w-full overflow-hidden shadow-sm ${
                   isExpanded ? "shadow-md ring-1 ring-indigo-500/15" : "cursor-pointer hover:shadow-md"
                }`}
                onClick={() => {
                  if (!isExpanded) {
                    setExpandedId(item.id);
                  }
                }}
              >
                {/* Visual Indicator Line */}
                <div className={`absolute top-0 bottom-0 left-0 w-[5px] ${stripeColor}`} />

                {/* Submissions Header Row */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pl-2.5 ${
                    isExpanded ? "border-b border-white/5 pb-3.5 cursor-pointer hover:opacity-85" : ""
                  }`}
                  onClick={(e) => {
                    if (isExpanded) {
                      e.stopPropagation();
                      setExpandedId(null);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 text-left">
                    {/* Icon based Badge */}
                    <div className="p-2.5 bg-black/30 rounded-full flex items-center justify-center shrink-0">
                      {typeIcon}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Type Badge */}
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${typeBadgeClass}`}>
                          {typeName}
                        </span>

                        {/* Clinic Badge */}
                        <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 border border-white/10 rounded font-sans font-bold">
                          🏰 {getClinicLabel(item.clinicName)}
                        </span>

                        {/* Phone Number summary */}
                        {item.phoneNumber && (
                          <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 border border-sky-500/20 rounded font-mono font-bold">
                            📞 {item.phoneNumber}
                          </span>
                        )}

                        {/* Patient Name summary if exists */}
                        {("patientName" in item.data) && item.data.patientName && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 border border-emerald-500/20 rounded font-sans font-bold uppercase">
                            👤 {item.data.patientName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[9px] text-slate-500 bg-black/20 px-1.5 py-0.5 rounded">
                          {resolvedRef}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {itemDateLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & expand toggle controls */}
                  <div className="flex items-center gap-2 sm:self-center self-end">
                    {/* Status Label */}
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md font-sans leading-none ${
                      item.status === "completed" || item.status === "closed" || item.status === "answered"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                    }`}>
                      {item.status === "tl_link_ready" ? "🔗 Link Ready" :
                       item.status === "awaiting_client_contact" ? "📞 Awaiting Contact" :
                       item.status === "ready_for_partner" ? "🤝 Ready for Partner" :
                       item.status === "sent_to_partner" ? "📤 Sent to Partner" :
                       item.status === "pending_tl" ? "⌛ Pending TL review" :
                       item.status === "need_contact" ? "📞 Pending contact" :
                       item.status || "Submitting"}
                    </span>

                    {/* Expand toggle icon */}
                    <div className="text-slate-400 hover:text-indigo-400 p-1 rounded-md transition-all shrink-0 ml-1 flex items-center justify-center">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Unified Card Details Block on Expansion */}
                {isExpanded && (
                  <div className="w-full pl-2.5 mt-4 pt-4 border-t border-white/5 space-y-5 animate-fade-in text-left">
                    {/* RENDER INQUIRY OPTION */}
                    {item.type === "inquiry" && (
                      <div className="space-y-4">
                        <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-xs space-y-2 text-slate-200">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            📝 Submitted Inquiry Details
                          </p>
                          <p className="whitespace-pre-line leading-relaxed italic text-sm">
                            "{item.data.text}"
                          </p>
                        </div>

                        {/* Inquiry Photo & Link Attachments */}
                        {((item.data.photos && item.data.photos.length > 0) || item.data.screenshot || item.data.links?.length > 0) && (
                          <div className="space-y-3 bg-[#1e1e1e]/20 border border-white/5 p-4 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
                              📎 Uploaded Attachments & Proofs
                            </span>
                            <AttachmentsDisplay
                              photos={[
                                ...(item.data.photos || []),
                                ...(item.data.screenshot ? [item.data.screenshot] : []),
                                ...((item.data as any).imageUrl ? [(item.data as any).imageUrl] : [])
                              ].filter(Boolean)}
                              attachments={item.data.attachments}
                              links={item.data.links || []}
                              tlPhotos={item.data.tlPhotos}
                              tlLinks={item.data.tlLinks}
                            />
                          </div>
                        )}

                        {/* Inquiry Solutions & Answers Viewer */}
                        <InquiryRepliesViewer inquiry={item.data} />

                        {/* Bottom Utility copy wrap */}
                        <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyInquiry(e, item.data);
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Details
                          </button>
                          {canEditItem(item.createdAt) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditItem("inquiry", item.data);
                              }}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit ({getRemainingEditTime(item.createdAt)})
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RENDER TABBY/TAMARA OPTION */}
                    {item.type === "tabbyTamara" && (
                      <div className="space-y-1">
                        <TabbyTamaraCard
                          req={item.data}
                          currentUser={currentUser}
                          isTLOreSupport={isTLOreSupport}
                          isSuperAdmin={isSuperAdmin}
                          activeFintechHandlingId={activeFintechHandlingId}
                          setActiveFintechHandlingId={setActiveFintechHandlingId}
                          tlFintechPaymentLink={tlFintechPaymentLink}
                          setTlFintechPaymentLink={setTlFintechPaymentLink}
                          tlFintechNotes={tlFintechNotes}
                          setTlFintechNotes={setTlFintechNotes}
                          tlFintechLinks={tlFintechLinks}
                          setTlFintechLinks={setTlFintechLinks}
                          handleConfirmTabbyTamara={handleConfirmTabbyTamara}
                          handleMarkPatientContactedTT={handleMarkPatientContactedTT}
                          getElapsedTimerString={getElapsedTimerString}
                          handleDeleteTabbyTamara={handleDeleteTabbyTamara}
                          canEditItem={canEditItem}
                          getRemainingEditTime={getRemainingEditTime}
                          editLimitMs={10 * 60 * 1000} // 10 minutes limit
                          setEditingItem={(editingItem: any) => onEditItem(editingItem.type, editingItem.data)}
                          addSystemNotification={addSystemNotification}
                          isExpanded={true}
                          onToggle={() => {}}
                        />
                      </div>
                    )}

                    {/* RENDER COMPLAINT OPTION */}
                    {item.type === "complaint" && (
                      <div className="space-y-5">
                        {/* Patient info specifications */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                              SUBMITTING AGENT
                            </span>
                            <span className="text-slate-200 font-bold font-sans">
                              👤 {item.data.agentName}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                              CUSTOMER TYPE
                            </span>
                            <span className="text-slate-200 font-bold font-sans">
                              {item.data.isOldCustomer ? "👴 Old Customer" : "🆕 New Customer"}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                              CONTACT MOBILE
                            </span>
                            <span className="text-slate-200 font-bold font-mono">
                              📞 {item.data.phoneNumber}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                              FILE NUMBER
                            </span>
                            <span className="text-slate-200 font-bold font-mono">
                              📁 {item.data.fileNumber || "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Patient ID number if new */}
                        {!item.data.isOldCustomer && item.data.idNumber && (
                          <div className="bg-[#1e1e1e]/60 border border-white/5 p-3.5 rounded-xl text-xs flex justify-between items-center">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5">
                                ID NUMBER (NEW CUSTOMER REQUIREMENT)
                              </span>
                              <span className="text-slate-200 font-mono font-bold text-sm">
                                {item.data.idNumber}
                              </span>
                            </div>
                            <CopyWrap text={item.data.idNumber} label="ID Number">
                              <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 border border-white/5 transition-all cursor-pointer">
                                Copy ID
                              </button>
                            </CopyWrap>
                          </div>
                        )}

                        {/* Complaint detailed content */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
                            🚨 Patient Complaint Details
                          </span>
                          <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-xs text-slate-200 leading-relaxed italic">
                            <p className="whitespace-pre-line">
                              "{item.data.complaintDetails}"
                            </p>
                          </div>
                        </div>

                        {/* Complaint Attachments */}
                        {((item.data.photos && item.data.photos.length > 0) || item.data.imageUrl || item.data.screenshot || (item.data.links && item.data.links.length > 0)) && (
                          <div className="space-y-3 bg-[#1e1e1e]/20 border border-white/5 p-4 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
                              📎 Uploaded Attachments & Proofs
                            </span>
                            <AttachmentsDisplay
                              photos={[
                                ...(item.data.photos || []),
                                ...(item.data.imageUrl ? [item.data.imageUrl] : []),
                                ...(item.data.screenshot ? [item.data.screenshot] : [])
                              ]}
                              links={item.data.links || []}
                            />
                          </div>
                        )}

                        {/* TL Answer Section */}
                        {item.data.tlComment && (
                          <div className="border border-rose-500/20 bg-rose-500/[0.02] p-5 rounded-xl space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/10 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-rose-400 text-sm font-bold">📋</span>
                                <p className="text-[10px] text-rose-400 uppercase tracking-wider font-extrabold">
                                  Team Leader Answer ({item.data.tlName || "TL"})
                                </p>
                              </div>
                              {item.data.tlResolutionType && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 rounded-md text-[9px] font-black uppercase text-rose-300 tracking-wider">
                                  {item.data.tlResolutionType === "refund" ? "💳 Refund" :
                                   item.data.tlResolutionType === "replacement" ? "🔄 Replacement" :
                                   item.data.tlResolutionType === "apology" ? "✉ Apology" :
                                   item.data.tlResolutionType === "escalated" ? "⬆ Escalated" :
                                   item.data.tlResolutionType === "no_action" ? "🚫 No Action" :
                                   item.data.tlResolutionType === "follow_up" ? "⏳ Follow Up Required" : item.data.tlResolutionType}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                              {item.data.tlComment}
                            </p>
                          </div>
                        )}

                        {/* Dynamic TL Resolution form rendering if current user is TL or operations */}
                        {activeComplaintHandlingId === item.data.id && isTLOreSupport && (
                          <div className="p-5 bg-rose-500/[0.02] border border-rose-500/20 rounded-xl space-y-4 shadow-xl text-left w-full mt-1">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                              <PenTool className="w-3.5 h-3.5" /> TL Resolution Panel
                            </p>

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
                                  { value: "follow_up", label: "⏳ Follow Up Required" }
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

                            <div>
                              <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-2">
                                Resolution Details / Instructions <span className="text-red-400">*</span>
                              </label>
                              <textarea
                                placeholder="Explain the resolution..."
                                value={tlComplaintComment}
                                onChange={(e) => setTlComplaintComment(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-slate-100 min-h-[100px] resize-none focus:outline-none focus:border-rose-500"
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
                                onClick={() => handleTLCommentComplaint(item.data.id, tlComplaintComment, tlComplaintResolutionType)}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Submit Resolution
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Complaint footer buttons */}
                        <div className="flex flex-wrap gap-2 items-center justify-end pt-4 border-t border-white/5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyComplaint(e, item.data);
                            }}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-100 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-auto"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Details
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComplaint(item.data.id);
                              }}
                              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/10 rounded-lg text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}

                          {canEditItem(item.createdAt) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditItem("tt_complaint", item.data);
                              }}
                              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit ({getRemainingEditTime(item.createdAt)})
                            </button>
                          )}

                          {isTLOreSupport && item.status === "pending_tl" && activeComplaintHandlingId !== item.data.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveComplaintHandlingId(item.data.id);
                                setTlComplaintComment("");
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
                            >
                              Reply & Review
                            </button>
                          )}

                          {/* Close slide bar for pending cases */}
                          {(item.status === "need_contact" || (isTLOreSupport && item.status !== "closed")) && (
                            <div className="w-full sm:w-64" onClick={(e) => e.stopPropagation()}>
                              <SlideToConfirm
                                label={item.status === "need_contact" ? "Slide to Close Case" : "Slide to Force Close"}
                                confirmedLabel="Closed!"
                                colorClass="from-emerald-500 to-teal-500"
                                onConfirm={() => handleToggleContactComplaint(item.data.id, "contacted")}
                              />
                            </div>
                          )}

                          {/* Reopen Closed Case if done in error */}
                          {["agent", "sme"].includes(currentUser.role as string) && item.status === "closed" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleContactComplaint(item.data.id, "not_contacted");
                              }}
                              className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-[10px] rounded-lg cursor-pointer"
                            >
                              Reopen Case
                            </button>
                          )}
                        </div>

                        {/* Requests Thread */}
                        <div className="w-full mt-4 pt-4 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                          <RequestReplyThread
                            request={item.data}
                            currentUser={currentUser}
                            collectionName="tt_complaints"
                            addSystemNotification={addSystemNotification}
                            requestType="Complaint"
                            requestAgentName={item.data.agentName}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
