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
  RotateCcw,
} from "lucide-react";
import { InquiryRepliesViewer } from "./InquiryRepliesViewer";
import { TabbyTamaraCard } from "./TabbyTamaraCard";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { RequestReplyThread } from "./RequestReplyThread";
import { SlideToConfirm } from "./SlideToConfirm";
import { CopyWrap } from "./CopyWrap";
import { Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint, User as UserType } from "../types";
import { CLINIC_OPTIONS,  formatCaseRef, normalizePhone, copyToClipboard, getClinicLabel, generateInquiryCopyText, generateComplaintCopyText, generateTabbyTamaraCopyText } from "../utils";
import { toast } from "sonner";

interface GlobalDashboardProps {
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
  tlShiftLogs?: any[];
}

type SubmissionItem =
  | { type: "inquiry"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: Inquiry }
  | { type: "tabbyTamara"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: TabbyTamaraRequest }
  | { type: "complaint"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: TabbyTamaraComplaint };

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
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
  handleTLCommentComplaint,
  tlShiftLogs = []
}) => {
  // Filters state
  const [filterClinic, setFilterClinic] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [filterPhone, setFilterPhone] = useState<string>("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | "inquiry" | "tabbyTamara" | "complaint">("all");
  const [sortOldestFirst, setSortOldestFirst] = useState<boolean>(false);

  // Expanded card state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!currentUser) return null;

  // Helper to identify if a filter is active
  const todayStr = new Date().toISOString().slice(0, 10);
  const isAnyFilterActive =
    filterClinic !== "all" ||
    filterDate !== todayStr ||
    filterPhone.trim() !== "" ||
    selectedTypeFilter !== "all";

  // Check if item was created today (local time comparison)
  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    return itemDate.toDateString() === new Date().toDateString();
  };

  // Status mapping/checks
  const isInquiryPending = (inq: Inquiry) => inq.status !== "answered";
  
  const isTTPending = (req: TabbyTamaraRequest) => {
    const isCompleted =
      req.status === "confirmed" ||
      req.status === "rejected" ||
      req.workflowStatus === "completed" ||
      req.workflowStatus === "rejected";
    return !isCompleted;
  };

  const isComplaintPending = (comp: TabbyTamaraComplaint) => comp.status !== "closed";

  // Gather ALL items
  const allInquiries: SubmissionItem[] = inquiries.map((inq) => ({
    type: "inquiry",
    id: inq.id,
    createdAt: inq.createdAt,
    clinicName: inq.clinicName || "",
    phoneNumber: inq.phoneNumber || "",
    status: inq.status || "",
    agentName: inq.agentName || "Unknown",
    data: inq
  }));

  const allTTRequests: SubmissionItem[] = tabbyTamaraRequests.map((req) => ({
    type: "tabbyTamara",
    id: req.id,
    createdAt: req.createdAt,
    clinicName: req.clinicName || "",
    phoneNumber: req.phoneNumber || "",
    status: req.workflowStatus || req.status || "",
    agentName: req.agentName || req.submittedByName || "Unknown",
    data: req
  }));

  const allComplaints: SubmissionItem[] = tabbyTamaraComplaints.map((comp) => ({
    type: "complaint",
    id: comp.id,
    createdAt: comp.createdAt,
    clinicName: comp.clinicName || "",
    phoneNumber: comp.phoneNumber || "",
    status: comp.status || "",
    agentName: comp.agentName || "Unknown",
    data: comp
  }));

  // Combined master list of items
  const combinedList = [...allInquiries, ...allTTRequests, ...allComplaints];

  // Under the "default today only" view: find count of items created today & strictly pending
  const todayPendingInquiriesCount = allInquiries.filter(i => isToday(i.createdAt) && isInquiryPending(i.data as any)).length;
  const todayPendingTTRequestsCount = allTTRequests.filter(i => isToday(i.createdAt) && isTTPending(i.data as any)).length;
  const todayPendingComplaintsCount = allComplaints.filter(i => isToday(i.createdAt) && isComplaintPending(i.data as any)).length;

  // Under default today view, combined pending today
  const combinedPendingTodayAll = todayPendingInquiriesCount + todayPendingTTRequestsCount + todayPendingComplaintsCount;

  // Summary counts row values (reflects current filtering context for clarity, OR default today if unfiltered)
  // Let's make sure if we are filtering, the counters show the numbers corresponding to the active list
  const displayInquiriesCount = isAnyFilterActive
    ? combinedList.filter(i => i.type === "inquiry" && isInquiryPending(i.data as any) && 
        (filterClinic === "all" || i.clinicName?.toLowerCase() === filterClinic.toLowerCase()) &&
        (!filterDate || i.createdAt.startsWith(filterDate)) &&
        (!filterPhone || normalizePhone(i.phoneNumber).includes(normalizePhone(filterPhone)))
      ).length
    : todayPendingInquiriesCount;

  const displayTTRequestsCount = isAnyFilterActive
    ? combinedList.filter(i => i.type === "tabbyTamara" && isTTPending(i.data as any) &&
        (filterClinic === "all" || i.clinicName?.toLowerCase() === filterClinic.toLowerCase()) &&
        (!filterDate || i.createdAt.startsWith(filterDate)) &&
        (!filterPhone || normalizePhone(i.phoneNumber).includes(normalizePhone(filterPhone)))
      ).length
    : todayPendingTTRequestsCount;

  const displayComplaintsCount = isAnyFilterActive
    ? combinedList.filter(i => i.type === "complaint" && isComplaintPending(i.data as any) &&
        (filterClinic === "all" || i.clinicName?.toLowerCase() === filterClinic.toLowerCase()) &&
        (!filterDate || i.createdAt.startsWith(filterDate)) &&
        (!filterPhone || normalizePhone(i.phoneNumber).includes(normalizePhone(filterPhone)))
      ).length
    : todayPendingComplaintsCount;

  const displayTotalCount = displayInquiriesCount + displayTTRequestsCount + displayComplaintsCount;

  // Filter the list based on state criteria
  const filteredList = combinedList.filter((item) => {
    // 1. Pending checks per type (Always keep it pending focus, except we search historical)
    // Wait, the specification says: "By default (no filters), show items from inquiries, tabbyTamaraRequests, and tabbyTamaraComplaints where created today and status indicates pending. When any filter is changed from default, REMOVE the today only constraint and instead filter by the selected criteria across all time"
    const isPending =
      item.type === "inquiry" ? isInquiryPending(item.data as Inquiry) :
      item.type === "tabbyTamara" ? isTTPending(item.data as TabbyTamaraRequest) :
      isComplaintPending(item.data as TabbyTamaraComplaint);

    if (!isPending) return false;

    // 2. Type quick-filter (clickable count buttons)
    if (selectedTypeFilter !== "all" && item.type !== selectedTypeFilter) {
      return false;
    }

    // 3. Clinic filter
    if (filterClinic !== "all" && item.clinicName?.toLowerCase() !== filterClinic.toLowerCase()) {
      return false;
    }

    // 4. Phone filter
    if (filterPhone.trim() !== "") {
      const qPhone = normalizePhone(filterPhone);
      const itemPhone = normalizePhone(item.phoneNumber);
      if (!itemPhone.includes(qPhone)) {
        return false;
      }
    }

    // 5. Date filter OR Today constraint (Today constraint applies ONLY if NO filter is changed!)
    if (filterDate !== "") {
      if (!item.createdAt || !item.createdAt.startsWith(filterDate)) {
        return false;
      }
    } else if (!isAnyFilterActive) {
      // No filters active, today constraint is strictly enforced!
      if (!isToday(item.createdAt)) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  filteredList.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOldestFirst ? timeA - timeB : timeB - timeA;
  });

  const handleResetFilters = () => {
    setFilterClinic("all");
    setFilterDate(new Date().toISOString().slice(0, 10));
    setFilterPhone("");
    setSelectedTypeFilter("all");
    setSortOldestFirst(false);
    toast.info("Filters reset to Today's pending cases!");
  };

  const handleCopyInquiry = (e: React.MouseEvent, inq: Inquiry) => {
    e.stopPropagation();
    const text = generateInquiryCopyText(inq);
    copyToClipboard(text);
  };

  const handleCopyComplaint = (e: React.MouseEvent, comp: TabbyTamaraComplaint) => {
    e.stopPropagation();
    const text = generateComplaintCopyText(comp);
    copyToClipboard(text);
  };

  return (
    <div className="space-y-6 animate-fade-in p-1 text-left">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-emerald-400" /> Global Dispatch Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {isAnyFilterActive ? (
              <span className="text-sky-300 font-bold">
                ⚠️ Interactive Historical Search Mode active! All-time records matching your filter criteria are displayed.
              </span>
            ) : (
              <span>
                ⚡ Live dispatch panel showing <strong>Today's pending activities</strong>. Submit a lookup filter below to toggle historical search across all time.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-bold text-slate-300 border border-slate-700 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Return to Today Only"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" /> Reset to Today
            </button>
          )}

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">
              {filteredList.length} Items Listed
            </span>
          </div>
        </div>
      </div>

      {/* Online Team Leaders Today */}
      <div className="bg-[#18181c]/45 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Online Team Leaders Today</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Real-time leadership presence and shift logging</p>
          </div>
        </div>

        {tlShiftLogs.filter(log => log.loggedInAt && new Date(log.loggedInAt).toDateString() === new Date().toDateString()).length === 0 ? (
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px] bg-slate-800/20 px-3 py-1.5 rounded-xl border border-slate-850">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            No leaders logged in yet today
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {tlShiftLogs
              .filter(log => log.loggedInAt && new Date(log.loggedInAt).toDateString() === new Date().toDateString())
              .map((log, index) => {
                const loginTime = log.loggedInAt 
                  ? new Date(log.loggedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "";
                return (
                  <div 
                    key={log.id || index}
                    className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/15 px-3 py-1 rounded-xl text-[11px]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-slate-200">{log.tlName}</span>
                    <span className="text-[9px] text-slate-400 bg-indigo-500/10 px-1.5 py-0.2 rounded font-mono uppercase tracking-widest">{log.shift}</span>
                    {loginTime && (
                      <span className="text-[9px] text-slate-500 font-mono">at {loginTime}</span>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Summary Clickable Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Click to filter Inquiries */}
        <button
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === "inquiry" ? "all" : "inquiry")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden ${
            selectedTypeFilter === "inquiry"
              ? "bg-amber-500/15 border-amber-500/40 shadow-lg ring-1 ring-amber-500/20"
              : "bg-[#18181c]/65 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${selectedTypeFilter === "inquiry" ? "bg-amber-500/20 text-amber-300" : "bg-amber-500/10 text-amber-400"}`}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Inquiries</p>
              <p className="text-lg font-bold text-slate-100 mt-0.5">{displayInquiriesCount} pending</p>
            </div>
          </div>
          <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
            {selectedTypeFilter === "inquiry" ? "ACTIVE" : "CLICK"}
          </span>
        </button>

        {/* Click to filter Tabby/Tamara */}
        <button
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === "tabbyTamara" ? "all" : "tabbyTamara")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden ${
            selectedTypeFilter === "tabbyTamara"
              ? "bg-[#2bc9d7]/15 border-[#2bc9d7]/40 shadow-lg ring-1 ring-[#2bc9d7]/20"
              : "bg-[#18181c]/65 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${selectedTypeFilter === "tabbyTamara" ? "bg-[#2bc9d7]/20 text-[#2bc9d7]" : "bg-[#2bc9d7]/10 text-[#2bc9d7]"}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Alternative Pay</p>
              <p className="text-lg font-bold text-slate-100 mt-0.5">{displayTTRequestsCount} pending</p>
            </div>
          </div>
          <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
            {selectedTypeFilter === "tabbyTamara" ? "ACTIVE" : "CLICK"}
          </span>
        </button>

        {/* Click to filter Complaints */}
        <button
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === "complaint" ? "all" : "complaint")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden ${
            selectedTypeFilter === "complaint"
              ? "bg-rose-500/15 border-rose-500/40 shadow-lg ring-1 ring-rose-500/20"
              : "bg-[#18181c]/65 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${selectedTypeFilter === "complaint" ? "bg-rose-500/20 text-rose-300" : "bg-rose-500/10 text-rose-400"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Complaints</p>
              <p className="text-lg font-bold text-slate-100 mt-0.5">{displayComplaintsCount} pending</p>
            </div>
          </div>
          <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
            {selectedTypeFilter === "complaint" ? "ACTIVE" : "CLICK"}
          </span>
        </button>

        {/* Combined total */}
        <button
          onClick={() => setSelectedTypeFilter("all")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden ${
            selectedTypeFilter === "all"
              ? "bg-slate-300/10 border-slate-300/20 shadow-lg"
              : "bg-[#18181c]/65 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Combined Queue</p>
              <p className="text-lg font-bold text-slate-100 mt-0.5">{displayTotalCount} cases</p>
            </div>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full font-black">
            {isAnyFilterActive ? "FILTERED" : "TODAY"}
          </span>
        </button>
      </div>

      {/* Filter bar exactly as specified */}
      <div className="bg-[#18181c]/50 border border-slate-700/50 p-5 rounded-3xl gap-4 grid grid-cols-1 md:grid-cols-12 items-end">
        {/* Clinic Dropdown */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-emerald-400" /> Clinic Location
          </label>
          <select
            value={filterClinic}
            onChange={(e) => setFilterClinic(e.target.value)}
            className="w-full bg-[#18181c] border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none h-10 cursor-pointer"
          >
            <option value="all">🏢 All Clinics</option>
            {CLINIC_OPTIONS.map(c => (
<option key={c.value} value={c.value}>{c.label}</option>
))}
          </select>
        </div>

        {/* Date Picker */}
        <div className="md:col-span-3 space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Action Target Date
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
            className="w-full bg-[#18181c] border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none h-10 cursor-pointer"
          />
        </div>

        {/* Phone number partial search */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-sky-400" /> Phone Partial Lookup
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. +971..."
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              className="w-full bg-[#18181c] border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none h-10 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>
        </div>

        {/* Sorting toggle for SLA */}
        <div className="md:col-span-3">
          <button
            type="button"
            onClick={() => setSortOldestFirst(!sortOldestFirst)}
            className={`w-full h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              sortOldestFirst
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-md animate-pulse"
                : "bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700/60"
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
            {sortOldestFirst ? "⚠️ SLA Sort: Oldest First" : "🗓️ Sort: Latest First"}
          </button>
        </div>
      </div>

      {/* Dispatch queue combined list */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-white/10 bg-[#121216]/25 backdrop-blur-sm space-y-2 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-400 mb-2">
              <Filter className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-200">
              No matching dispatch files under current targets.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {isAnyFilterActive ? (
                <span>There are currently no active pending tickets matching the filters. Close some filters to go back to today's list.</span>
              ) : (
                <span>Excellent job! There are no open pending cases submitted <strong>Today</strong> so far.</span>
              )}
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
                {/* Visual side stripe */}
                <div className={`absolute top-0 bottom-0 left-0 w-[5px] ${stripeColor}`} />

                {/* Main Row Info */}
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
                        {/* Type Label Badge */}
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${typeBadgeClass}`}>
                          {typeName}
                        </span>

                        {/* Clinic Location Badge */}
                        <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 border border-white/10 rounded font-sans font-bold">
                          🏰 {getClinicLabel(item.clinicName)}
                        </span>

                        {/* Submitter Agent Tag */}
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 border border-slate-700/60 rounded font-sans font-bold">
                          👤 Agent: {item.agentName}
                        </span>

                        {/* Tel Number */}
                        {item.phoneNumber && (
                          <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 border border-sky-500/20 rounded font-mono font-bold">
                            📞 {item.phoneNumber}
                          </span>
                        )}

                        {/* SLA duration */}
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

                  {/* Status label */}
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

                {/* Inline Expansion Area */}
                {isExpanded && (
                  <div className="w-full pl-2.5 mt-4 pt-4 border-t border-white/5 space-y-5 animate-fade-in text-left">
                    {/* TYPE === INQUIRY WORK DETAILS */}
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
                              handleCopyInquiry(e, item.data as any);
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

                    {/* TYPE === TABBY TAMARA WORK DETAILS */}
                    {item.type === "tabbyTamara" && (
                      <div className="space-y-4">
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
                        <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-white/5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const text = generateTabbyTamaraCopyText(item.data);
                              copyToClipboard(text);
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-auto"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Details
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TYPE === COMPLAINT WORK DETAILS */}
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
                          <div className="bg-black/35 border border-white/5 p-4 rounded-xl text-xs text-slate-200 leading-relaxed italic font-sans">
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
                              handleCopyComplaint(e, item.data as any);
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
