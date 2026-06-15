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
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { RequestReplyThread } from "./RequestReplyThread";
import { SlideToConfirm } from "./SlideToConfirm";
import { CopyWrap } from "./CopyWrap";
import { Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint, ClientCommunicationRequest, User as UserType } from "../types";
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
  const [filterClinic, setFilterClinic] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [filterPhone, setFilterPhone] = useState<string>("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | "inquiry" | "tabbyTamara" | "complaint" | "clientComm">("all");
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

  // Under the "default today only" view: find count of items created today & strictly pending
  const todayPendingInquiriesCount = allInquiries.filter(i => isToday(i.createdAt) && isInquiryPending(i.data as any)).length;
  const todayPendingTTRequestsCount = allTTRequests.filter(i => isToday(i.createdAt) && isTTPending(i.data as any)).length;
  const todayPendingComplaintsCount = allComplaints.filter(i => isToday(i.createdAt) && isComplaintPending(i.data as any)).length;
  const todayPendingClientCommsCount = allClientComms.filter(i => isToday(i.createdAt) && isCcPending(i.data as any)).length;

  // Under default today view, combined pending today
  const combinedPendingTodayAll = todayPendingInquiriesCount + todayPendingTTRequestsCount + todayPendingComplaintsCount + todayPendingClientCommsCount;

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

  const displayClientCommsCount = isAnyFilterActive
    ? combinedList.filter(i => i.type === "clientComm" && isCcPending(i.data as any) &&
        (filterClinic === "all" || i.clinicName?.toLowerCase() === filterClinic.toLowerCase()) &&
        (!filterDate || i.createdAt.startsWith(filterDate)) &&
        (!filterPhone || normalizePhone(i.phoneNumber).includes(normalizePhone(filterPhone)))
      ).length
    : todayPendingClientCommsCount;

  const displayTotalCount = displayInquiriesCount + displayTTRequestsCount + displayComplaintsCount + displayClientCommsCount;

  // Filter the list based on state criteria
  const filteredList = combinedList.filter((item) => {
    // 1. Pending checks per type (Always keep it pending focus, except we search historical)
    // Wait, the specification says: "By default (no filters), show items from inquiries, tabbyTamaraRequests, and tabbyTamaraComplaints where created today and status indicates pending. When any filter is changed from default, REMOVE the today only constraint and instead filter by the selected criteria across all time"
    const isPending =
      item.type === "inquiry" ? isInquiryPending(item.data as Inquiry) :
      item.type === "tabbyTamara" ? isTTPending(item.data as TabbyTamaraRequest) :
      item.type === "complaint" ? isComplaintPending(item.data as TabbyTamaraComplaint) :
      isCcPending(item.data as ClientCommunicationRequest);

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
    <div className="space-y-6 animate-fade-in p-1 text-left">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-emerald-400" /> Daily Team Leader View
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

          <button
            onClick={handleExportData}
            disabled={filteredList.length === 0}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title={filteredList.length === 0 ? "No data to export" : "Export filtered list to Excel"}
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" /> Export Data
          </button>

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

        {/* Click to filter Client Communications */}
        <button
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === "clientComm" ? "all" : "clientComm")}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden ${
            selectedTypeFilter === "clientComm"
              ? "bg-indigo-500/15 border-indigo-500/40 shadow-lg ring-1 ring-indigo-500/20"
              : "bg-[#18181c]/65 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${selectedTypeFilter === "clientComm" ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-500/10 text-indigo-400"}`}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Client Comm</p>
              <p className="text-lg font-bold text-slate-100 mt-0.5">{displayClientCommsCount} pending</p>
            </div>
          </div>
          <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
            {selectedTypeFilter === "clientComm" ? "ACTIVE" : "CLICK"}
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
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full font-black font-semibold">
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
      <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-base font-bold text-slate-100 font-display">
            Dispatcher Combined Case Pipeline
          </h3>
          <p className="text-xs text-slate-400">
            Total matched dispatch cases waiting in queue: {filteredList.length}
          </p>
        </div>

        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
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
          (() => {
            console.log("[GlobalDashboard] filteredList:", filteredList.length, filteredList.map(i => ({id: i.id, type: i.type})));
            return filteredList.map((item) => {
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
        })()
        )}
        </div>
      </div>
    </div>
  );
};
