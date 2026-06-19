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
  MessageCircle,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { InquiryRepliesViewer } from "./InquiryRepliesViewer";
import { TabbyTamaraCard } from "./TabbyTamaraCard";
import { ComplaintCard } from "./ComplaintCard";
import { InquiryCard } from "./InquiryCard";
import { ClientCommCard } from "./ClientCommCard";
import { PaginationControls } from "./PaginationControls";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { RequestReplyThread } from "./RequestReplyThread";
import { SlideToConfirm } from "./SlideToConfirm";
import { CopyWrap } from "./CopyWrap";
import { Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint, ClientCommunicationRequest, User as UserType, TEAM_LEADERS } from "../types";
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
  tlLoginLogs?: any[];

  // InquiryCard specific props passed down
  handleTLViewInquiry?: any;
  answeringInquiryId?: any;
  setAnsweringInquiryId?: any;
  currentAnswerText?: any;
  setCurrentAnswerText?: any;
  currentAnswerAttachments?: any;
  setCurrentAnswerAttachments?: any;
  currentAnswerLinks?: any;
  setCurrentAnswerLinks?: any;
  isSubmittingAnswer?: any;
  handleSetInquiryAnswered?: any;
  handleDeleteInquiry?: any;
  handleUpdateContactedStatus?: any;
  handleMarkInquiryRead?: any;
  handleMarkSentToClinic?: any;
  handleCloseInquiry?: any;
  handleReassignInquiry?: any;
  agentsList?: any;
  setInquiries?: any;

  // ClientCommCard specific props passed down
  clientComms: ClientCommunicationRequest[];
  activeCcHandlingId: string | null;
  setActiveCcHandlingId: (id: string | null) => void;
  ccHandlingNotes: string;
  setCcHandlingNotes: (notes: string) => void;
  ccHandlingPhotos: string[];
  setCcHandlingPhotos: (photos: string[]) => void;
  handleProcessClientComms: (id: string, notes: string, photos: string[]) => void;
  handleDeleteClientComms: (id: string) => void;
  handleTakeClientComm: (id: string) => void;
  handleMarkClientCommDone: (id: string) => void;
}

type SubmissionItem =
  | { type: "inquiry"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: Inquiry }
  | { type: "tabbyTamara"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: TabbyTamaraRequest }
  | { type: "complaint"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: TabbyTamaraComplaint }
  | { type: "clientComm"; id: string; createdAt: string; clinicName: string; phoneNumber: string; status: string; agentName: string; data: ClientCommunicationRequest };

