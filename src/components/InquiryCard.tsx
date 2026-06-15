import React, { useState } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Send, 
  Trash2, 
  CheckCircle2, 
  MessageSquare, 
  Pencil 
} from "lucide-react";
import { Inquiry, User } from "../types";
import { db, wrappedUpdateDoc as updateDoc, wrappedSetDoc as setDoc } from "../firebase";
import { doc } from "firebase/firestore";
import { toast } from "sonner";
import { CopyWrap } from "./CopyWrap";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { InquiryRepliesViewer } from "./InquiryRepliesViewer";
import { SlideToConfirm } from "./SlideToConfirm";
import { ProfessionalAttachmentUploader } from "./ProfessionalAttachmentUploader";
import {
  getClinicLabel,
  getAgentLOB,
  formatCaseRef,
  copyToClipboard,
  generateInquiryCopyText,
  formatPhoneForCopy,
  setStorageItem,
} from "../utils";

interface InquiryCardProps {
  inq: Inquiry;
  currentUser: User | null;
  isExpanded: boolean;
  onToggle: () => void;
  isTLOreSupport: boolean;
  isSuperAdmin: boolean;
  handleTLViewInquiry?: (id: string) => void;
  canEditItem?: (createdAt: string | number | Date) => boolean;
  getRemainingEditTime?: (createdAt: string | number | Date) => string;
  setEditingItem?: (item: any) => void;
  addSystemNotification?: (
    type: string,
    message: string,
    category: string,
    targetAgent: string,
    payload?: any,
    actionType?: string,
    actionId?: string
  ) => void;

  // Answering & Answering Dialog States (Optional with local fallback)
  answeringInquiryId?: string | null;
  setAnsweringInquiryId?: (id: string | null) => void;
  currentAnswerText?: string;
  setCurrentAnswerText?: (text: string) => void;
  currentAnswerAttachments?: any[];
  setCurrentAnswerAttachments?: (attachments: any[]) => void;
  currentAnswerLinks?: string[];
  setCurrentAnswerLinks?: (links: string[]) => void;
  isSubmittingAnswer?: boolean;
  handleSetInquiryAnswered?: (id: string) => void;

  // Action Handlers
  handleDeleteInquiry?: (id: string) => void;
  handleUpdateContactedStatus?: (id: string, status: string) => void;
  handleMarkInquiryRead?: (id: string) => void;
  handleMarkSentToClinic?: (id: string) => void;
  handleCloseInquiry?: (id: string) => void;
  handleReassignInquiry?: (id: string, agentName: string) => void;
  agentsList?: string[];
  inquiries?: Inquiry[];
  setInquiries?: (inquiries: Inquiry[]) => void;
}

