import React, { useState, useEffect, useRef } from "react";
import {
  Copy,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Phone,
  CheckCircle2,
  Hospital,
  Hash,
  User,
  Calendar,
  DollarSign,
  PenTool,
  Trash2,
  Pencil,
  Check,
  Clock,
  CheckIcon,
  Download,
  LinkIcon,
  FileText,
  Share,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { doc, arrayUnion } from "firebase/firestore";
import { db, wrappedUpdateDoc as updateDoc } from "../firebase";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { CaseTimeline } from "./CaseTimeline";
import { RequestReplyThread } from "./RequestReplyThread";
import { MultiAttachmentUpload } from "./MultiAttachmentUpload";
import { SlideToConfirm } from "./SlideToConfirm";
import {
  getClinicLabel,
  formatCaseRef,
  normalizePhone,
  formatPhoneForCopy,
  formatPhoneLocalForCopy,
  copyToClipboard,
  extractLinks,
  normalizeUrl,
  getSafeTTWorkflowStatus,
  getSafeTTSourceChannel,
  getAgentLOB,
  buildCaseClipboardPayload,
  normalizeAttachments,
  calculateTabbyTamaraPrice,
  generateInquiryCopyText,
  generateComplaintCopyText,
  generateTabbyTamaraCopyText,
} from "../utils";
import { AGENT_LOBS } from "../types";
import { assignCase } from "../services/assignmentService";

// REUSABLE COMPONENTS

const StatusBadge = ({
  status,
  customerContacted,
  workflowStatus,
  className = "",
}: any) => {
  if (workflowStatus === "completed") {
    return (
      <span
        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 ${className}`}
      >
        ✅ Closed
      </span>
    );
  } else if (status === "not_confirmed") {
    return (
      <span
        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5" /> Pending TL
      </span>
    );
  } else if (status === "rejected") {
    return (
      <span
        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1.5 ${className}`}
      >
        <Trash2 className="w-3.5 h-3.5" /> Rejected
      </span>
    );
  } else if (status === "confirmed" && customerContacted === "contacted") {
    return (
      <span
        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> Contacted
      </span>
    );
  } else {
    return (
      <span
        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1.5 ${className}`}
      >
        <Clock className="w-3.5 h-3.5" /> Contact Pending
      </span>
    );
  }
};

const ProviderGlowBadge = ({ platform, className = "" }: any) => {
  let colorClass =
    "from-slate-500/20 to-slate-500/5 text-slate-400 border-slate-500/20";
  let label = platform?.toUpperCase() || "N/A";
  if (platform === "tabby") {
    colorClass =
      "from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/20";
  } else if (platform === "tamara") {
    colorClass =
      "from-rose-500/20 to-rose-500/5 text-rose-500 border-rose-500/20";
  } else if (platform === "one_time_payment") {
    colorClass =
      "from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/20";
    label = "ONE TIME PAID";
  }

  return (
    <span
      className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-widest uppercase border bg-gradient-to-r flex items-center gap-1 ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
};

const CRMField = ({
  icon: Icon,
  label,
  value,
  isBold,
  onClick,
  valueClass = "text-slate-300",
}: any) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
      return;
    }
    const isPhone = label === "Phone" || /^(\+971|0)\d{9}/.test(String(value));
    const copyValue = isPhone
      ? String(value)
          .replace(/^0+/, "")
          .replace(/^\+971\s?/, "")
      : String(value);
    const msg = isPhone ? "Phone copied (starts from 5)" : `${label} copied!`;
    const ok = await copyToClipboard(copyValue, msg);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="flex flex-col gap-1.5 p-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group text-left border border-transparent hover:border-slate-700/40"
      onClick={handleCopy}
    >
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold tracking-widest uppercase">
        <span className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-600" /> {label}
        </span>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <div
        className={`text-sm break-words leading-tight ${isBold ? "font-bold" : "font-medium"} ${valueClass}`}
        title={String(value)}
      >
        {value}
      </div>
    </div>
  );
};

const TimelineStep = ({
  completed,
  label,
  active,
}: {
  completed: boolean;
  label: string;
  active?: boolean;
}) => (
  <div
    className={`flex flex-col items-center shrink-0 w-24 sm:w-32 z-10 ${completed || active ? "opacity-100" : "opacity-70"}`}
  >
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-black/30 transition-colors ${completed ? "border-indigo-500 bg-indigo-500/10" : active ? "border-slate-500" : "border-slate-800"}`}
    >
      {completed && <Check className="w-3.5 h-3.5 text-indigo-400" />}
    </div>
    <span
      className={`text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-wide text-center ${completed ? "text-indigo-400" : active ? "text-slate-300" : "text-slate-600"}`}
    >
      {label}
    </span>
  </div>
);

export const TabbyTamaraCard = ({
  req,
  currentUser,
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
  getElapsedTimerString,
  handleDeleteTabbyTamara,
  canEditItem,
  getRemainingEditTime,
  editLimitMs,
  setEditingItem,
  addSystemNotification,
  isExpanded,
  onToggle,
}: any) => {
  const hasAttachments = Boolean(
    (req.photos && req.photos.length > 0) ||
    (req.links && req.links.length > 0) ||
    req.paymentScreenshot,
  );
  const [expandedNotes, setExpandedNotes] = useState(
    Boolean(req.notes || hasAttachments),
  );

  const [isContactingMode, setIsContactingMode] = useState(false);
  const [contactNotes, setContactNotes] = useState("");
  const [contactPhotos, setContactPhotos] = useState<string[]>([]);
  const [isContactingUploading, setIsContactingUploading] = useState(false);

  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpPhotos, setFollowUpPhotos] = useState<string[]>([]);
  const [followUpUploading, setFollowUpUploading] = useState(false);

  // CRM States & Workflow Derived Properties
  const workflowStatus = getSafeTTWorkflowStatus(req);
  const sourceChannel = getSafeTTSourceChannel(req);
  const userLOB = getAgentLOB(currentUser?.name || "");

  const isSocialMedia = userLOB === "Chat";
  const isUnassigned = !req.assignedToId;
  const isCallCenterRequest = sourceChannel === "call_center";
  const isSubmitter =
    (req.submittedByName || req.agentName)?.toLowerCase() ===
    currentUser?.name?.toLowerCase();
  const canClaim =
    (isSocialMedia && isUnassigned && isCallCenterRequest) ||
    (isSubmitter &&
      isUnassigned &&
      workflowStatus === "awaiting_client_contact");

  // Reassign / Assign State
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const assignDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        assignDropdownRef.current &&
        !assignDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAssignDropdown(false);
      }
    }
    if (showAssignDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAssignDropdown]);

  useEffect(() => {
    if (!showAssignDropdown) {
      setAssignSearchQuery("");
    }
  }, [showAssignDropdown]);

  const allAgents = Object.keys(AGENT_LOBS).sort((a, b) => a.localeCompare(b));
  const filteredAgents = allAgents.filter((agentName) =>
    agentName.toLowerCase().includes(assignSearchQuery.toLowerCase()),
  );

  const socialMediaAgents = Object.entries(AGENT_LOBS)
    .filter(([_, lob]) => lob === "Chat")
    .map(([name]) => name);

  // Client Materials Mode
  const [isCrmMaterialsMode, setIsCrmMaterialsMode] = useState(false);
  const [clientIdPhotos, setClientIdPhotos] = useState<string[]>([]);
  const [paymentProofPhotos, setPaymentProofPhotos] = useState<string[]>([]);
  const [isClientIdUploading, setIsClientIdUploading] = useState(false);
  const [isPaymentProofUploading, setIsPaymentProofUploading] = useState(false);

  const [tlFormPhotos, setTlFormPhotos] = useState<string[]>([]);
  const [tlFormLinks, setTlFormLinks] = useState<string[]>([]);
  const [tlFormUploading, setTlFormUploading] = useState(false);
  const [crmContactNotes, setCrmContactNotes] = useState("");

  // Sent To Partner Panel
  const [showPartnerPanel, setShowPartnerPanel] = useState(false);
  const [partnerPhotos, setPartnerPhotos] = useState<string[]>([]);
  const [isPartnerUploading, setIsPartnerUploading] = useState(false);
  const [partnerNotes, setPartnerNotes] = useState("");
  const [isPartnerSubmitting, setIsPartnerSubmitting] = useState(false);

  const handleClaimRequest = async () => {
    try {
      const claimActivity = {
        id: "act_" + Math.random().toString(36).substring(2, 11),
        senderName: "System",
        authorId: "system",
        authorRole: "system",
        text: `${currentUser.name} claimed this request. Assigned to ${currentUser.name}. Status set to: Awaiting Client Contact.`,
        createdAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "tt_requests", req.id), {
        assignedToId:
          currentUser.id ||
          currentUser.uid ||
          "usr_" + currentUser.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
        assignedToName: currentUser.name,
        assignedAt: new Date().toISOString(),
        assignedById:
          currentUser.id ||
          currentUser.uid ||
          "usr_" + currentUser.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
        assignedByName: currentUser.name,
        workflowStatus: "awaiting_client_contact",
        replies: arrayUnion(claimActivity),
      });

      if (addSystemNotification) {
        addSystemNotification(
          "Claimed: Tabby/Tamara Request",
          `You claimed request ${formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef)} submitted by ${req.submittedByName || req.agentName}.`,
          "general",
          currentUser.name,
          undefined,
          "tt_request",
          req.id,
        );
        addSystemNotification(
          "Claimed: Tabby/Tamara Request",
          `${currentUser.name} claimed request ${formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef)} submitted by ${req.submittedByName || req.agentName}.`,
          "general",
          req.submittedByName || req.agentName,
          undefined,
          "tt_request",
          req.id,
        );
        addSystemNotification(
          "Claimed: Tabby/Tamara Request",
          `${currentUser.name} claimed request ${formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef)} submitted by ${req.submittedByName || req.agentName}.`,
          "general",
          "tl",
          undefined,
          "tt_request",
          req.id,
        );
      }
      toast.success("Request claimed successfully!");
    } catch (err: any) {
      toast.error("Failed to claim request: " + err.message);
    }
  };

  const handleAssignAgent = async (agentName: string) => {
    try {
      setIsAssigning(true);

      const assigneeId =
        "usr_" + agentName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

      // Central assignment service call
      const success = await assignCase(
        "tt_request",
        req.id,
        { id: assigneeId, name: agentName },
        currentUser,
      );

      if (!success) {
        toast.error("Failed to assign — please try again.");
        return;
      }

      if (addSystemNotification) {
        addSystemNotification(
          "Assigned: Tabby/Tamara Request",
          `You have been assigned to handle Tabby/Tamara request for ${req.patientName}.`,
          "general",
          agentName,
          undefined,
          "tt_request",
          req.id,
        );
        addSystemNotification(
          "Assigned: Tabby/Tamara Request",
          `${currentUser.name} assigned request ${formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef)} to ${agentName}.`,
          "general",
          req.submittedByName || req.agentName,
          undefined,
          "tt_request",
          req.id,
        );
      }
      setShowAssignDropdown(false);
      toast.success(`Request assigned to ${agentName}!`);
    } catch (err: any) {
      toast.error("Failed to assign request: " + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSendToPartner = async () => {
    try {
      setIsPartnerSubmitting(true);
      const partnerAtts = normalizeAttachments(partnerPhotos);

      const sendActivity = {
        id: "act_" + Math.random().toString(36).substring(2, 11),
        senderName: "System",
        authorId: "system",
        authorRole: "system",
        text: `${currentUser.name} sent case to partner. Case officially completed with notes: "${partnerNotes || "None"}".`,
        createdAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "tt_requests", req.id), {
        workflowStatus: "sent_to_partner",
        partnerSentAt: new Date().toISOString(),
        partnerSentById:
          currentUser.id ||
          currentUser.uid ||
          "usr_" + currentUser.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
        partnerSentByName: currentUser.name,
        partnerAttachments: partnerAtts,
        partnerNotes: partnerNotes,
        status: "confirmed",
        replies: arrayUnion(sendActivity),
      });

      if (addSystemNotification) {
        const targets = Array.from(
          new Set([req.assignedToName, req.submittedByName, req.agentName]),
        ).filter(Boolean);
        targets.forEach((target) => {
          addSystemNotification(
            "Sent to Partner — Case Completed",
            `The Tabby/Tamara request for ${req.patientName} has been submitted to partner.`,
            "general",
            target,
            undefined,
            "tt_request",
            req.id,
          );
        });
        addSystemNotification(
          "Sent to Partner — Case Completed",
          `Request ${formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef)} for ${req.patientName} marked sent to partner by ${currentUser.name}.`,
          "general",
          "tl",
          undefined,
          "tt_request",
          req.id,
        );
      }
      setShowPartnerPanel(false);
      toast.success("Case successfully sent to partner and completed!");
    } catch (err: any) {
      toast.error("Failed to send to partner: " + err.message);
    } finally {
      setIsPartnerSubmitting(false);
    }
  };

  const isPendingContact =
    req.status === "confirmed" && req.customerContacted === "not_contacted";
  const elapsedMins =
    req.confirmedAt && req.customerContacted !== "contacted"
      ? (Date.now() - new Date(req.confirmedAt).getTime()) / 60000
      : 0;
  const isOverdue = elapsedMins > 60;
  const isWarning = elapsedMins > 30 && !isOverdue;

  const getAllAttachments = () => {
    const rawPhotos = [
      ...(req.photos || []),
      ...(req.screenshot ? [req.screenshot] : []),
      ...(req.paymentScreenshot ? [req.paymentScreenshot] : []),
      ...(req.imageUrl ? [req.imageUrl] : []),
      ...(req.attachments || []),
    ];
    if (Array.isArray(req.replies)) {
      req.replies.forEach((reply: any) => {
        if (reply.photos) rawPhotos.push(...reply.photos);
        if (reply.screenshot) rawPhotos.push(reply.screenshot);
        if (reply.imageUrl) rawPhotos.push(reply.imageUrl);
        if (reply.attachments) rawPhotos.push(...reply.attachments);
      });
    }
    return Array.from(new Set(rawPhotos)).filter(Boolean);
  };

  const buildRequestText = (request: any, attachments: string[]) => {
    let photoLines = "";
    if (attachments.length > 0) {
      photoLines =
        `\nAttachments (${attachments.length}):\n` +
        attachments
          .map((att, idx) => {
            const isPdf =
              typeof att === "string" &&
              (att.includes("application/pdf") || att.includes(".pdf"));
            if (typeof att === "string" && att.startsWith("http")) {
              return `- attachment-${idx + 1}${isPdf ? ".pdf" : ".jpg"}: ${att}`;
            }
            return `- attachment-${idx + 1}${isPdf ? ".pdf" : ".jpg"}`;
          })
          .join("\n");
    }
    const linkLines =
      (request.links || []).length > 0
        ? `\nLinks:\n${(request.links || []).map(normalizeUrl).join("\n")}`
        : "";
    const tlLinkLines = request.tlLinks
      ? `\nTL Links:\n${extractLinks(request.tlLinks).map(normalizeUrl).join("\n")}`
      : "";

    const pricing = calculateTabbyTamaraPrice(request.priceWithoutTax || 0);

    return [
      `[${request.platform?.toUpperCase() || "N/A"}] Request - ${request.patientName || "Unknown"}`,
      `Ref: ${formatCaseRef(request.id, "tt_request", request.createdAt, request.caseRef)}`,
      `File: ${request.fileNumber || "N/A"} | Phone: ${formatPhoneForCopy(request.phoneNumber)}`,
      `Clinic: ${getClinicLabel(request.clinicName)}`,
      `Entered Amount: ${pricing.priceBeforeFeeFormatted}`,
      `5% Added: ${pricing.feeAmountFormatted}`,
      `Final Amount: ${pricing.finalPriceFormatted}`,
      `Status: ${request.status}`,
      request.paymentLink
        ? `Payment Link: ${normalizeUrl(request.paymentLink)}`
        : "",
      request.notes ? `Agent Notes:\n${request.notes}` : "",
      request.tlNotes ? `TL Notes:\n${request.tlNotes}` : "",
      request.agentContactNotes
        ? `Contact Notes:\n${request.agentContactNotes}`
        : "",
      linkLines,
      tlLinkLines,
      photoLines,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const buildRequestHtml = (request: any, attachments: string[]) => {
    let html = `<div><strong>[${request.platform?.toUpperCase() || "N/A"}] Request - ${request.patientName || "Unknown"}</strong><br/>`;
    html += `Ref: ${formatCaseRef(request.id, "tt_request", request.createdAt, request.caseRef)}<br/>`;
    html += `File: ${request.fileNumber || "N/A"} | Phone: ${formatPhoneForCopy(request.phoneNumber)}<br/>`;
    html += `Clinic: ${getClinicLabel(request.clinicName)}<br/>`;

    const pricing = calculateTabbyTamaraPrice(request.priceWithoutTax || 0);
    html += `Entered Amount: ${pricing.priceBeforeFeeFormatted}<br/>`;
    html += `5% Added: ${pricing.feeAmountFormatted}<br/>`;
    html += `Final Amount: ${pricing.finalPriceFormatted}<br/>`;
    html += `Status: ${request.status}<br/>`;

    if (request.paymentLink)
      html += `Payment Link: <a href="${normalizeUrl(request.paymentLink)}" target="_blank" rel="noopener">${normalizeUrl(request.paymentLink)}</a><br/>`;
    if (request.notes)
      html += `Agent Notes:<br/>${request.notes.replace(/\n/g, "<br/>")}<br/>`;
    if (request.tlNotes)
      html += `TL Notes:<br/>${request.tlNotes.replace(/\n/g, "<br/>")}<br/>`;
    if (request.agentContactNotes)
      html += `Contact Notes:<br/>${request.agentContactNotes.replace(/\n/g, "<br/>")}<br/>`;

    if ((request.links || []).length > 0) {
      html += `Links:<br/>${(request.links || []).map((l: string) => `<a href="${normalizeUrl(l)}">${normalizeUrl(l)}</a>`).join("<br/>")}<br/>`;
    }
    if (request.tlLinks) {
      html += `TL Links:<br/>${extractLinks(request.tlLinks)
        .map((l) => `<a href="${normalizeUrl(l)}">${normalizeUrl(l)}</a>`)
        .join("<br/>")}<br/>`;
    }

    if (attachments.length > 0) {
      html += `<br/><strong>Attachments (${attachments.length}):</strong><br/>`;
      attachments.forEach((att, idx) => {
        const isPdf =
          typeof att === "string" &&
          (att.includes("application/pdf") || att.includes(".pdf"));
        if (isPdf) {
          html += `<a href="${att}">attachment-${idx + 1}.pdf</a><br/>`;
        } else {
          html += `<img src="${att}" alt="attachment-${idx + 1}" style="max-height: 300px; max-width: 100%; margin-top: 8px; display: block;" /><br/>`;
        }
      });
    }
    html += `</div>`;
    return html;
  };

  const handleCopyTextOnly = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text =
      req.platform === "tabby" ||
      req.platform === "tamara" ||
      req.platform === "one_time_payment" ||
      req.requestType === "tabby" ||
      req.requestType === "tamara"
        ? generateTabbyTamaraCopyText(req)
        : generateComplaintCopyText(req);
    const success = await copyToClipboard(
      text,
      "Report details copied successfully!",
    );
    if (!success) {
      toast.error("Failed to copy request details.");
    }
  };

  const handleShareAction = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const payload = buildCaseClipboardPayload(req);
    const uniquePhotos = getAllAttachments();

    const tempFiles: File[] = [];

    for (let i = 0; i < uniquePhotos.length; i++) {
      const photo = uniquePhotos[i];
      if (typeof photo === "string" && photo.startsWith("data:")) {
        try {
          const res = await fetch(photo);
          const blob = await res.blob();
          const mimeType = blob.type;
          let ext = mimeType.split("/")[1] || "jpeg";
          // handle simple mime type extractions or defaults
          if (mimeType.includes("pdf")) ext = "pdf";
          const file = new File([blob], `attachment-${i + 1}.${ext}`, {
            type: mimeType,
          });
          tempFiles.push(file);
        } catch (err) {
          console.error("Error converting photo", err);
        }
      }
    }

    const shareData: ShareData = {
      title: `Request ${formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef)}`,
      text: payload.text,
    };

    try {
      if (navigator.share) {
        if (
          tempFiles.length > 0 &&
          navigator.canShare &&
          navigator.canShare({ files: tempFiles })
        ) {
          await navigator.share({ ...shareData, files: tempFiles });
          toast.success("Request details and attachments shared successfully!");
        } else {
          await navigator.share({
            title: shareData.title,
            text: shareData.text,
          });
          toast.success("Request details shared successfully!");
          if (tempFiles.length > 0) {
            toast.info(
              "Request details shared. Download or share the attachments separately.",
            );
          }
        }
      } else {
        await handleCopyTextOnly(e);
        toast.info(
          "Request details copied. Download or share the attachments separately.",
        );
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Failed to share request.");
        console.error(err);
      }
    }
  };

  const isApproved = req.status === "confirmed";
  const isRejected = req.status === "rejected";
  const isContacted = req.customerContacted === "contacted";

  let borderColor =
    "border-t-slate-500/80 shadow-[0_4px_24px_rgba(15,15,25,0.4)]";
  if (req.platform === "tabby")
    borderColor =
      "border-t-amber-500/80 shadow-[0_4px_24px_rgba(245,158,11,0.03)]";
  else if (req.platform === "tamara")
    borderColor =
      "border-t-rose-500/80 shadow-[0_4px_24px_rgba(244,63,94,0.03)]";
  else if (req.platform === "one_time_payment")
    borderColor =
      "border-t-blue-500/80 shadow-[0_4px_24px_rgba(59,130,246,0.03)]";

  const pricing = calculateTabbyTamaraPrice(req.priceWithoutTax || 0);

  return (
    <div
      id={`request-${req.id}`}
      className={`p-5 bg-white/5 border border-white/[0.08] rounded-[24px] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300 relative flex flex-col w-full overflow-hidden shadow-sm ${
        isExpanded
          ? "shadow-md ring-1 ring-white/10 space-y-4"
          : "cursor-pointer hover:shadow-md"
      }`}
      onClick={() => {
        if (!isExpanded && onToggle) {
          onToggle();
        }
      }}
    >
      <div
        className={`absolute top-0 bottom-0 left-0 w-[5px] ${
          req.platform === "tabby"
            ? "bg-amber-500"
            : req.platform === "tamara"
              ? "bg-rose-500"
              : req.platform === "one_time_payment"
                ? "bg-blue-500"
                : "bg-slate-700"
        }`}
      />

      {/* Unexpanded / Header State */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full ${isExpanded ? "border-b border-white/5 pb-3 cursor-pointer hover:opacity-80" : ""}`}
        onClick={(e) => {
          if (isExpanded && onToggle) {
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
                copyToClipboard(
                  req.submittedByName || req.agentName || "",
                  "Agent name copied!",
                );
              }}
              className="text-xs font-bold text-slate-100 uppercase tracking-wide cursor-pointer hover:text-indigo-300 transition-colors shrink-0"
            >
              {req.submittedByName || req.agentName}
            </span>
            <span className="text-[10px] text-slate-400 lowercase tracking-wide bg-white/5 border border-white/5 px-2 py-0.5 rounded font-sans shrink-0">
              {getAgentLOB(req.submittedByName || req.agentName || "")}
            </span>
            <span className="font-mono text-[10px] text-slate-500 bg-black/20 px-1.5 py-0.5 rounded shrink-0">
              {formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef)}
            </span>
            <span className="text-[9px] text-slate-500 font-mono shrink-0">
              {new Date(req.createdAt).toLocaleString()}
            </span>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                sourceChannel === "call_center"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {sourceChannel === "call_center" ? "Call Center" : "Social Media"}
            </span>
            {req.isOldCustomer && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-slate-800 text-slate-300 border border-slate-700/50 shrink-0">
                Returning Pt
              </span>
            )}
          </div>

          {/* Row 2: Patient Name, Clinic, Phone */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 flex-wrap">
            {req.patientName && (
              <span className="font-bold">{req.patientName}</span>
            )}
            {req.clinicName && <span>• {getClinicLabel(req.clinicName)}</span>}
            {req.phoneNumber && <span>• {req.phoneNumber}</span>}

            <span
              className={`text-[10px] px-2 py-0.5 border rounded font-sans font-bold flex items-center gap-1 shrink-0 ml-2 ${
                req.platform === "tabby"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : req.platform === "tamara"
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    : req.platform === "one_time_payment"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20"
              }`}
            >
              💳 {req.platform?.toUpperCase() || "N/A"}
            </span>

            <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 border border-white/10 rounded font-sans font-bold flex items-center gap-1 shrink-0 ml-1">
              📁 File: {req.fileNumber || req.idNumber || "N/A"}
            </span>

            <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 border border-white/10 rounded font-sans font-bold flex items-center gap-1 shrink-0 ml-1">
              💰 {pricing.finalPriceFormatted}{" "}
              {req.paymentLength ? `(${req.paymentLength}mo)` : ""}
            </span>

            {req.isFollowUp && (
              <span className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded font-sans font-bold flex items-center gap-1 shrink-0 ml-1 animate-pulse">
                📅 Scheduled: {req.followUpDate}
              </span>
            )}
          </div>
        </div>

        {/* Right side: Status, Badges, Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isPendingContact && (
            <span
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20 ${isOverdue ? "bg-red-500/10 text-red-400 border-red-500/20" : ""}`}
            >
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />{" "}
              {getElapsedTimerString(req.confirmedAt || req.createdAt)}
            </span>
          )}
          <StatusBadge
            status={req.status}
            customerContacted={req.customerContacted}
            workflowStatus={workflowStatus}
          />

          <button
            onClick={async (e) => {
              e.stopPropagation();
              const payload = buildCaseClipboardPayload(req);
              const success = await copyToClipboard(
                payload.text,
                "Full request copied to clipboard!",
                payload.html,
              );
              if (!success) {
                toast.error("Failed to copy request details.");
              }
            }}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer hidden sm:flex"
            title="Copy details with links and attachments"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>

          <button
            onClick={(e) => {
              if (isExpanded && onToggle) {
                e.stopPropagation();
                onToggle();
              }
            }}
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="w-full overflow-hidden transition-all duration-300">
          {/* PROGRESS TIMELINE */}
          <div className="px-5 py-4 border-b border-slate-700/40 bg-slate-950/20 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex items-center gap-0 pb-1 min-w-[500px] sm:min-w-0 justify-between">
              {(() => {
                const steps = [
                  { label: "Submitted", done: true },
                  {
                    label:
                      req.status === "rejected" ? "Rejected" : "Link Ready",
                    done:
                      req.status === "rejected" ||
                      [
                        "tl_link_ready",
                        "awaiting_client_contact",
                        "ready_for_partner",
                        "sent_to_partner",
                        "completed",
                      ].includes(workflowStatus),
                  },
                  {
                    label: "Client Contact",
                    done: [
                      "ready_for_partner",
                      "sent_to_partner",
                      "completed",
                    ].includes(workflowStatus),
                  },
                  {
                    label: "Ready for Partner",
                    done: [
                      "ready_for_partner",
                      "sent_to_partner",
                      "completed",
                    ].includes(workflowStatus),
                  },
                  {
                    label: "Sent",
                    done: ["sent_to_partner", "completed"].includes(
                      workflowStatus,
                    ),
                  },
                  { label: "Closed", done: workflowStatus === "completed" },
                ];
                return steps.map((step, i, arr) => (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center gap-1 w-20 shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          req.status === "rejected" && i === 1
                            ? "bg-red-500/20 border-red-500 text-red-500"
                            : step.done
                              ? "bg-indigo-500 border-indigo-300 shadow-sm shadow-indigo-500/50 text-white"
                              : "bg-transparent border-slate-800 text-slate-500"
                        }`}
                      >
                        {req.status === "rejected" && i === 1 ? (
                          <span className="text-[10px] font-bold">X</span>
                        ) : step.done ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <span className="text-[9px] font-mono">{i + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wide whitespace-nowrap text-center ${
                          req.status === "rejected" && i === 1
                            ? "text-red-400"
                            : step.done
                              ? "text-indigo-400"
                              : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 rounded-full mb-3.5 mx-1 transition-all ${
                          req.status === "rejected" && i === 1
                            ? "bg-red-500/20"
                            : arr[i + 1].done
                              ? "bg-indigo-500"
                              : "bg-slate-800"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ));
              })()}
            </div>
          </div>

          {/* NOTES & ATTACHMENTS (COLLAPSIBLE) */}
          <div className="border-b border-slate-700/40 bg-slate-800/20">
            <button
              onClick={() => setExpandedNotes(!expandedNotes)}
              className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> Notes &
                  Attachments
                </span>
                {hasAttachments && (
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">
                    Has Files
                  </span>
                )}
              </div>
              {expandedNotes ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
              )}
            </button>
            {expandedNotes && (
              <div className="px-5 pb-5 space-y-5">
                {req.notes && (
                  <div className="p-4 bg-slate-900/60 border border-slate-700/40 rounded-xl text-xs text-slate-300 font-medium leading-relaxed">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      Agent Notes
                    </span>
                    {req.notes}
                  </div>
                )}
                {hasAttachments && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Original Submission Files
                    </span>
                    <AttachmentsDisplay
                      photos={[
                        ...(req.photos || []),
                        ...(req.paymentScreenshot
                          ? [req.paymentScreenshot]
                          : []),
                      ]}
                      links={req.links}
                    />
                  </div>
                )}

                {/* CRM Client ID Attachments */}
                {((req.clientIdAttachments &&
                  req.clientIdAttachments.length > 0) ||
                  (req.clientIdPhotos && req.clientIdPhotos.length > 0)) && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">
                      🪪 Client ID Attachments
                    </span>
                    <AttachmentsDisplay
                      photos={[
                        ...(req.clientIdAttachments || []).map((f: any) =>
                          typeof f === "object"
                            ? f.url || f.imageUrl || f.screenshot
                            : f,
                        ),
                        ...(req.clientIdPhotos || []),
                      ].filter(Boolean)}
                      links={[]}
                    />
                  </div>
                )}

                {/* CRM Payment Proof Attachments */}
                {((req.paymentProofAttachments &&
                  req.paymentProofAttachments.length > 0) ||
                  (req.paymentProofPhotos &&
                    req.paymentProofPhotos.length > 0)) && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                      {" "}
                      Payment Proof Attachments
                    </span>
                    <AttachmentsDisplay
                      photos={[
                        ...(req.paymentProofAttachments || []).map((f: any) =>
                          typeof f === "object"
                            ? f.url || f.imageUrl || f.screenshot
                            : f,
                        ),
                        ...(req.paymentProofPhotos || []),
                      ].filter(Boolean)}
                      links={[]}
                    />
                  </div>
                )}

                {/* Partner Sent Attachments */}
                {((req.partnerAttachments &&
                  req.partnerAttachments.length > 0) ||
                  (req.partnerPhotos && req.partnerPhotos.length > 0)) && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                      {" "}
                      Partner Submission Files
                    </span>
                    {req.partnerNotes && (
                      <p className="p-3 bg-indigo-950/20 text-xs text-indigo-200 rounded-xl border border-indigo-500/10 mb-2">
                        Notes: {req.partnerNotes}
                      </p>
                    )}
                    <AttachmentsDisplay
                      photos={[
                        ...(req.partnerAttachments || []).map((f: any) =>
                          typeof f === "object"
                            ? f.url || f.imageUrl || f.screenshot
                            : f,
                        ),
                        ...(req.partnerPhotos || []),
                      ].filter(Boolean)}
                      links={[]}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TL NOTES SECTION */}
          {req.status === "confirmed" && (
            <div className="p-4 md:p-5 border-b border-slate-700/40 bg-amber-950/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400"></div>
              <div className="flex flex-col gap-4 pl-3">
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-1 opacity-80">
                    <CheckCircle2 className="w-3 h-3" /> Payment Link(s)
                  </span>
                  {(() => {
                    const paymentLinks: string[] = Array.isArray((req as any).paymentLinks)
                      ? (req as any).paymentLinks
                      : req.paymentLink
                        ? [req.paymentLink]
                        : [];
                    if (paymentLinks.length === 0) {
                      return (
                        <div className="text-sm text-slate-400 italic">
                          No payment link generated
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3 w-full animate-fade-in text-left">
                        {paymentLinks.map((pLink, index) => (
                          <div
                            key={index}
                            className="flex flex-col gap-1.5 w-full bg-slate-900/40 p-3 rounded-xl border border-white/5"
                          >
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <span>🔗 Link #{index + 1}</span>
                              <span className="text-slate-500 font-medium normal-case text-[9px]">
                                {index === 0
                                  ? "(First/Original)"
                                  : index === paymentLinks.length - 1
                                    ? "(Latest/Active)"
                                    : `(Alternative)`}
                              </span>
                            </span>
                            <div className="flex items-center group/link relative w-full border border-amber-500/10 bg-amber-950/10 rounded-xl p-3 hover:border-amber-500/35 transition-colors">
                              <ExternalLink className="w-4 h-4 text-amber-500/50 mr-3 shrink-0" />
                              <a
                                href={normalizeUrl(pLink) || pLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(pLink, "Payment Link Copied!");
                                }}
                                className="flex-1 break-all text-xs text-amber-100 font-mono hover:text-white transition-colors cursor-pointer block pr-12 leading-relaxed"
                              >
                                {normalizeUrl(pLink) || pLink}
                              </a>
                              <div className="opacity-0 group-hover/link:opacity-100 transition-opacity flex items-center absolute right-3">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    copyToClipboard(pLink, "Payment Link Copied!");
                                  }}
                                  className="px-2 py-1 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 rounded-md text-[9px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer"
                                >
                                  Copy Link
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {req.tlNotes && (
                  <div className="p-4 bg-slate-800/60 border border-emerald-500/20 rounded-xl mt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                      <span className="uppercase tracking-widest">
                        TL Notes ({req.confirmedBy || "System"})
                      </span>
                      <span className="text-emerald-500/40 font-mono">
                        {new Date(
                          req.confirmedAt || req.createdAt,
                        ).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-emerald-100/90 font-medium leading-relaxed">
                      {req.tlNotes}
                    </div>
                  </div>
                )}

                {req.tlLinks && (
                  <div className="mt-1 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      TL Links
                    </span>
                    <div className="flex flex-col gap-2">
                      {extractLinks(req.tlLinks).map(
                        (link: string, idx: number) => (
                          <a
                            key={idx}
                            href={normalizeUrl(link)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex gap-3 text-sm bg-black/40 border border-emerald-500/10 p-4 rounded-xl items-start text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors"
                          >
                            <LinkIcon className="w-4 h-4 shrink-0 text-emerald-500/50 mt-0.5" />
                            <span className="break-all leading-relaxed">
                              {link}
                            </span>
                          </a>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {req.tlPhotos && req.tlPhotos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-amber-400/70 uppercase tracking-wider font-bold mb-1">
                      TL Attachments
                    </p>
                    <AttachmentsDisplay photos={req.tlPhotos} links={[]} />
                  </div>
                )}

                {req.tlSupportingLinks && req.tlSupportingLinks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                      TL Supporting Links
                    </span>
                    <AttachmentsDisplay
                      photos={[]}
                      links={req.tlSupportingLinks}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {req.status === "confirmed" && (
            <div className="border-t border-slate-700/40">
              {/* Show existing follow-up replies */}
              {(req.agentFollowUps || []).length > 0 && (
                <div className="px-5 pt-4 pb-0 space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Post-Confirmation Notes ({(req.agentFollowUps || []).length}
                    )
                  </p>
                  {(req.agentFollowUps || []).map((fu: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs ${fu.senderRole === "tl" ? "bg-amber-500/5 border-amber-500/15 ml-6" : "bg-indigo-500/5 border-indigo-500/10"}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`font-bold text-[10px] ${fu.senderRole === "tl" ? "text-amber-400" : "text-indigo-400"}`}
                        >
                          {fu.senderRole === "tl" ? "" : ""} {fu.senderName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(fu.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {fu.text && (
                        <p className="text-slate-300 leading-relaxed">
                          {fu.text}
                        </p>
                      )}
                      {fu.photos && fu.photos.length > 0 && (
                        <div className="mt-2">
                          <AttachmentsDisplay photos={fu.photos} links={[]} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle button */}
              <div className="px-4 py-2">
                <button
                  onClick={() => setShowFollowUp((v) => !v)}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {showFollowUp
                    ? "Cancel"
                    : "+ Add Follow-up Note / Screenshot"}
                </button>
              </div>

              {showFollowUp && (
                <div className="px-4 pb-4 space-y-3">
                  <textarea
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    placeholder="Add a note, update, or question about this confirmed request..."
                    className="w-full bg-black/40 border border-slate-600/50 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none h-20 font-sans"
                  />
                  <MultiAttachmentUpload
                    photos={followUpPhotos}
                    links={[]}
                    onPhotosChange={setFollowUpPhotos}
                    onLinksChange={() => {}}
                    photosLabel="Attach screenshots (optional)"
                    onUploadStateChange={setFollowUpUploading}
                  />
                  <div className="flex justify-end">
                    <button
                      disabled={
                        (!followUpText.trim() && followUpPhotos.length === 0) ||
                        followUpUploading
                      }
                      onClick={async () => {
                        const newFollowUp = {
                          senderName: currentUser.name,
                          senderRole: currentUser.role,
                          text: followUpText.trim(),
                          photos: followUpPhotos,
                          createdAt: new Date().toISOString(),
                        };
                        await updateDoc(doc(db, "tt_requests", req.id), {
                          agentFollowUps: arrayUnion(newFollowUp),
                        });
                        if (addSystemNotification) {
                          const target = ["agent", "sme"].includes(
                            currentUser.role as string,
                          )
                            ? "tl"
                            : req.agentName;
                          addSystemNotification(
                            "Follow-up on TT Request",
                            `${currentUser.name} added a follow-up note on ${formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef)}: "${followUpText.substring(0, 80)}"`,
                            "general",
                            target,
                            undefined,
                            "tt_request",
                            req.id,
                          );
                        }
                        setFollowUpText("");
                        setFollowUpPhotos([]);
                        setShowFollowUp(false);
                        toast.success("Follow-up note added!");
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {followUpUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CornerDownRight className="w-3.5 h-3.5" />
                      )}{" "}
                      Post Follow-up
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {req.status === "rejected" && (
            <div className="p-4 md:p-5 border-b border-slate-700/40 bg-red-950/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500"></div>
              <div className="pl-3">
                <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                    <span className="uppercase tracking-widest">
                      Rejection Reason ({req.confirmedBy || "System"})
                    </span>
                    <span className="text-red-500/40 font-mono">
                      {new Date(
                        req.confirmedAt || req.createdAt,
                      ).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-red-100/90 font-medium leading-relaxed">
                    {req.tlNotes || "Request rejected by TL."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TL INLINE HANDLING FORM */}
          {activeFintechHandlingId === req.id &&
            isTLOreSupport &&
            (req.status === "not_confirmed" || req.status === "confirmed") && (
              <div className="bg-slate-900/80 border-y border-indigo-500/30 p-5 space-y-4">
                <h4 className="text-xs font-black text-indigo-400 flex items-center gap-2 mb-3 uppercase tracking-widest">
                  <CornerDownRight className="w-4 h-4" /> Processing Panel
                </h4>
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-hidden mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Generate Link For
                    </span>
                    <span className="text-lg font-black text-white font-mono tracking-tight mt-0.5">
                      {
                        calculateTabbyTamaraPrice(req.priceWithoutTax || 0)
                          .finalPriceFormatted
                      }
                    </span>
                  </div>
                  <div className="flex flex-col sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Base Target
                    </span>
                    <span className="text-sm font-semibold text-slate-300 font-mono mt-0.5">
                      {
                        calculateTabbyTamaraPrice(req.priceWithoutTax || 0)
                          .priceBeforeFeeFormatted
                      }{" "}
                      <span className="text-slate-500 text-xs ml-1">
                        +{" "}
                        {
                          calculateTabbyTamaraPrice(req.priceWithoutTax || 0)
                            .feeAmountFormatted
                        }{" "}
                        VAT
                      </span>
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex justify-between">
                      <span>
                        Payment Link <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={tlFintechPaymentLink}
                      onChange={(e) => setTlFintechPaymentLink(e.target.value)}
                      placeholder="https://payment..."
                      className="w-full bg-slate-900 border border-slate-600/60 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex justify-between">
                      <span>Guidance Notes</span>
                    </label>
                    <textarea
                      value={tlFintechNotes}
                      onChange={(e) => setTlFintechNotes(e.target.value)}
                      placeholder="Add remarks..."
                      className="w-full bg-slate-900 border border-slate-600/60 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-[80px] resize-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex justify-between">
                      <span>
                        Supporting Links{" "}
                        <span className="text-slate-600 font-medium">
                          (Optional)
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={tlFintechLinks}
                      onChange={(e) => setTlFintechLinks(e.target.value)}
                      placeholder="https://link1.com, https://link2.com"
                      className="w-full bg-slate-900 border border-slate-600/60 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">
                      📎 Attach Payment Confirmation / ID (optional)
                    </p>
                    <MultiAttachmentUpload
                      photos={tlFormPhotos}
                      links={tlFormLinks}
                      onPhotosChange={setTlFormPhotos}
                      onLinksChange={setTlFormLinks}
                      photosLabel="Payment screenshot, ID, or any supporting file"
                      onUploadStateChange={setTlFormUploading}
                    />
                  </div>
                  <div
                    className={`grid grid-cols-1 gap-3 pt-3 border-t border-slate-700/40 ${
                      req.status === "confirmed" ? "" : "xl:grid-cols-2"
                    }`}
                  >
                    {req.status !== "confirmed" && (
                      <SlideToConfirm
                        label="Slide to Reject"
                        disabled={tlFormUploading}
                        confirmedLabel="Rejected!"
                        colorClass="from-red-600 to-rose-500"
                        icon={<Trash2 className="w-5 h-5 text-white" />}
                        onConfirm={() => {
                          handleConfirmTabbyTamara(
                            req.id,
                            tlFintechPaymentLink,
                            tlFintechNotes,
                            tlFintechLinks,
                            "rejected",
                            tlFormPhotos,
                            tlFormLinks,
                          );
                          setTlFormPhotos([]);
                          setTlFormLinks([]);
                          setActiveFintechHandlingId(null);
                        }}
                      />
                    )}
                    <SlideToConfirm
                      label={
                        req.status === "confirmed"
                          ? "Slide to Send Additional Link"
                          : "Slide to Issue Link"
                      }
                      disabled={tlFormUploading}
                      confirmedLabel={
                        req.status === "confirmed" ? "Sent!" : "Issued!"
                      }
                      colorClass="from-indigo-600 to-blue-500"
                      icon={<CheckCircle2 className="w-5 h-5 text-white" />}
                      onConfirm={() => {
                        handleConfirmTabbyTamara(
                          req.id,
                          tlFintechPaymentLink,
                          tlFintechNotes,
                          tlFintechLinks,
                          "confirmed",
                          tlFormPhotos,
                          tlFormLinks,
                        );
                        setTlFormPhotos([]);
                        setTlFormLinks([]);
                        setActiveFintechHandlingId(null);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

          {/* ACTION FOOTER */}
          <div className="px-5 py-3 flex items-center gap-2 flex-wrap bg-slate-800/40 border-t border-slate-700/40">
            {/* LEFT group: delete and edit */}
            <div className="mr-auto flex items-center gap-2">
              {isSuperAdmin && (
                <button
                  onClick={() => handleDeleteTabbyTamara(req.id)}
                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                  title="Delete Request (Admin)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {canEditItem(req.createdAt) &&
                !["confirmed", "rejected"].includes(req.status) && (
                  <button
                    onClick={() =>
                      setEditingItem({
                        type: "tt_request",
                        id: req.id,
                        data: { ...req },
                      })
                    }
                    className="px-3 py-1.5 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[10px] uppercase tracking-widest border border-blue-500/20"
                  >
                    <Pencil className="w-3.5 h-3.5" />{" "}
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
            </div>

            {/* RIGHT group: copy, share, claim, assign, crm actions */}
            {isTLOreSupport && (
              <button
                onClick={handleShareAction}
                className="px-3 py-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[10px] uppercase tracking-widest border border-indigo-500/20 hidden md:flex"
              >
                <Share className="w-3.5 h-3.5" />{" "}
                <span className="hidden sm:inline">Share Full Case</span>
              </button>
            )}

            {typeof (window as any).setViewingRecord === "function" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (window as any).setViewingRecord({
                    type: "tt_request",
                    data: req,
                  });
                }}
                className="px-3 py-1.5 text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[10px] uppercase tracking-widest border border-teal-500/20 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-teal-400" />{" "}
                <span className="hidden sm:inline">Details</span>
              </button>
            )}

            {/* Claim button */}
            {canClaim && (
              <button
                onClick={handleClaimRequest}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-500/30"
              >
                <CheckIcon className="w-3.5 h-3.5" /> Claim Case
              </button>
            )}

            {/* Assign Dropdown (TL only) */}
            {isTLOreSupport && (
              <div className="relative" ref={assignDropdownRef}>
                <button
                  onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                  className="px-3 py-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[10px] uppercase tracking-widest border border-indigo-500/20 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />{" "}
                  {req.assignedToName ? "Reassign" : "Assign Agent"}
                </button>
                {showAssignDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 z-50 bg-black/40 border border-white/[0.08] rounded-xl w-72 shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-2.5 border-b border-white/[0.06] bg-black/30 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Assign Agent
                      </span>
                      <button
                        onClick={() => setShowAssignDropdown(false)}
                        className="text-slate-500 hover:text-slate-350 p-0.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-2 border-b border-white/[0.05] bg-black/25">
                      <div className="relative flex items-center">
                        <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search agent name..."
                          value={assignSearchQuery}
                          onChange={(e) => setAssignSearchQuery(e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs py-1.5 pl-8 pr-7 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/85 transition-colors font-sans"
                          autoFocus
                        />
                        {assignSearchQuery && (
                          <button
                            onClick={() => setAssignSearchQuery("")}
                            className="absolute right-2 px-1 text-slate-500 hover:text-slate-350 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scrollable list of agents */}
                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 bg-black/20 scrollbar-thin">
                      {filteredAgents.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-500 font-sans">
                          No agents found
                        </p>
                      ) : (
                        filteredAgents.map((agentName) => {
                          const lob = getAgentLOB(agentName);
                          const isSelected = req.assignedToName === agentName;
                          const isChat = lob === "Chat";
                          return (
                            <button
                              key={agentName}
                              onClick={() => handleAssignAgent(agentName)}
                              disabled={isAssigning}
                              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-all flex items-center justify-between font-medium cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/20"
                                  : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                              }`}
                            >
                              <span className="truncate pr-2">{agentName}</span>
                              {lob && (
                                <span
                                  className={`shrink-0 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    isChat
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-blue-500/10 text-blue-450 border border-blue-500/20"
                                  }`}
                                >
                                  {lob === "Chat" ? "Chat" : "Call"}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={async (e) => {
                e.stopPropagation();
                const payload = buildCaseClipboardPayload(req);
                const success = await copyToClipboard(
                  payload.text,
                  "Full request copied to clipboard!",
                  payload.html,
                );
                if (!success) {
                  toast.error("Failed to copy request details.");
                }
              }}
              className="px-3 py-1.5 text-slate-400 hover:text-white bg-slate-700/60 hover:bg-slate-600/80 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[10px] uppercase tracking-widest border border-slate-600/40"
            >
              <Copy className="w-3.5 h-3.5" />{" "}
              <span className="hidden sm:inline">Copy Text</span>
            </button>

            {isTLOreSupport && (
              <>
                {req.status === "not_confirmed" && (
                  <button
                    onClick={() =>
                      handleMarkPatientContactedTT(req.id, "contacted")
                    }
                    className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                    title="Force Close without notes"
                  >
                    <span className="hidden sm:inline">Force Close</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (activeFintechHandlingId === req.id) {
                      setActiveFintechHandlingId(null);
                    } else {
                      setActiveFintechHandlingId(req.id);
                      setTlFintechPaymentLink("");
                      setTlFintechNotes(req.tlNotes || "");
                      setTlFintechLinks(req.tlLinks || "");
                    }
                  }}
                  className={`px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all ${activeFintechHandlingId === req.id ? "bg-slate-700 text-white shadow-inner" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-500/30"}`}
                >
                  <PenTool className="w-3.5 h-3.5" />{" "}
                  {activeFintechHandlingId === req.id
                    ? "Cancel"
                    : req.status === "confirmed"
                      ? "Send Another Link"
                      : "TL Handle"}
                </button>
              </>
            )}

            {/* Attach Client Materials (Assignee / Submitter / TL) */}
            {(req.assignedToName?.toLowerCase() ===
              currentUser?.name?.toLowerCase() ||
              (req.submittedByName || req.agentName)?.toLowerCase() ===
                currentUser?.name?.toLowerCase() ||
              isTLOreSupport) &&
              req.status === "confirmed" &&
              workflowStatus !== "ready_for_partner" &&
              workflowStatus !== "sent_to_partner" && (
                <button
                  onClick={() => setIsCrmMaterialsMode(!isCrmMaterialsMode)}
                  className={`px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all ${isCrmMaterialsMode ? "bg-slate-700 text-white shadow-inner" : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-505/30"}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                  <span className="hidden sm:inline">
                    {isCrmMaterialsMode ? "Cancel" : "Attach Client Docs"}
                  </span>
                </button>
              )}

            {/* Send to partner panel launcher */}
            {isTLOreSupport &&
              req.status === "confirmed" &&
              workflowStatus !== "sent_to_partner" && (
                <button
                  onClick={() => setShowPartnerPanel(!showPartnerPanel)}
                  className={`px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all ${showPartnerPanel ? "bg-slate-700 text-white shadow-inner" : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 shadow-lg shadow-indigo-500/30"}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />{" "}
                  <span className="hidden sm:inline">
                    {showPartnerPanel ? "Cancel Partner" : "Send to Partner"}
                  </span>
                </button>
              )}

            {/* Agent: Client Contacted -> Close Case */}
            {!isTLOreSupport &&
              req.assignedToName?.toLowerCase() ===
                currentUser?.name?.toLowerCase() &&
              workflowStatus === "awaiting_client_contact" && (
                <div className="w-full sm:w-64">
                  <SlideToConfirm
                    label="Slide to Close Case"
                    confirmedLabel="Closed!"
                    colorClass="from-emerald-500 to-teal-500"
                    icon={<CheckCircle2 className="w-4 h-4 text-white" />}
                    onConfirm={async () => {
                      try {
                        const closeActivity = {
                          id:
                            "act_" +
                            Math.random().toString(36).substring(2, 11),
                          senderName: "System",
                          authorId: "system",
                          authorRole: "system",
                          text: `${currentUser.name} confirmed client contact. Case closed.`,
                          createdAt: new Date().toISOString(),
                        };
                        await updateDoc(doc(db, "tt_requests", req.id), {
                          customerContacted: "contacted",
                          contactedAt: new Date().toISOString(),
                          workflowStatus: "completed",
                          replies: arrayUnion(closeActivity),
                        });
                        if (addSystemNotification) {
                          addSystemNotification(
                            "Tabby/Tamara Case Closed",
                            `${currentUser.name} marked client as contacted. Request for ${req.patientName} is now closed.`,
                            "general",
                            "tl",
                            undefined,
                            "tt_request",
                            req.id,
                          );
                        }
                        toast.success("Client contacted — case closed!");
                      } catch (err: any) {
                        toast.error("Failed to close case: " + err.message);
                      }
                    }}
                  />
                </div>
              )}
          </div>

          {/* CRM CLIENT MATERIALS SUBMISSION CONTAINER */}
          {isCrmMaterialsMode && (
            <div className="p-4 md:p-5 bg-emerald-950/10 border-t border-emerald-500/10 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-100 uppercase tracking-widest">
                  Attach CRM Client Materials
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest block mb-1">
                    Contact Notes / Remark Text
                  </label>
                  <textarea
                    value={crmContactNotes}
                    onChange={(e) => setCrmContactNotes(e.target.value)}
                    placeholder="Record calling details, conversations, or reference comments..."
                    className="w-full bg-black/40 border border-emerald-500/20 rounded-xl p-3 text-sm text-white placeholder-emerald-500/30 focus:outline-none focus:border-emerald-500/50 resize-none h-20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-4 border border-slate-700/40 rounded-xl">
                    <MultiAttachmentUpload
                      photos={clientIdPhotos}
                      links={[]}
                      onPhotosChange={setClientIdPhotos}
                      onLinksChange={() => {}}
                      photosLabel="Attach Client ID Card Screenshot (Required)"
                      onUploadStateChange={setIsClientIdUploading}
                    />
                  </div>
                  <div className="bg-slate-900/50 p-4 border border-slate-700/40 rounded-xl">
                    <MultiAttachmentUpload
                      photos={paymentProofPhotos}
                      links={[]}
                      onPhotosChange={setPaymentProofPhotos}
                      onLinksChange={() => {}}
                      photosLabel="Attach Payment screenshot (Required)"
                      onUploadStateChange={setIsPaymentProofUploading}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsCrmMaterialsMode(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={
                      isClientIdUploading ||
                      isPaymentProofUploading ||
                      clientIdPhotos.length === 0 ||
                      paymentProofPhotos.length === 0
                    }
                    onClick={async () => {
                      try {
                        const clientIds = normalizeAttachments(clientIdPhotos);
                        const paymentProofs =
                          normalizeAttachments(paymentProofPhotos);

                        await handleMarkPatientContactedTT(
                          req.id,
                          "contacted",
                          crmContactNotes,
                          undefined,        // screenshot (legacy field, not used here)
                          [],                // attachments (legacy screenshots array)
                          clientIds,
                          paymentProofs,
                          "ready_for_partner", // newWorkflowStatus - now in the correct position
                        );
                        setIsCrmMaterialsMode(false);
                        setCrmContactNotes("");
                        setClientIdPhotos([]);
                        setPaymentProofPhotos([]);
                        toast.success(
                          "Request ready for partner! Client materials successfully recorded ",
                        );
                      } catch (err: any) {
                        toast.error(
                          "Failed to attach client materials: " + err.message,
                        );
                      }
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest flex items-center gap-2"
                  >
                    {isClientIdUploading || isPaymentProofUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Set Ready for Partner
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CRM SENT TO PARTNER PANEL */}
          {showPartnerPanel && (
            <div className="p-4 md:p-5 bg-indigo-950/20 border-t border-indigo-500/10 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-widest">
                  Mark Sent to Partner & Close Case
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-indigo-500/75 uppercase tracking-widest block mb-1">
                    Partner Submissions Notes (Optional)
                  </label>
                  <textarea
                    value={partnerNotes}
                    onChange={(e) => setPartnerNotes(e.target.value)}
                    placeholder="E.g., Submitted via Partner API, confirmation reference code..."
                    className="w-full bg-black/40 border border-indigo-500/20 rounded-xl p-3 text-sm text-white placeholder-indigo-500/30 focus:outline-none focus:border-indigo-500/50 resize-none h-20"
                  />
                </div>

                <div className="bg-slate-900/50 p-4 border border-slate-700/40 rounded-xl">
                  <MultiAttachmentUpload
                    photos={partnerPhotos}
                    links={[]}
                    onPhotosChange={setPartnerPhotos}
                    onLinksChange={() => {}}
                    photosLabel="Attach Partner confirmation invoices/screenshots (Optional)"
                    onUploadStateChange={setIsPartnerUploading}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowPartnerPanel(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isPartnerUploading || isPartnerSubmitting}
                    onClick={handleSendToPartner}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest flex items-center gap-2"
                  >
                    {isPartnerUploading || isPartnerSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Mark Sent to Partner & Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ALWAYS VISIBLE REPLY THREAD */}
          <div className="bg-slate-800/20 pt-4 pb-5 px-5 border-t border-slate-700/40">
            <RequestReplyThread
              request={req}
              currentUser={currentUser}
              collectionName="tt_requests"
              addSystemNotification={addSystemNotification}
              requestType="FinTech"
              requestAgentName={req.agentName}
            />
          </div>

          {/* Case Activity Audit Trail */}
          <div className="bg-slate-900/40 p-5 border-t border-slate-700/40 space-y-2 text-left">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
              Case Activity Timeline
            </h4>
            <CaseTimeline entityType="tt_request" entityId={req.id} />
          </div>
        </div>
      )}
    </div>
  );
};