// TODO: Migrate to React context to reduce prop drilling
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
  tlShiftLogs = [],
  tlLoginLogs = [],
  handleTLViewInquiry,
  answeringInquiryId,
  setAnsweringInquiryId,
  currentAnswerText,
  setCurrentAnswerText,
  currentAnswerAttachments,
  setCurrentAnswerAttachments,
  currentAnswerLinks,
  setCurrentAnswerLinks,
  isSubmittingAnswer,
  handleSetInquiryAnswered,
  handleDeleteInquiry,
  handleUpdateContactedStatus,
  handleMarkInquiryRead,
  handleMarkSentToClinic,
  handleCloseInquiry,
  handleReassignInquiry,
  agentsList,
  setInquiries,
  clientComms = [],
  activeCcHandlingId,
  setActiveCcHandlingId,
  ccHandlingNotes,
  setCcHandlingNotes,
  ccHandlingPhotos,
  setCcHandlingPhotos,
  handleProcessClientComms,
  handleDeleteClientComms,
  handleTakeClientComm,
  handleMarkClientCommDone,
}) => {
  // Filters state
  const [filterClinics, setFilterClinics] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [filterPhone, setFilterPhone] = useState<string>("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | "inquiry" | "tabbyTamara" | "complaint" | "clientComm">("all");
  const [sortOldestFirst, setSortOldestFirst] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Expanded card state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!currentUser) return null;

  // Helper to identify if a filter is active
  const todayStr = new Date().toISOString().slice(0, 10);
  const isAnyFilterActive =
    filterClinics.length > 0 ||
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

  const isCcPending = (req: ClientCommunicationRequest) => req.status !== "contacted";

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

  const allClientComms: SubmissionItem[] = (clientComms || []).map((comm) => ({
    type: "clientComm",
    id: comm.id,
    createdAt: comm.createdAt,
    clinicName: comm.clinicName || "",
    phoneNumber: comm.phoneNumber || "",
    status: comm.status || "",
    agentName: comm.callCenterAgentName || comm.openedBy || "Unknown",
    data: comm
  }));

  // Combined master list of items
  const combinedList = [...allInquiries, ...allTTRequests, ...allComplaints, ...allClientComms];

  // Base filtered list (ignores the specific selectedTypeFilter)
  const baseFilteredList = combinedList.filter((item) => {
    // 1. Pending checks per type (Always keep it pending focus, except we search historical)
    // Wait, the specification says: "By default (no filters), show items from inquiries, tabbyTamaraRequests, and tabbyTamaraComplaints where created today and status indicates pending. When any filter is changed from default, REMOVE the today only constraint and instead filter by the selected criteria across all time"
    const isPending =
      item.type === "inquiry" ? isInquiryPending(item.data as Inquiry) :
      item.type === "tabbyTamara" ? isTTPending(item.data as TabbyTamaraRequest) :
      item.type === "complaint" ? isComplaintPending(item.data as TabbyTamaraComplaint) :
      isCcPending(item.data as ClientCommunicationRequest);

    if (!isPending) return false;

    // 2. Clinic filter
    if (filterClinics.length > 0 && item.clinicName && !filterClinics.includes(item.clinicName)) {
      return false;
    }

    // 3. Phone filter
    if (filterPhone.trim() !== "") {
      const qPhone = normalizePhone(filterPhone);
      const itemPhone = normalizePhone(item.phoneNumber);
      if (!itemPhone.includes(qPhone)) {
        return false;
      }
    }

    // 4. Date filter OR Today constraint (Today constraint applies ONLY if NO filter is changed!)
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

  const displayInquiriesCount = baseFilteredList.filter(i => i.type === "inquiry").length;
  const displayTTRequestsCount = baseFilteredList.filter(i => i.type === "tabbyTamara").length;
  const displayComplaintsCount = baseFilteredList.filter(i => i.type === "complaint").length;
  const displayClientCommsCount = baseFilteredList.filter(i => i.type === "clientComm").length;
  const displayTotalCount = baseFilteredList.length;

  const filteredList = selectedTypeFilter === "all" 
    ? baseFilteredList 
    : baseFilteredList.filter(i => i.type === selectedTypeFilter);

  // Sorting
  filteredList.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOldestFirst ? timeA - timeB : timeB - timeA;
  });

  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setFilterClinics([]);
    setFilterDate(new Date().toISOString().slice(0, 10));
    setFilterPhone("");
    setSelectedTypeFilter("all");
    setSortOldestFirst(false);
    toast.info("Filters reset to Today's pending cases!");
  };

  const handleExportData = () => {
    if (filteredList.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportRows = filteredList.map((item) => ({
      Type: item.type === "inquiry" ? "Inquiry" : item.type === "tabbyTamara" ? "Tabby/Tamara" : item.type === "complaint" ? "Complaint" : "Client Comm",
      Reference: formatCaseRef(
        item.id,
        item.type === "inquiry"
          ? "inq"
          : item.type === "tabbyTamara"
          ? "tt_request"
          : item.type === "complaint"
          ? "tt_complaint"
          : "client_comm",
        item.createdAt,
        (item.data as any).caseRef
      ),
      Clinic: getClinicLabel(item.clinicName),
      Phone: item.phoneNumber || "",
      Agent: item.agentName || "",
      Status: item.status || "",
      "Created At": new Date(item.createdAt).toLocaleString(),
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily TL View");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `daily-tl-view-${dateStr}.xlsx`);
    toast.success(`Exported ${exportRows.length} record(s) to Excel.`);
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
    <div className="space-y-6 animate-fade-in p-1 text-left font-sans">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181a20] p-6 rounded-[32px] border-none shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-full">
              <ClipboardList className="w-6 h-6" />
            </div>
            TL Control Center
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl font-medium">
            {isAnyFilterActive ? (
              <span className="text-sky-300 font-bold bg-sky-500/10 px-2.5 py-1 rounded-md">
                ⚠️ Interactive Historical Search Mode active! All-time records matching your filter criteria are displayed.
              </span>
            ) : (
              <span>
                ⚡ Live dispatch panel showing <strong>Today's pending activities</strong>. Submit a lookup filter below to toggle historical search across all time.
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border-none transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Return to Today Only"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" /> Reset to Today
            </button>
          )}

          <button
            onClick={handleExportData}
            disabled={filteredList.length === 0}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border-none rounded-full text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title={filteredList.length === 0 ? "No data to export" : "Export filtered list to Excel"}
          >
            <Download className="w-4 h-4 text-indigo-400" /> Export Data
          </button>

          <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2.5 rounded-full shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
              {filteredList.length} Items Listed
            </span>
          </div>
        </div>
      </div>

      {/* Online Team Leaders Today */}
      <div className="bg-[#181a20] rounded-[24px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-indigo-500/10 text-indigo-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Online Team Leaders Today</h4>
            <p className="text-xs text-slate-400 mt-0.5">Real-time leadership presence and shift logging</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {TEAM_LEADERS.map(tlName => {
            const log = tlLoginLogs.find(l => l.tlName === tlName && l.date === todayStr);
            return (
              <div key={tlName} className="flex items-center gap-2 text-sm bg-[#1f222a] px-4 py-2 rounded-full border-none">
                <div className={`w-2.5 h-2.5 rounded-full ${log?.onlineStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="font-bold text-slate-200">{tlName}</span>
                {log ? (
                  <span className="text-xs text-slate-400 font-mono pl-1 border-l border-white/10 ml-1">First login: {new Date(log.loggedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                ) : (
                  <span className="text-xs text-slate-500 font-mono pl-1 border-l border-white/10 ml-1">Not logged in today</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest px-1">Today at a Glance</h3>
        {/* Summary Clickable Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Click to filter Inquiries */}
          <button
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === "inquiry" ? "all" : "inquiry")}
            className={`p-5 rounded-[24px] border-none transition-transform hover:scale-[1.02] text-left flex flex-col gap-3 cursor-pointer relative overflow-hidden ${
              selectedTypeFilter === "inquiry"
                ? "bg-amber-500/15 shadow-lg ring-1 ring-amber-500/30"
                : "bg-[#1f222a]"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2.5 rounded-full ${selectedTypeFilter === "inquiry" ? "bg-amber-500/20 text-amber-300" : "bg-amber-500/10 text-amber-400"}`}>
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-black/20 text-slate-400 font-mono px-2 py-1 rounded-md">
                {selectedTypeFilter === "inquiry" ? "ACTIVE" : "CLICK"}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-amber-400 uppercase tracking-widest font-bold">Inquiries</p>
              <p className="text-3xl font-black text-white tracking-tight mt-1">{displayInquiriesCount}</p>
            </div>
          </button>

          {/* Click to filter Tabby/Tamara */}
          <button
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === "tabbyTamara" ? "all" : "tabbyTamara")}
            className={`p-5 rounded-[24px] border-none transition-transform hover:scale-[1.02] text-left flex flex-col gap-3 cursor-pointer relative overflow-hidden ${
              selectedTypeFilter === "tabbyTamara"
                ? "bg-[#2bc9d7]/15 shadow-lg ring-1 ring-[#2bc9d7]/30"
                : "bg-[#1f222a]"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2.5 rounded-full ${selectedTypeFilter === "tabbyTamara" ? "bg-[#2bc9d7]/20 text-[#2bc9d7]" : "bg-[#2bc9d7]/10 text-[#2bc9d7]"}`}>
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-black/20 text-slate-400 font-mono px-2 py-1 rounded-md">
                {selectedTypeFilter === "tabbyTamara" ? "ACTIVE" : "CLICK"}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-[#2bc9d7] uppercase tracking-widest font-bold">Alternative Pay</p>
              <p className="text-3xl font-black text-white tracking-tight mt-1">{displayTTRequestsCount}</p>
            </div>
          </button>

          {/* Click to filter Complaints */}
          <button
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === "complaint" ? "all" : "complaint")}
            className={`p-5 rounded-[24px] border-none transition-transform hover:scale-[1.02] text-left flex flex-col gap-3 cursor-pointer relative overflow-hidden ${
              selectedTypeFilter === "complaint"
                ? "bg-rose-500/15 shadow-lg ring-1 ring-rose-500/30"
                : "bg-[#1f222a]"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2.5 rounded-full ${selectedTypeFilter === "complaint" ? "bg-rose-500/20 text-rose-300" : "bg-rose-500/10 text-rose-400"}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-black/20 text-slate-400 font-mono px-2 py-1 rounded-md">
                {selectedTypeFilter === "complaint" ? "ACTIVE" : "CLICK"}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-rose-400 uppercase tracking-widest font-bold">Complaints</p>
              <p className="text-3xl font-black text-white tracking-tight mt-1">{displayComplaintsCount}</p>
            </div>
          </button>

          {/* Click to filter Client Communications */}
          <button
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === "clientComm" ? "all" : "clientComm")}
            className={`p-5 rounded-[24px] border-none transition-transform hover:scale-[1.02] text-left flex flex-col gap-3 cursor-pointer relative overflow-hidden ${
              selectedTypeFilter === "clientComm"
                ? "bg-indigo-500/15 shadow-lg ring-1 ring-indigo-500/30"
                : "bg-[#1f222a]"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2.5 rounded-full ${selectedTypeFilter === "clientComm" ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-500/10 text-indigo-400"}`}>
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-black/20 text-slate-400 font-mono px-2 py-1 rounded-md">
                {selectedTypeFilter === "clientComm" ? "ACTIVE" : "CLICK"}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-indigo-400 uppercase tracking-widest font-bold">Client Comm</p>
              <p className="text-3xl font-black text-white tracking-tight mt-1">{displayClientCommsCount}</p>
            </div>
          </button>

          {/* Combined total */}
          <button
            onClick={() => setSelectedTypeFilter("all")}
            className={`p-5 rounded-[24px] border-none transition-transform hover:scale-[1.02] text-left flex flex-col gap-3 cursor-pointer relative overflow-hidden ${
              selectedTypeFilter === "all"
                ? "bg-white/10 shadow-lg ring-1 ring-white/20"
                : "bg-[#1f222a]"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2.5 rounded-full bg-white/10 text-slate-300">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-md border border-emerald-500/20 font-black">
                {isAnyFilterActive ? "FILTERED" : "TODAY"}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Combined Queue</p>
              <p className="text-2xl font-black text-slate-100 tracking-tight">{displayTotalCount}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Filter bar exactly as specified */}
      <div className="bg-[#181a20] p-6 rounded-[32px] gap-4 grid grid-cols-1 md:grid-cols-12 items-end">
        {/* Clinic Dropdown */}
        <div className="md:col-span-3 space-y-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1.5 ml-1">
              <Building className="w-4 h-4 text-slate-500" /> Clinics (Multi)
            </label>
            {filterClinics.length > 0 && (
              <button
                onClick={() => setFilterClinics([])}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <select
            value={""}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setFilterClinics(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
                setCurrentPage(1);
              }
            }}
            className="w-full bg-[#1f222a] border-none rounded-2xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none h-12 cursor-pointer font-medium appearance-none"
          >
            <option value="">➕ Add Clinic to Filter...</option>
            {CLINIC_OPTIONS.filter(c => !filterClinics.includes(c.value)).map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {filterClinics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {filterClinics.map(c => {
                const label = CLINIC_OPTIONS.find(opt => opt.value === c)?.label || c;
                return (
                  <span key={c} className="bg-emerald-500/10 text-emerald-300 border-none px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5">
                    {label}
                    <button onClick={() => setFilterClinics(prev => prev.filter(x => x !== c))} className="hover:text-white cursor-pointer">&times;</button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="md:col-span-3 space-y-2 relative">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1.5 ml-1">
              <Calendar className="w-4 h-4 text-slate-500" /> Date
            </label>
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-[#1f222a] border-none rounded-2xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none h-12 cursor-pointer font-medium"
          />
        </div>

        {/* Phone number Search */}
        <div className="md:col-span-3 space-y-2 text-left">
          <label className="text-xs text-slate-400 font-bold flex items-center gap-1.5 ml-1">
            <Phone className="w-4 h-4 text-slate-500" /> Phone Partial Lookup
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. +9715..."
              value={filterPhone}
              onChange={(e) => {
                setFilterPhone(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#1f222a] border-none rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none h-12 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
          </div>
        </div>

        {/* Sorting toggle for SLA */}
        <div className="md:col-span-3 pb-1">
          <button
            type="button"
            onClick={() => setSortOldestFirst(!sortOldestFirst)}
            className={`w-full h-12 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-none ${
              sortOldestFirst
                ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                : "bg-[#1f222a] text-slate-300 hover:bg-[#282c35]"
            }`}
          >
            <ArrowUpDown className="w-4 h-4 shrink-0" />
            {sortOldestFirst ? "⚠️ Oldest First" : "🗓️ Latest First"}
          </button>
        </div>
      </div>

      {/* Dispatch queue combined list */}
      <div className="bg-[#181a20] p-1 rounded-[32px] shadow-sm border-none overflow-hidden mt-6">
        <div className="p-6">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400" /> Unified Case Pipeline
          </h3>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Matched dispatch cases in queue: <strong className="text-indigo-400">{filteredList.length}</strong>
          </p>
        </div>

        <div className="max-h-[700px] overflow-y-auto w-full px-5 pb-5">
          {filteredList.length === 0 ? (
          <div className="p-16 text-center space-y-2 animate-fade-in bg-[#1f222a] rounded-[24px]">
            <div className="w-12 h-12 rounded-full bg-[#282c35] flex items-center justify-center mx-auto text-slate-400 mb-2">
              <Filter className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-white">
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
          <div className="flex flex-col w-full space-y-3 pt-2">
          {(() => {
            return paginatedList.map((item) => {
              const uniqueKey = `${item.type}-${item.id}`;
              const isExpanded = expandedId === uniqueKey;

              if (item.type === "tabbyTamara") {
                return (
                  <TabbyTamaraCard
                    key={uniqueKey}
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
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : uniqueKey)}
                  />
                );
              }

              if (item.type === "complaint") {
                return (
                  <ComplaintCard
                    key={uniqueKey}
                    comp={item.data}
                    currentUser={currentUser}
                    isTLOreSupport={isTLOreSupport}
                    isSuperAdmin={isSuperAdmin}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : uniqueKey)}
                    activeComplaintHandlingId={activeComplaintHandlingId}
                    setActiveComplaintHandlingId={setActiveComplaintHandlingId}
                    tlComplaintResolutionType={tlComplaintResolutionType}
                    setTlComplaintResolutionType={setTlComplaintResolutionType}
                    tlComplaintComment={tlComplaintComment}
                    setTlComplaintComment={setTlComplaintComment}
                    handleTLCommentComplaint={handleTLCommentComplaint}
                    handleToggleContactComplaint={handleToggleContactComplaint}
                    handleDeleteComplaint={handleDeleteComplaint}
                    handleAssignRecord={handleAssignRecord}
                    addSystemNotification={addSystemNotification}
                    canEditItem={canEditItem}
                    getRemainingEditTime={getRemainingEditTime}
                    setEditingItem={(editingItem: any) => onEditItem(editingItem.type, editingItem.data)}
                    getElapsedTimerString={getElapsedTimerString}
                  />
                );
              }

              if (item.type === "inquiry") {
                return (
                  <InquiryCard
                    key={uniqueKey}
                    inq={item.data as any}
                    currentUser={currentUser}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : uniqueKey)}
                    isTLOreSupport={isTLOreSupport}
                    isSuperAdmin={isSuperAdmin}
                    handleTLViewInquiry={handleTLViewInquiry}
                    canEditItem={canEditItem}
                    getRemainingEditTime={getRemainingEditTime}
                    setEditingItem={(editingItem: any) => onEditItem(editingItem.type, editingItem.data)}
                    addSystemNotification={addSystemNotification}
                    answeringInquiryId={answeringInquiryId}
                    setAnsweringInquiryId={setAnsweringInquiryId}
                    currentAnswerText={currentAnswerText}
                    setCurrentAnswerText={setCurrentAnswerText}
                    currentAnswerAttachments={currentAnswerAttachments}
                    setCurrentAnswerAttachments={setCurrentAnswerAttachments}
                    currentAnswerLinks={currentAnswerLinks}
                    setCurrentAnswerLinks={setCurrentAnswerLinks}
                    isSubmittingAnswer={isSubmittingAnswer}
                    handleSetInquiryAnswered={handleSetInquiryAnswered}
                    handleDeleteInquiry={handleDeleteInquiry}
                    handleUpdateContactedStatus={handleUpdateContactedStatus}
                    handleMarkInquiryRead={handleMarkInquiryRead}
                    handleMarkSentToClinic={handleMarkSentToClinic}
                    handleCloseInquiry={handleCloseInquiry}
                    handleReassignInquiry={handleReassignInquiry}
                    agentsList={agentsList}
                    inquiries={inquiries}
                    setInquiries={setInquiries}
                  />
                );
              }

              if (item.type === "clientComm") {
                return (
                  <ClientCommCard
                    key={uniqueKey}
                    comm={item.data}
                    currentUser={currentUser}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : uniqueKey)}
                    isTLOreSupport={isTLOreSupport}
                    isSuperAdmin={isSuperAdmin}
                    activeCcHandlingId={activeCcHandlingId}
                    setActiveCcHandlingId={setActiveCcHandlingId}
                    ccHandlingNotes={ccHandlingNotes}
                    setCcHandlingNotes={setCcHandlingNotes}
                    ccHandlingPhotos={ccHandlingPhotos}
                    setCcHandlingPhotos={setCcHandlingPhotos}
                    handleProcessClientComms={handleProcessClientComms}
                    handleDeleteClientComms={handleDeleteClientComms}
                    canEditItem={canEditItem}
                    getRemainingEditTime={getRemainingEditTime}
                    setEditingItem={(editingItem: any) => onEditItem(editingItem.type, editingItem.data)}
                    handleTakeClientComm={handleTakeClientComm}
                    handleMarkClientCommDone={handleMarkClientCommDone}
                    addSystemNotification={addSystemNotification}
                    getElapsedTimerString={getElapsedTimerString}
                  />
                );
              }

              return null;
            });
          })()}
          </div>
        )}
        </div>
        
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </div>
  );
};
