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
  Clock,
  User,
  CheckCircle2,
  PenTool,
  ArrowUpDown,
  Filter,
  Phone,
  Building,
} from "lucide-react";
import { InquiryRepliesViewer } from "./InquiryRepliesViewer";
import { TabbyTamaraCard } from "./TabbyTamaraCard";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { RequestReplyThread } from "./RequestReplyThread";
import { SlideToConfirm } from "./SlideToConfirm";
import { CopyWrap } from "./CopyWrap";
import { Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint, User as UserType } from "../types";
import { CLINIC_OPTIONS,  formatCaseRef, normalizePhone, copyToClipboard , getClinicLabel, generateInquiryCopyText, generateComplaintCopyText, generateTabbyTamaraCopyText} from "../utils";
import { toast } from "sonner";

interface AgentSubmissionsDashboardProps {
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
  | { type: "inquiry"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: Inquiry }
  | { type: "tabbyTamara"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: TabbyTamaraRequest }
  | { type: "complaint"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: TabbyTamaraComplaint };

export const AgentSubmissionsDashboard: React.FC<AgentSubmissionsDashboardProps> = ({
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
  // Filters state
  const [filterClinic, setFilterClinic] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterPhone, setFilterPhone] = useState<string>("");
  const [sortOldestFirst, setSortOldestFirst] = useState<boolean>(false);

  // Expanded card state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!currentUser) return null;

  // 1. Gather strictly pending inquiries (status !== "answered")
  const pendingInquiries: SubmissionItem[] = inquiries
    .filter((inq) => inq.status !== "answered")
    .map((inq) => ({
      type: "inquiry",
      id: inq.id,
      createdAt: inq.createdAt,
      clinicName: inq.clinicName || "",
      phoneNumber: inq.phoneNumber || "",
      status: inq.status || "",
      agentName: inq.agentName || "Unknown",
      data: inq
    }));

  // 2. Gather strictly pending Tabby/Tamara requests (status is indicating open/pending)
  const pendingTTRequests: SubmissionItem[] = tabbyTamaraRequests
    .filter((req) => {
      const isCompleted =
        req.status === "confirmed" ||
        req.status === "rejected" ||
        req.workflowStatus === "completed" ||
        req.workflowStatus === "rejected";
      return !isCompleted;
    })
    .map((req) => ({
      type: "tabbyTamara",
      id: req.id,
      createdAt: req.createdAt,
      clinicName: req.clinicName || "",
      phoneNumber: req.phoneNumber || "",
      status: req.workflowStatus || req.status || "",
      agentName: req.agentName || req.submittedByName || "Unknown",
      data: req
    }));

  // 3. Gather strictly pending tabbyTamaraComplaints (status !== "closed")
  const pendingComplaints: SubmissionItem[] = tabbyTamaraComplaints
    .filter((comp) => comp.status !== "closed")
    .map((comp) => ({
      type: "complaint",
      id: comp.id,
      createdAt: comp.createdAt,
      clinicName: comp.clinicName || "",
      phoneNumber: comp.phoneNumber || "",
      status: comp.status || "",
      agentName: comp.agentName || "Unknown",
      data: comp
    }));

  // Calculate high-level summary metadata
  const totalPendingInquiries = pendingInquiries.length;
  const totalPendingTT = pendingTTRequests.length;
  const totalPendingComplaints = pendingComplaints.length;

  // Combine lists
  const allSubmissions = [...pendingInquiries, ...pendingTTRequests, ...pendingComplaints];

  // Apply filters
  const filteredList = allSubmissions.filter((item) => {
    // 1. Clinic filter
    if (filterClinic !== "all" && item.clinicName?.toLowerCase() !== filterClinic.toLowerCase()) {
      return false;
    }

    // 2. Date filter (optional - match YYYY-MM-DD prefix of createdAt)
    if (filterDate && (!item.createdAt || !item.createdAt.startsWith(filterDate))) {
      return false;
    }

    // 3. Phone filter partial match
    if (filterPhone) {
      const normQuery = normalizePhone(filterPhone);
      const normItem = normalizePhone(item.phoneNumber);
      if (!normItem.includes(normQuery)) {
        return false;
      }
    }

    return true;
  });

  // Apply sorting
  filteredList.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOldestFirst ? timeA - timeB : timeB - timeA;
  });

  // Handle utilities
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
    <div className="space-y-6 animate-fade-in p-1">
      {/* Summary Header Cards */}
      <div className="bg-[#121216]/65 border border-slate-800 p-6 rounded-3xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-emerald-400" /> All Agent Submissions
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Centralized Team Leader dashboard monitoring pending inquiries, alternative payment requests, and support complaints submitted by all workspace agents.
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-center bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
              {filteredList.length} Active SLA Items
            </span>
          </div>
        </div>

        {/* Counter grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-amber-500/10 border border-amber-500/15 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-amber-400 uppercase tracking-widest font-black">
                Pending Inquiries
              </p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">
                {totalPendingInquiries} cases
              </p>
            </div>
          </div>

          <div className="bg-[#2bc9d7]/10 border border-[#2bc9d7]/15 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-[#2bc9d7]/15 text-[#2bc9d7] rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-[#2bc9d7] uppercase tracking-widest font-black">
                Tabby & Tamara
              </p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">
                {totalPendingTT} requests
              </p>
            </div>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/15 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/15 text-rose-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black">
                Active Complaints
              </p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">
                {totalPendingComplaints} open
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar Controls */}
      <div className="bg-[#18181c]/50 border border-slate-700/50 p-5 rounded-2xl gap-4 grid grid-cols-1 md:grid-cols-12 items-end">
        {/* Clinic Dropdown */}
        <div className="md:col-span-3 space-y-1.5 text-left">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-emerald-400" /> Filter by Clinic
          </label>
          <select
            value={filterClinic}
            onChange={(e) => setFilterClinic(e.target.value)}
            className="w-full bg-[#18181c] border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none h-10 cursor-pointer font-sans"
          >
            <option value="all">🏢 All Clinics</option>
            {CLINIC_OPTIONS.map(c => (
<option key={c.value} value={c.value}>{c.label}</option>
))}
          </select>
        </div>

        {/* Date Picker */}
        <div className="md:col-span-3 space-y-1.5 text-left">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Filter by Date (optional)
            </label>
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="text-[9px] text-rose-400 hover:text-rose-300 font-bold tracking-wider uppercase underline bg-transparent border-none p-0 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-[#18181c] border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none h-10 cursor-pointer font-sans"
          />
        </div>

        {/* Phone number Search */}
        <div className="md:col-span-3 space-y-1.5 text-left">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-sky-400" /> Phone Number Search
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. +9715..."
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              className="w-full bg-[#18181c] border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none h-10 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>
        </div>

        {/* Sorting Toggle */}
        <div className="md:col-span-3">
          <button
            type="button"
            onClick={() => setSortOldestFirst(!sortOldestFirst)}
            className={`w-full h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              sortOldestFirst
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-md shadow-amber-500/5 animate-pulse"
                : "bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700/60"
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
            {sortOldestFirst ? "⚠️ SLA Sort: Oldest First" : "🗓️ Sort: Latest First"}
          </button>
        </div>
      </div>

      {/* Case List Grid Stack */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-white/10 bg-[#121216]/25 backdrop-blur-sm space-y-2 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-400 mb-2">
              <Filter className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-200">
              No pending cases found.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No actions required under the current criteria. Ensure that date and clinic filters are configured properly or set to wildcards.
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemDateLabel = new Date(item.createdAt).toLocaleString();

            const ageMs = Date.now() - new Date(item.createdAt).getTime();
            const ageHours = ageMs / 3600000;
            const ageLabel = ageMs < 3600000
              ? `${Math.floor(ageMs / 60000)}m open`
              : `${Math.floor(ageHours)}h ${Math.floor((ageHours % 1) * 60)}m open`;

            const ageBadgeColor = ageHours > 4
              ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse font-bold"
              : ageHours > 1
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold"
                : "bg-slate-700/50 text-slate-300 border-white/10";

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

            const resolvedRef = formatCaseRef(
              item.id,
              item.type === "inquiry" ? "inq" : item.type === "tabbyTamara" ? "tabby" : "tt_complaint",
              item.createdAt,
              item.data.caseRef
            );

            let stripeColor = "bg-slate-500";
            if (item.type === "complaint") {
              stripeColor = "bg-rose-500";
            } else if (item.type === "inquiry") {
              stripeColor = "bg-amber-500";
            } else if (item.type === "tabbyTamara") {
              stripeColor = "bg-[#2bc9d7]";
            }

            return (
              <div
                key={item.id}
                className={`group p-5 bg-[#18181c] border border-slate-700/60 rounded-2xl hover:border-emerald-500/25 transition-all duration-300 relative flex flex-col w-full overflow-hidden ${
                  !isExpanded ? "hover:bg-white/[0.04] cursor-pointer shadow-md" : "shadow-xl ring-1 ring-emerald-500/10"
                }`}
                onClick={() => {
                  if (!isExpanded) {
                    setExpandedId(item.id);
                  }
                }}
              >
                {/* Stripe border indicator */}
                <div className={`absolute top-0 bottom-0 left-0 w-[5px] ${stripeColor}`} />

                {/* Header structure */}
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
                    <div className="p-2.5 bg-black/35 rounded-full flex items-center justify-center shrink-0">
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

                        {/* Agent Submitter */}
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 border border-slate-700/60 rounded font-sans font-bold">
                          👤 Agent: {item.agentName}
                        </span>

                        {/* Phone Number */}
                        {item.phoneNumber && (
                          <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 border border-sky-500/20 rounded font-mono font-bold">
                            📞 {item.phoneNumber}
                          </span>
                        )}

                        {/* SLA Age Badge */}
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${ageBadgeColor}`}>
                          ⏳ {ageLabel}
                        </span>
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

                  {/* Status Indicator & expansion arrow */}
                  <div className="flex items-center gap-2 sm:self-center self-end">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md font-sans leading-none bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      {item.status === "tl_link_ready" ? "🔗 Link Ready" :
                       item.status === "awaiting_client_contact" ? "📞 Awaiting Contact" :
                       item.status === "ready_for_partner" ? "🤝 Ready for Partner" :
                       item.status === "sent_to_partner" ? "📤 Sent to Partner" :
                       item.status === "pending_tl" ? "⌛ Pending TL review" :
                       item.status === "need_contact" ? "📞 Pending contact" :
                       item.status || "Open/Pending"}
                    </span>

                    <div className="text-slate-400 hover:text-emerald-400 p-1 rounded-md transition-all shrink-0 ml-1 flex items-center justify-center">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expansion panels */}
                {isExpanded && (
                  <div className="w-full pl-2.5 mt-4 pt-4 border-t border-white/5 space-y-5 animate-fade-in text-left">
                    {/* INQUIRY ELEMENT PANEL */}
                    {item.type === "inquiry" && (
                      <div className="space-y-4">
                        <div className="bg-black/35 border border-white/5 p-4 rounded-xl text-xs space-y-2 text-slate-200">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            📝 Submitted Inquiry Details
                          </p>
                          <p className="whitespace-pre-line leading-relaxed italic text-sm">
                            "{item.data.text}"
                          </p>
                        </div>

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

                        <InquiryRepliesViewer inquiry={item.data} />

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

                    {/* TABBY TAMARA WORK PANEL */}
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
                          editLimitMs={10 * 60 * 1000}
                          setEditingItem={(editingItem: any) => onEditItem(editingItem.type, editingItem.data)}
                          addSystemNotification={addSystemNotification}
                          isExpanded={true}
                          onToggle={() => {}}
                        />
                      </div>
                    )}

                    {/* COMPLAINTS DETAILS AND SOLUTION PANEL */}
                    {item.type === "complaint" && (
                      <div className="space-y-5">
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

                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
                            🚨 Patient Complaint Details
                          </span>
                          <div className="bg-black/35 border border-white/5 p-4 rounded-xl text-xs text-slate-200 leading-relaxed italic">
                            <p className="whitespace-pre-line">
                              "{item.data.complaintDetails}"
                            </p>
                          </div>
                        </div>

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
                                   item.data.tlResolutionType === "apology" ? "✉ apology" :
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