export const InquiryCard: React.FC<InquiryCardProps> = ({
  inq,
  currentUser,
  isExpanded,
  onToggle,
  isTLOreSupport,
  isSuperAdmin,
  handleTLViewInquiry,
  canEditItem,
  getRemainingEditTime,
  setEditingItem,
  addSystemNotification,

  // Answering states
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

  // Action handlers
  handleDeleteInquiry,
  handleUpdateContactedStatus,
  handleMarkInquiryRead,
  handleMarkSentToClinic,
  handleCloseInquiry,
  handleReassignInquiry,
  agentsList = [],
  inquiries = [],
  setInquiries,
}) => {
  // Local fallback states if the parent doesn't provide them (e.g. in GlobalDashboard)
  const [localAnsweringInquiryId, setLocalAnsweringInquiryId] = useState<string | null>(null);
  const [localAnswerText, setLocalAnswerText] = useState("");
  const [localAnswerAttachments, setLocalAnswerAttachments] = useState<any[]>([]);
  const [localAnswerLinks, setLocalAnswerLinks] = useState<string[]>([]);

  // Resolve active states
  const activeAnsweringId = answeringInquiryId !== undefined ? answeringInquiryId : localAnsweringInquiryId;
  const setAnsweringId = setAnsweringInquiryId || setLocalAnsweringInquiryId;

  const answerText = currentAnswerText !== undefined ? currentAnswerText : localAnswerText;
  const setAnswerText = setCurrentAnswerText || setLocalAnswerText;

  const answerAttachments = currentAnswerAttachments !== undefined ? currentAnswerAttachments : localAnswerAttachments;
  const setAnswerAttachments = setCurrentAnswerAttachments || setLocalAnswerAttachments;

  const answerLinks = currentAnswerLinks !== undefined ? currentAnswerLinks : localAnswerLinks;
  const setAnswerLinks = setCurrentAnswerLinks || setLocalAnswerLinks;

  const isSubmitting = isSubmittingAnswer !== undefined ? isSubmittingAnswer : false;

  const STATUS_CONFIG: Record<string, { color: string; label: string; emoji: string }> = {
    submitted: { color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse", label: "New", emoji: "🆕" },
    tl_reviewing: { color: "bg-blue-500/10 border-blue-500/20 text-blue-400", label: "TL Reviewing", emoji: "👀" },
    sent_to_clinic: { color: "bg-orange-500/10 border-orange-500/20 text-orange-400 animate-pulse", label: "Sent to Clinic", emoji: "📤" },
    answered: { color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", label: "Answered", emoji: "✅" },
    closed: { color: "bg-slate-700/40 border-slate-600/40 text-slate-400", label: "Closed", emoji: "🔒" },
    sent: { color: "bg-orange-500/10 border-orange-500/20 text-orange-400", label: "Sent to Client", emoji: "📤" }, // legacy fallback
  };

  const statusConfig = STATUS_CONFIG[inq.status] || STATUS_CONFIG.submitted;
  const statusColor = statusConfig.color;
  const statusText = `${statusConfig.emoji} ${statusConfig.label}`;

  const ageMs = Date.now() - new Date(inq.createdAt).getTime();
  const ageHours = ageMs / 3600000;
  const ageLabel =
    ageMs < 3600000
      ? `${Math.floor(ageMs / 60000)}m open`
      : `${Math.floor(ageHours)}h ${Math.floor((ageHours % 1) * 60)}m open`;
  const ageBadgeColor =
    inq.status !== "answered"
      ? ageHours > 4
        ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
        : ageHours > 1
          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
          : "bg-slate-700 text-slate-400 border-white/10"
      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

  const getClinicLabelText = (val?: string) => {
    return val ? getClinicLabel(val) : "N/A";
  };

  const generateClinicTemplateLocal = (inqData: Inquiry): string => {
    const ref = inqData.caseRef || `INQ-${inqData.id.substring(0, 8).toUpperCase()}`;
    const pName = inqData.patientName || "N/A";
    const fId = inqData.fileId || inqData.fileNumber || "N/A";
    const pId = inqData.patientId || "N/A";
    const pPhone = inqData.phoneNumber ? formatPhoneForCopy(inqData.phoneNumber) : "N/A";
    
    return [
      `📋 *CLINICAL INQUIRY TEMPLATE*`,
      `-----------------------------------`,
      `🆔 *Reference:* ${ref}`,
      `🏥 *Clinic:* ${getClinicLabelText(inqData.clinicName)}`,
      `👤 *Patient:* ${pName}`,
      `📁 *File ID:* ${fId}`,
      `🔑 *Patient ID:* ${pId}`,
      `📞 *Phone:* ${pPhone}`,
      `💬 *Inquiry Details:*`,
      `${inqData.text || "—"}`,
      `-----------------------------------`,
      `🧑‍💼 *Agent:* ${inqData.agentName}`,
      `📅 *Date:* ${inqData.createdAt ? new Date(inqData.createdAt).toLocaleString() : "N/A"}`,
    ].join('\n');
  };

  return (
    <div
      id={`inquiry-${inq.id}`}
      className={`p-5 bg-[#18181c] border border-slate-700/60 rounded-2xl hover:border-indigo-500/20 transition-all duration-300 overflow-hidden relative flex flex-col w-full ${!isExpanded ? "hover:bg-white/[0.04] cursor-pointer space-y-0 shadow-md" : "space-y-4 shadow-xl ring-1 ring-indigo-500/15"}`}
      onClick={() => {
        if (!isExpanded) {
          onToggle();
          if (handleTLViewInquiry) {
            handleTLViewInquiry(inq.id);
          }
        }
      }}
    >
      {/* Agent info, LOB and date */}
      <div 
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full ${isExpanded ? "border-b border-slate-700/60 pb-2.5 cursor-pointer hover:opacity-80" : ""}`}
        onClick={(e) => {
          if (isExpanded) {
            e.stopPropagation();
            onToggle();
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-xs shadow">
            {(inq.agentName || "")
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap text-left">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(
                    inq.agentName || "",
                    "Agent name copied!",
                  );
                }}
                className="text-xs font-bold text-slate-100 uppercase tracking-wide cursor-pointer hover:text-indigo-300 transition-colors"
                title="Copy Agent Name"
              >
                {inq.agentName}
              </span>
              <span className="text-[10px] text-slate-400 lowercase tracking-wide bg-white/5 border border-white/5 px-2 py-0.5 rounded font-sans">
                {getAgentLOB(inq.agentName)}
              </span>
              {inq.clinicName && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(
                      inq.clinicName || "",
                      "Clinic name copied!",
                    );
                  }}
                  className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 border border-indigo-500/30 rounded font-sans font-bold flex items-center gap-1 cursor-pointer hover:bg-indigo-500/30 transition-colors"
                  title="Copy Clinic"
                >
                  {getClinicLabelText(inq.clinicName)}
                </span>
              )}
              {inq.phoneNumber && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(
                      (inq.phoneNumber || "").replace(/^0+/, ""),
                      "Phone copied (no leading zero)",
                    );
                  }}
                  className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 border border-sky-500/20 rounded font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-sky-500/20 transition-colors"
                  title="Copy Phone Number"
                >
                  📞 {inq.phoneNumber}
                </span>
              )}
              {inq.platform && (
                <span
                  className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 border border-white/10 rounded font-sans font-bold flex items-center gap-1"
                  title="Inquiry Source Platform"
                >
                  🌐 {inq.platform}
                </span>
              )}
              {inq.customerType && (
                <span
                  className={`text-[10px] px-2 py-0.5 border rounded font-sans font-bold flex items-center gap-1 ${
                    inq.customerType === "new"
                      ? "bg-teal-500/10 text-teal-300 border-teal-500/20"
                      : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                  }`}
                  title="Customer Status"
                >
                  {inq.customerType === "new" ? "🆕 New" : "📂 Old"}
                </span>
              )}
              {inq.fileNumber && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(
                      inq.fileNumber || "",
                      "File number copied!",
                    );
                  }}
                  className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 border border-amber-500/20 rounded font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-amber-500/20 transition-colors"
                  title="Copy File Number"
                >
                  📁 File: {inq.fileNumber}
                </span>
              )}
              {inq.customerContacted === "contacted" && (
                <span
                  className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 border border-emerald-500/30 rounded font-sans font-bold flex items-center gap-1"
                  title="Customer is Contacted"
                >
                  Contacted
                </span>
              )}
              {inq.customerContacted === "attempted" && (
                <span
                  className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/30 rounded font-sans font-bold flex items-center gap-1"
                  title="Contact has been Attempted"
                >
                  ⏳ Contact Attempted
                </span>
              )}
              {(inq.customerContacted === "not_contacted" || !inq.customerContacted) && (
                <span
                  className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 border border-rose-500/30 rounded font-sans font-bold flex items-center gap-1"
                  title="Customer not contacted yet"
                >
                  Not Contacted
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[10px] text-slate-500 bg-black/20 px-1.5 py-0.5 rounded">
                {formatCaseRef(
                  inq.id,
                  "inquiry",
                  inq.createdAt,
                  inq.caseRef,
                )}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {new Date(inq.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const text = generateInquiryCopyText(inq);
              copyToClipboard(text, 'Inquiry details copied!');
            }}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copy Details"
          >
            <Copy className="w-3 h-3" />{" "}
            Copy Details
          </button>
          <span
            className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg uppercase tracking-wider shrink-0 ${statusColor}`}
          >
            {statusText}
          </span>
          {inq.status !== "answered" && (
            <span
              className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg shrink-0 flex items-center gap-1 ${ageBadgeColor}`}
            >
              ⏱ {ageLabel}
            </span>
          )}
          {inq.status === 'sent_to_clinic' && inq.sentAt && (
            <span className="px-2 py-0.5 border text-[9px] font-bold rounded-lg shrink-0 flex items-center gap-1 bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse font-sans">
              ⏱️ Sent {Math.floor((Date.now() - new Date(inq.sentAt).getTime()) / 60000)}m ago
            </span>
          )}
          {isSuperAdmin && handleDeleteInquiry && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteInquiry(inq.id);
              }}
              className="text-stone-400 hover:text-rose-400 p-1 rounded-md transition-all shrink-0 ml-1.5"
              title="Delete Inquiry"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="text-slate-400 hover:text-indigo-400 p-1 rounded-md transition-all shrink-0 ml-1 flex items-center justify-center">
            {isExpanded ? <ChevronUp className="w-4.5 h-4.5 text-indigo-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="w-full flex flex-col space-y-4 text-left">
          {/* Question body */}
          <div className="space-y-3 font-sans">
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {inq.text}
            </p>

            {/* Render attachments */}
            <AttachmentsDisplay
              photos={[
                ...(inq.photos || []),
                ...(inq.screenshot ? [inq.screenshot] : []),
                ...((inq as any).imageUrl ? [(inq as any).imageUrl] : []),
              ].filter(Boolean)}
              attachments={inq.attachments}
              links={inq.links || []}
              tlPhotos={inq.tlPhotos}
              tlLinks={inq.tlLinks}
              showSideBadges={true}
            />

            {/* Standardized Clinic Template Area */}
            {currentUser && currentUser.role === "tl" && (
              <div className="mt-4 p-4 bg-[#141416]/90 rounded-xl border border-indigo-500/15 space-y-3 text-left">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-xs font-bold text-indigo-400 font-display uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    📋 Partner Standard Template Review
                  </h4>
                  <button
                    onClick={() => {
                      const tpl = generateClinicTemplateLocal(inq);
                      copyToClipboard(tpl, "Standardized partner template copied successfully!");
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/25 text-white text-[10px] font-bold rounded-md transition-all flex items-center gap-1 active:scale-95 cursor-pointer font-sans"
                  >
                    <Copy className="w-3 h-3" /> Copy Standard Template
                  </button>
                </div>

                {/* Custom Review Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 font-sans">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={inq.patientName || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (setInquiries && inquiries) {
                          const updated = inquiries.map(i => i.id === inq.id ? { ...i, patientName: val } : i);
                          setInquiries(updated);
                          setStorageItem("sched_inquiries", updated);
                        }
                        await updateDoc(doc(db, "inquiries", inq.id), { patientName: val }).catch(err => console.error(err));
                      }}
                      className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-sans font-bold"
                      placeholder="Review/Edit Patient Name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 font-sans">
                      File ID / Number
                    </label>
                    <input
                      type="text"
                      value={inq.fileId || inq.fileNumber || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (setInquiries && inquiries) {
                          const updated = inquiries.map(i => i.id === inq.id ? { ...i, fileId: val, fileNumber: val } : i);
                          setInquiries(updated);
                          setStorageItem("sched_inquiries", updated);
                        }
                        await updateDoc(doc(db, "inquiries", inq.id), { fileId: val, fileNumber: val }).catch(err => console.error(err));
                      }}
                      className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-sans font-bold"
                      placeholder="Review/Edit File ID"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 font-sans">
                      Patient ID
                    </label>
                    <input
                      type="text"
                      value={inq.patientId || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (setInquiries && inquiries) {
                          const updated = inquiries.map(i => i.id === inq.id ? { ...i, patientId: val } : i);
                          setInquiries(updated);
                          setStorageItem("sched_inquiries", updated);
                        }
                        await updateDoc(doc(db, "inquiries", inq.id), { patientId: val }).catch(err => console.error(err));
                      }}
                      className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-sans font-bold"
                      placeholder="Review/Edit Patient ID"
                    />
                  </div>
                </div>

                {/* Preview Area */}
                <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[11px] leading-relaxed text-slate-300 select-all whitespace-pre-wrap">
                  {generateClinicTemplateLocal(inq)}
                </div>
              </div>
            )}

            {/* TL customerContacted quick update buttons */}
            {handleUpdateContactedStatus && (
              <div className="flex flex-wrap bg-slate-900/50 p-1 rounded-lg gap-1 border border-white/5 mt-3 w-max">
                <button
                  onClick={() =>
                    handleUpdateContactedStatus(
                      inq.id,
                      "not_contacted",
                    )
                  }
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${!inq.customerContacted || inq.customerContacted === "not_contacted" ? "bg-rose-500/20 text-rose-300 font-bold" : "text-slate-400 hover:bg-white/5"}`}
                >
                  Not Contacted
                </button>
                <button
                  onClick={() =>
                    handleUpdateContactedStatus(
                      inq.id,
                      "attempted",
                    )
                  }
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${inq.customerContacted === "attempted" ? "bg-amber-500/20 text-amber-300 font-bold" : "text-slate-400 hover:bg-white/5"}`}
                >
                  ⏳ Attempted
                </button>
                <button
                  onClick={() =>
                    handleUpdateContactedStatus(
                      inq.id,
                      "contacted",
                    )
                  }
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${inq.customerContacted === "contacted" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400 hover:bg-white/5"}`}
                >
                  Contacted
                </button>
              </div>
            )}
          </div>

          {/* Update and input tools */}
          <div className="pt-2 border-t border-white/5 space-y-3">
            {/* Default action stage button rows */}
            <div className="flex flex-wrap gap-2 items-center">
              {inq.status === 'submitted' && handleMarkInquiryRead && (
                <button
                  onClick={() => handleMarkInquiryRead(inq.id)}
                  className="px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 font-sans"
                >
                  👀 Mark as Read
                </button>
              )}

              {(inq.status === 'tl_reviewing' || inq.status === 'submitted') && handleMarkSentToClinic && (
                <button
                  onClick={() => handleMarkSentToClinic(inq.id)}
                  className="px-3.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 font-sans"
                >
                  <Send className="w-3.5 h-3.5" /> 📤 Sent to Clinic (Copy)
                </button>
              )}

              {(inq.status === 'sent_to_clinic' || inq.status === 'sent') && (
                <>
                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-orange-400 uppercase">
                    <Send className="w-3.5 h-3.5 animate-pulse" />
                    <span>
                      Sent by {inq.sentBy || "Unknown"} on {inq.sentAt ? new Date(inq.sentAt).toLocaleString() : "Unknown"}
                      {inq.sentToClinicCount && inq.sentToClinicCount > 1 ? ` (Follow-up #${inq.sentToClinicCount})` : ''}
                    </span>
                  </div>
                  {handleMarkSentToClinic && (
                    <button
                      onClick={() => handleMarkSentToClinic(inq.id)}
                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 font-sans"
                      title="Re-copy the template (e.g. if you need to re-send)"
                    >
                      <Copy className="w-3.5 h-3.5" /> Re-copy
                    </button>
                  )}
                </>
              )}

              {(inq.status === 'sent_to_clinic' || inq.status === 'sent' || inq.status === 'tl_reviewing') && (
                <button
                  onClick={() => { 
                    setAnsweringId(inq.id); 
                    setAnswerText(inq.answer || ''); 
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 font-sans"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Paste Clinic's Answer
                </button>
              )}

              {inq.status === 'answered' && handleCloseInquiry && (
                <button
                  onClick={() => handleCloseInquiry(inq.id)}
                  className="px-3.5 py-1.5 bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/40 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 font-sans"
                >
                  🔒 Close Inquiry
                </button>
              )}

              {inq.status === 'closed' && (
                <span className="text-[10px] text-slate-500 font-mono">
                  🔒 Closed by {inq.closedBy} on {new Date(inq.closedAt || '').toLocaleString()}
                </span>
              )}
            </div>

            <div className="relative">
              <InquiryRepliesViewer
                inquiry={inq}
              />
              {inq.status === "answered" && (
                <button
                  onClick={() => {
                    setAnsweringId(inq.id);
                    setAnswerText(inq.answer || "");
                  }}
                  className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold block"
                >
                  Reply Again / Edit
                </button>
              )}
            </div>

            {/* Reassign Agent Option */}
            {handleReassignInquiry && agentsList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  Reassign Agent:
                </span>
                <select
                  value={inq.agentName}
                  onChange={(e) =>
                    handleReassignInquiry(
                      inq.id,
                      e.target.value,
                    )
                  }
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-100 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
                >
                  {agentsList.map((aName) => (
                    <option
                      key={aName}
                      value={aName}
                      className="bg-[#1c1c1f] text-slate-100 font-sans"
                    >
                      {aName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dialog for answering inside pipeline cards */}
            {activeAnsweringId === inq.id && (
              <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl space-y-3 animate-fade-in text-left">
                <div className="flex justify-between items-center pb-1">
                  <h4 className="text-xs font-bold text-slate-100 font-display">
                    Feed Back / System Answer Details
                  </h4>
                  <button
                    onClick={() => {
                      setAnsweringId(null);
                      setAnswerText("");
                      setAnswerAttachments([]);
                      setAnswerLinks([]);
                    }}
                    className="text-slate-400 text-xs hover:text-slate-100"
                  >
                    Cancel
                  </button>
                </div>
                <div className="space-y-1">
                  <textarea
                    placeholder="Type the response/answer details clearly..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-all font-sans resize-none"
                  />
                  <div className="flex justify-end pr-1 text-[10px] text-slate-400 font-mono">
                    {answerText.length} / 500 characters
                  </div>
                </div>

                <ProfessionalAttachmentUploader
                  attachments={answerAttachments}
                  links={answerLinks}
                  onAttachmentsChange={setAnswerAttachments}
                  onLinksChange={setAnswerLinks}
                />

                <div className="w-full sm:w-64">
                  {handleSetInquiryAnswered ? (
                    <SlideToConfirm
                      label={isSubmitting ? "Submitting..." : "Slide to Answer"}
                      confirmedLabel="Answered!"
                      colorClass="from-emerald-500 to-teal-500"
                      onConfirm={() => handleSetInquiryAnswered(inq.id)}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <button
                      onClick={async () => {
                        toast.error("Answering from this dashboard is read-only.");
                      }}
                      className="w-full py-2 bg-slate-700/50 text-slate-400 font-bold text-xs rounded-lg cursor-not-allowed"
                    >
                      Answering is read-only
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Logs & Thread Edit / Reply Trigger */}
          {canEditItem && canEditItem(inq.createdAt) && setEditingItem && (
            <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingItem({
                    type: "inquiry",
                    id: inq.id,
                    data: { ...inq },
                  });
                }}
                className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title={`Edit Inquiry (${getRemainingEditTime ? getRemainingEditTime(inq.createdAt) : ""})`}
              >
                <Pencil className="w-3.5 h-3.5" /> Edit ({getRemainingEditTime ? getRemainingEditTime(inq.createdAt) : ""})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
