import { getClinicLabel } from "../../utils";
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
import { buildCaseClipboardPayload, copyToClipboard, calculateTabbyTamaraPrice, formatCaseRef, formatPhoneForCopy, normalizeAttachments } from "../../utils";
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
  onAssignCase: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm', agentName: string) => Promise<void>;
  onClaimCase: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm') => Promise<void>;
  onDeleteCase: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm') => Promise<void>;
  onEditItem: (editingItem: { type: string; id: string; data: any }) => void;
  onSendToPartner: (caseId: string, notes: string, photos: string[]) => Promise<void>;
  onMarkInquirySent: (inquiryId: string) => Promise<void>;
  onMarkPatientContactedTT: (caseId: string, type: 'complaint' | 'tabby_tamara', contactedStatus: 'contacted' | 'attempted' | 'not_contacted') => Promise<void>;
  onTLCommentComplaint: (complaintId: string, comment: string, resolutionType: string) => Promise<void>;
  onCloseComplaint: (complaintId: string) => Promise<void>;
  onReopenComplaint: (complaintId: string) => Promise<void>;
}

const InfoField = ({ label, value, copyable, mono }: { label: string; value: string; copyable?: boolean; mono?: boolean }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className={`text-sm text-slate-100 font-medium ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
      {copyable && value && (
        <button
          onClick={() => copyToClipboard(value, `${label} copied!`)}
          className="text-slate-600 hover:text-indigo-400 transition-colors cursor-pointer"
          title={`Copy ${label}`}
        >
          <Copy className="w-3 h-3" />
        </button>
      )}
    </div>
  </div>
);

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
      <div id="case-drawer-empty-placeholder" className="h-full flex flex-col items-center justify-center p-8 bg-[#09090c] rounded-xl border border-white/8 text-center min-h-[500px]">
        <Layers className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">No Case Selected</h3>
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
        const refCode = inq.caseRef || `INQ-${inq.id.replace('inq_', '').toUpperCase()}`;
        const patientName = inq.patientName || "—";
        const fileNumber = inq.fileNumber || "—";
        const phoneNumber = inq.phoneNumber || "—";
        const clinicName = inq.clinicName || "—";
        const agentName = inq.agentName || "Agent";
        
        const INQUIRY_STATUS_LABELS: Record<string, string> = {
          submitted: '📨 Submitted',
          tl_reviewing: '👀 TL Reviewing',
          sent_to_clinic: '📤 Sent to Clinic',
          answered: '✅ Answered',
          closed: '🔒 Closed',
          sent: '📤 Sent to Partner'
        };
        const statusText = INQUIRY_STATUS_LABELS[inq.status] || inq.status?.toUpperCase() || "SUBMITTED";

        // Collect all attachments from inquiry and its replies
        const rawAttachments: any[] = [
          ...(inq.photos || []),
          ...(inq.attachments || []),
          ...(inq.screenshot ? [inq.screenshot] : [])
        ];

        const repliesList: string[] = [];
        const repliesHtmlList: string[] = [];
        if (inq.replies && Array.isArray(inq.replies)) {
          inq.replies.forEach((rep: any) => {
            repliesList.push(`${rep.senderName} (${rep.authorRole || 'User'}): ${rep.text}`);
            repliesHtmlList.push(`<li><strong>${rep.senderName}</strong> <span style="font-size: 11px; color: #888;">(${rep.authorRole || 'User'})</span>: ${rep.text}</li>`);
            if (rep.photos) rawAttachments.push(...rep.photos);
            if (rep.attachments) rawAttachments.push(...rep.attachments);
            if (rep.screenshot) rawAttachments.push(rep.screenshot);
          });
        }

        const normAttachments = normalizeAttachments(rawAttachments);
        const attachmentsText = normAttachments.length > 0 
          ? `Attachments:\n${normAttachments.map(att => `  - ${att.name || 'File'}`).join('\n')}` 
          : "";

        const textLines = [
          `✨ *INQUIRY REQUEST STATUS* ✨`,
          `--------------------------------------`,
          `🆔 *Ref:* ${refCode}`,
          `👤 *Patient Name:* ${patientName}`,
          `📞 *Phone:* ${formatPhoneForCopy(phoneNumber)}`,
          `📁 *File/ID:* ${fileNumber}`,
          `🏥 *Clinic:* ${clinicName}`,
          `📋 *Status:* ${statusText}`,
          `👤 *Agent Name:* ${agentName}`,
          `💬 *Inquiry Details:*`,
          `${inq.text || "—"}`,
          inq.answer ? `💡 *TL Answer:* ${inq.answer}` : "",
          inq.answeredBy ? `👮 *Answered By:* ${inq.answeredBy}` : "",
          repliesList.length > 0 ? `\n💬 *Replies & Conversation History:*\n${repliesList.join('\n')}` : "",
          attachmentsText ? `\n📎 ${attachmentsText}` : "",
          (inq.links && inq.links.length > 0) ? `\n🔗 *Links:* \n${inq.links.join('\n')}` : "",
          `--------------------------------------`
        ].filter(Boolean).join('\n');

        let statusBadgeColor = "#f59e0b"; // amber
        if (inq.status === "answered" || inq.status === "closed") {
          statusBadgeColor = "#10b981"; // green
        } else if (inq.status === "tl_reviewing") {
          statusBadgeColor = "#3b82f6"; // blue
        } else if (inq.status === "sent_to_clinic") {
          statusBadgeColor = "#8b5cf6"; // purple
        }

        let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">`;
        html += `<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">`;
        html += `<span style="font-size: 14px; font-weight: 700; background-color: #6366f120; color: #6366f1; padding: 6px 12px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em;">❓ INQUIRY</span>`;
        html += `<span style="font-size: 11px; font-weight: 700; background-color: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px; font-family: monospace;">${refCode}</span>`;
        html += `</div>`;
        
        html += `<table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 15px;">`;
        html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b; width: 150px;">👤 Patient Name</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 600; color: #0f172a;">${patientName}</td></tr>`;
        html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">📞 Phone Number</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 600; color: #0f172a; font-family: monospace;">${formatPhoneForCopy(phoneNumber)}</td></tr>`;
        html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">📁 File / ID</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 600; color: #0f172a; font-family: monospace;">${fileNumber}</td></tr>`;
        html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">🏥 Clinic</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 600; color: #0f172a;">${clinicName}</td></tr>`;
        html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">👤 Submitter Agent</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 600; color: #0f172a;">${agentName}</td></tr>`;
        html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">📋 Status</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc;"><span style="font-size: 11px; font-weight: 800; background-color: ${statusBadgeColor}15; color: ${statusBadgeColor}; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">${statusText}</span></td></tr>`;
        html += `</table>`;

        html += `<p style="font-weight: bold; margin: 15px 0 5px 0; font-size: 14px; color: #0f172a;">💬 Inquiry Details:</p>`;
        html += `<blockquote style="border-left: 3px solid #6366f1; padding-left: 12px; margin: 0 0 15px 0; color: #334155; font-style: italic; background-color: #f8fafc; padding-top: 8px; padding-bottom: 8px; border-radius: 0 8px 8px 0; white-space: pre-wrap;">${inq.text}</blockquote>`;

        if (inq.answer) {
          html += `<p style="font-weight: bold; margin: 15px 0 5px 0; font-size: 14px; color: #0f172a;">💡 TL Answer / Response:</p>`;
          html += `<blockquote style="border-left: 3px solid #10b981; padding-left: 12px; margin: 0 0 15px 0; color: #065f46; background-color: #f0fdf4; padding-top: 8px; padding-bottom: 8px; border-radius: 0 8px 8px 0;">${inq.answer} ${inq.answeredBy ? `<br/><span style="font-size: 11px; color: #15803d; font-weight: bold;">— Answered by: ${inq.answeredBy}</span>` : ""}</blockquote>`;
        }

        if (repliesHtmlList.length > 0) {
          html += `<p style="font-weight: bold; margin: 15px 0 5px 0; font-size: 14px; color: #0f172a;">💬 Conversation History:</p>`;
          html += `<ul style="margin: 0; padding-left: 20px; color: #475569; background-color: #f8fafc; padding-top: 8px; padding-bottom: 8px; border-radius: 8px; list-style-type: square;">${repliesHtmlList.join('')}</ul>`;
        }

        if (normAttachments.length > 0) {
          html += `<p style="font-weight: bold; margin: 15px 0 5px 0; font-size: 12px; color: #475569;">📎 Attached files (${normAttachments.length}):</p>`;
          html += `<ul style="margin: 0; padding-left: 20px; font-size: 12px;">`;
          normAttachments.forEach((att: any) => {
            html += `<li><a href="${att.url}" target="_blank" style="color: #2563eb; text-decoration: none;">${att.name || 'File Attachment'}</a></li>`;
          });
          html += `</ul>`;
        }
        
        html += `</div>`;

        payloadText = textLines;
        payloadHtml = html;
      } else if (caseData.crmType === "complaint") {
        const comp = caseData.raw as any;
        const refCode = formatCaseRef(comp.id, 'tt_complaint', comp.createdAt, comp.caseRef);
        payloadText = [
          `🚨 COMPLAINT — ${refCode}`,
          `Patient: ${comp.patientName || 'N/A'} | File: ${comp.fileNumber || 'N/A'}`,
          `Phone: ${comp.phoneNumber ? comp.phoneNumber.replace(/\s+/g, '') : 'N/A'}`,
          `Clinic: ${getClinicLabel(comp.clinicName)}`,
          comp.idNumber ? `ID: ${comp.idNumber}` : (comp.isOldCustomer ? 'Customer Type: Existing' : 'Customer Type: New'),
          `Status: ${comp.status?.replace(/_/g, ' ').toUpperCase() || 'N/A'}`,
          `Complaint Details:\n${comp.complaintDetails || 'N/A'}`,
          comp.tlComment ? `TL Response:\n${comp.tlComment}` : '',
          comp.tlName ? `Handled By: ${comp.tlName}` : '',
          (comp.photos?.length > 0) ? `Attachments: ${comp.photos.length} file(s)` : '',
          (comp.links?.length > 0) ? `Links:\n${comp.links.join('\n')}` : '',
        ].filter(Boolean).join('\n');

        payloadHtml = `<div style="font-family: sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5;">` +
          `<h3 style="margin: 0 0 10px 0; color: #ef4444; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">🚨 COMPLAINT — ${refCode}</h3>` +
          `<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">` +
          `<tr><td style="font-weight: bold; width: 120px; padding: 4px 0;">Patient Name:</td><td>${comp.patientName || "N/A"}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">File Number:</td><td>${comp.fileNumber || "N/A"}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Phone:</td><td style="font-family: monospace;">${comp.phoneNumber ? comp.phoneNumber.replace(/\s+/g, '') : "N/A"}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Clinic Name:</td><td>${getClinicLabel(comp.clinicName)}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">ID/Customer:</td><td>${comp.idNumber ? comp.idNumber : (comp.isOldCustomer ? 'Customer Type: Existing' : 'Customer Type: New')}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Status:</td><td><span style="background: #ffe4e6; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">${comp.status?.replace(/_/g, ' ').toUpperCase() || "N/A"}</span></td></tr>` +
          `</table>` +
          `<p style="font-weight: bold; margin: 10px 0 5px 0;">Complaint Details:</p>` +
          `<blockquote style="border-left: 3px solid #f43f5e; padding-left: 10px; margin: 0; color: #475569; font-style: italic;">${comp.complaintDetails || 'N/A'}</blockquote>` +
          (comp.tlComment ? `<p style="font-weight: bold; margin: 10px 0 5px 0; color: #b91c1c;">TL Comment:</p>` +
          `<blockquote style="border-left: 3px solid #b91c1c; padding-left: 10px; margin: 0; color: #475569;">${comp.tlComment}</blockquote>` : "") +
          `</div>`;
      } else if (caseData.crmType === "client_comm") {
        const req = caseData.raw as any;
        const refCode = req.caseRef || formatCaseRef(req.id, 'client_comm', req.createdAt, req.caseRef);
        payloadText = [
          `*Client Communication Request*`,
          `*Ref:* ${refCode}`,
          `*Patient:* ${req.patientName || "N/A"}`,
          `*Clinic:* ${getClinicLabel(req.clinicName)}`,
          `*Language:* ${req.language || "N/A"}`,
          `*Phone:* ${formatPhoneForCopy(req.phoneNumber || "")}`,
          `*Status:* ${req.status}`,
          req.notes ? `*Notes:*\n${req.notes}` : '',
          req.handlingNotes ? `*Resolution:*\n${req.handlingNotes}` : '*Resolution:* Pending',
          req.handledBy ? `*Handled By:* ${req.handledBy}` : '',
          (req.photos?.length > 0) ? `*Attachments:* ${req.photos.length} file(s)` : '',
        ].filter(Boolean).join('\n');

        payloadHtml = `<div style="font-family: sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5;">` +
          `<h3 style="margin: 0 0 10px 0; color: #10b981; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Client Communication Request — ${refCode}</h3>` +
          `<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">` +
          `<tr><td style="font-weight: bold; width: 120px; padding: 4px 0;">Patient:</td><td>${req.patientName || "N/A"}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Clinic:</td><td>${getClinicLabel(req.clinicName)}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Language:</td><td>${req.language || "N/A"}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Phone:</td><td style="font-family: monospace;">${formatPhoneForCopy(req.phoneNumber || "")}</td></tr>` +
          `<tr><td style="font-weight: bold; padding: 4px 0;">Status:</td><td><span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">${req.status || "N/A"}</span></td></tr>` +
          `</table>` +
          `<p style="font-weight: bold; margin: 10px 0 5px 0;">Notes:</p>` +
          `<blockquote style="border-left: 3px solid #10b981; padding-left: 10px; margin: 0; color: #475569;">${req.notes || "No notes"}</blockquote>` +
          (req.handlingNotes ? `<p style="font-weight: bold; margin: 10px 0 5px 0; color: #059669;">Resolution:</p>` +
          `<blockquote style="border-left: 3px solid #059669; padding-left: 10px; margin: 0; color: #475569;">${req.handlingNotes}</blockquote>` : "") +
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
      type: caseData.crmType === 'inquiry' ? 'inquiry' : caseData.crmType === 'complaint' ? 'tt_complaint' : caseData.crmType === 'client_comm' ? 'client_comm' : 'tt_request',
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
    <div id="case-crm-detail-drawer" className="h-full flex flex-col bg-[#09090c] border border-white/8 rounded-xl overflow-hidden relative">
      {/* Drawer Header Toolbar */}
      <div className="bg-transparent border-b border-white/8 p-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#2effc3] bg-[#00e3a5]/5 px-2 py-0.5 rounded-lg border border-[#00e3a5]/10 shrink-0">
              {caseData.crmType === 'inquiry' ? 'Inquiry' : caseData.crmType === 'complaint' ? 'Complaint' : caseData.crmType === 'client_comm' ? 'Client Comm' : 'Tabby/Tamara'}
            </span>
            <h2 className="text-sm font-bold text-slate-100 font-sans">
              {caseData.referenceId}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {caseData.status && (
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide inline-block max-w-full truncate ${['submitted', 'not_confirmed', 'awaiting_client_contact'].includes(caseData.status) ? 'bg-amber-500/10 text-amber-500' : caseData.status === 'tl_reviewing' ? 'bg-blue-500/10 text-blue-400' : ['sent_to_clinic', 'sent'].includes(caseData.status) ? 'bg-orange-500/10 text-orange-400' : ['in_progress', 'need_contact'].includes(caseData.status) ? 'bg-purple-500/10 text-purple-400' : ['answered', 'resolved', 'contacted'].includes(caseData.status) ? 'bg-emerald-500/10 text-emerald-400' : caseData.status === 'pending_tl' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-slate-500/10 text-slate-400' }`}>
                {['submitted', 'not_confirmed', 'awaiting_client_contact'].includes(caseData.status) ? 'New / Pending' :
                  caseData.status === 'tl_reviewing' ? 'TL Review' :
                  ['sent_to_clinic', 'sent'].includes(caseData.status) ? 'Sent to Clinic' :
                  ['in_progress', 'need_contact'].includes(caseData.status) ? 'In Progress' :
                  ['answered', 'resolved', 'contacted'].includes(caseData.status) ? 'Resolved' :
                  caseData.status === 'pending_tl' ? 'Pending TL' :
                  caseData.status?.replace(/_/g, ' ') || 'Submitted'}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl text-xs border border-white/8 text-slate-400">
              <Clock className="w-2.5 h-2.5" />
              {new Date(caseData.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyClipboard}
            className="px-4 py-2 bg-transparent border border-white/12 text-white hover:bg-white/5 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Copy className="w-4 h-4" /> COPY CASE
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs navigation panel */}
      <div className="flex border-b border-white/8 gap-6 px-4 shrink-0 z-10 bg-[#0b0b0f]">
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
              className={`py-3 flex items-center gap-1.5 transition-all cursor-pointer text-sm ${ isActive ? "border-b-2 border-indigo-500 text-white font-bold" : "text-slate-500 hover:text-slate-300" }`}
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
            
            {/* Patient Info Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-transparent rounded-xl border border-white/8">
              <InfoField label="Patient Name" value={caseData.patientName} copyable />
              <InfoField label="Phone" value={caseData.phoneNumber} copyable mono />
              <InfoField label="Clinic" value={getClinicLabel(caseData.clinicName)} />
              <InfoField label="File / ID" value={caseData.crmType === 'tabby_tamara' || caseData.crmType === 'complaint' ? (caseData.raw.fileNumber || caseData.raw.idNumber || '') : ''} copyable mono />
              <InfoField label="Submitted By" value={caseData.agentName} />
              <InfoField label="Date" value={new Date(caseData.createdAt).toLocaleDateString()} />
              {caseData.assignedToName && <InfoField label="Assigned To" value={caseData.assignedToName} />}
              {caseData.crmType === 'tabby_tamara' && <InfoField label="Platform" value={caseData.raw.platform || ''} />}
            </div>

            {/* Subject / Details Box */}
            <div className="p-4 bg-[#0a0a0e] rounded-xl border border-white/8">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Case Details</p>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {caseData.crmType === 'inquiry' ? caseData.raw.text 
                 : caseData.crmType === 'complaint' ? caseData.raw.complaintDetails 
                 : caseData.crmType === 'client_comm' ? caseData.raw.notes 
                 : caseData.subject}
              </p>
            </div>

            {/* Quick Actions Panel depending on request parameters */}
            {/* Inquiry Partner Forwarding */}
            {caseData.crmType === "inquiry" && isTLOreSupport && caseData.status === "submitted" && (
              <div className="bg-orange-500/10 border border-transparent text-orange-400 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Unanswered inquiry pending forward</span>
                </div>
                <p className="text-xs hover:text-orange-300 cursor-pointer text-slate-300 leading-normal">
                  Send this inquiry officially to the clinic partner for evaluation. Marking it 'Sent' alerts the operations team.
                </p>
                <button
                  onClick={handleInquiryForward}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Mark Sent to Partner
                </button>
              </div>
            )}

            {/* Tabby/Tamara Forwarding */}
            {caseData.crmType === "tabby_tamara" && isTLOreSupport && caseData.status === "not_confirmed" && !showPartnerPanel && (
              <button
                onClick={() => setShowPartnerPanel(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
              >
                <ChevronsRight className="w-4 h-4 animate-pulse" /> Confirm & Send to Fintech Partner
              </button>
            )}

            {/* Custom Send to Partner Widget */}
            {showPartnerPanel && (
              <div className="bg-emerald-500/10 border border-transparent p-4 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Fintech Forward Config</span>
                  <button onClick={() => setShowPartnerPanel(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Partner Audit Comments</label>
                  <textarea
                    rows={3}
                    placeholder="Enter notes/resolutions to dispatch to partner or internal log history..."
                    value={partnerNotes}
                    onChange={(e) => setPartnerNotes(e.target.value)}
                    className="w-full bg-[#1b1b22] border border-white/8 rounded-xl p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={handlePartnerSubmit}
                  disabled={isSubmittingPartner}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-slate-950 font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
                className="w-full bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
              >
                <CheckCircle className="w-4 h-4" /> Formulate Complaint Resolution
              </button>
            )}

            {/* Complaint Resolution Widget */}
            {showResPanel && (
              <div className="bg-rose-500/10 border border-transparent p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Complaint Solution Broker</span>
                  <button onClick={() => setShowResPanel(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Resolution Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "apology", label: "Apology", icon: <User className="w-3 h-3 text-slate-400" /> },
                      { value: "refund", label: "Refund", icon: <CheckCircle className="w-3 h-3 text-emerald-400" /> },
                      { value: "replacement", label: "Replacement", icon: <RefreshCw className="w-3 h-3 text-blue-400" /> },
                      { value: "escalated", label: "Escalated", icon: <AlertOctagon className="w-3 h-3 text-rose-400" /> },
                      { value: "no_action", label: "No Action", icon: <X className="w-3 h-3 text-slate-400" /> },
                      { value: "follow_up", label: "Follow Up", icon: <Phone className="w-3 h-3 text-amber-400" /> }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setComplaintResType(opt.value)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-left transition-all flex items-center gap-1.5 ${ complaintResType === opt.value ? "bg-rose-500 text-slate-950 font-bold" : "bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 border border-white/8" }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Resolution Instructions for Agent</label>
                  <textarea
                    rows={3}
                    placeholder="Enter instructions explaining how the agent can close this issue with the patient..."
                    value={complaintComment}
                    onChange={(e) => setComplaintComment(e.target.value)}
                    className="w-full bg-[#1b1b22] border border-white/8 rounded-xl p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  onClick={handleResSubmit}
                  disabled={isSubmittingRes}
                  className="w-full bg-rose-500 hover:bg-rose-400 disabled:bg-rose-500/50 text-slate-950 font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingRes ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Resolution (Status: Need Contact)
                </button>
              </div>
            )}

            {/* Complaint Closure & Reopening for TL / Agent who needs contact */}
            {caseData.crmType === "complaint" && caseData.status === "need_contact" && (
              <div className="bg-transparent border border-white/8 p-4 rounded-xl space-y-2.5">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Contact Required Status</span>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  The Team Leader has registered a resolution: <span className="text-rose-400 font-bold uppercase">{caseData.raw.tlResolutionType || 'Follow Up'}</span>. 
                  Please contact the client and log the dial/contact state:
                </p>
                
                {caseData.raw.tlComment && (
                  <div className="bg-white/[0.02] border border-white/8 p-3 rounded-xl text-xs italic text-slate-400">
                    "{caseData.raw.tlComment}"
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => handleMarkContacted('contacted')}
                    className="bg-transparent border border-white/12 text-white hover:bg-white/5 text-white font-bold text-xs uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Got Contact
                  </button>
                  <button
                    onClick={() => handleMarkContacted('attempted')}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" /> Attempted Dial
                  </button>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS ROW */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/8">
              {canEdit && (
                <button 
                  onClick={handleEditTrigger}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Edit Case
                </button>
              )}

              {caseData.crmType === "complaint" && isTLOreSupport && (
                <>
                  {caseData.status !== "closed" ? (
                    <button
                      onClick={() => onCloseComplaint(caseData.id)}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/10 border border-transparent text-rose-400 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Close Complaint
                    </button>
                  ) : (
                    <button
                      onClick={() => onReopenComplaint(caseData.id)}
                      className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/10 border border-transparent text-amber-500 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CornerUpLeft className="w-4 h-4" /> Reopen Complaint
                    </button>
                  )}
                </>
              )}

              {isTLOreSupport && (
                <button 
                  onClick={handleRemoveCase}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/10 border border-transparent text-rose-400 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Trash2 className="w-4 h-4" /> Delete Case
                </button>
              )}
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
