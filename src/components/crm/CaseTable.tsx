import React, { useState } from "react";
import { 
  Paperclip, 
  MessageSquare, 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle, 
  Clock, 
  User, 
  CornerDownRight,
  Eye,
  Copy
} from "lucide-react";
import { CRMCase } from "./CRMTypes";
import { formatCaseRef, getSLAStatus } from "../../utils";
import { CaseDetailDrawer } from "./CaseDetailDrawer";

interface CaseTableProps {
  cases: CRMCase[];
  selectedCaseId: string | null;
  onSelectCase: (c: CRMCase) => void;
  sortBy: string;
  onSortChange: (field: 'newest' | 'oldest' | 'sla_urgency' | 'last_updated') => void;
  // inline drawer props (optional)
  currentUser?: any;
  isTLOreSupport?: boolean;
  addSystemNotification?: any;
  onAssignCase?: any;
  onClaimCase?: any;
  onDeleteCase?: any;
  onEditItem?: any;
  onSendToPartner?: any;
  onMarkInquirySent?: any;
  onMarkPatientContactedTT?: any;
  onTLCommentComplaint?: any;
  onCloseComplaint?: any;
  onReopenComplaint?: any;
  onCopyCase?: (item: CRMCase) => void;
}

const CLINIC_LABELS: Record<string, string> = {
  dermadent: "Dermadent",
  onetouch_mo3tred: "One Touch AlMutarid",
  onetouch_merkhnya: "One Touch Markhaniya",
  welltouch: "Well Touch",
  newage: "New Age",
};

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  sortBy,
  onSortChange,
  // inline drawer props
  currentUser,
  isTLOreSupport = false,
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
  onCopyCase,
}) => {
  const getStatusBadge = (crmType: string, status: string) => {
    let style = "bg-slate-500/10 text-slate-400";
    let label = status?.replace(/_/g, ' ') || 'Submitted';
    
    if (["submitted", "not_confirmed", "awaiting_client_contact"].includes(status)) {
      style = "bg-amber-500/10 text-amber-500";
      label = "New / Pending";
    } else if (status === "tl_reviewing") {
      style = "bg-blue-500/10 text-blue-400";
      label = "TL Review";
    } else if (["sent_to_clinic", "sent"].includes(status)) {
      style = "bg-orange-500/10 text-orange-400";
      label = "Sent to Clinic";
    } else if (["in_progress", "need_contact"].includes(status)) {
      style = "bg-purple-500/10 text-purple-400";
      label = "In Progress";
    } else if (["answered", "resolved", "contacted"].includes(status)) {
      style = "bg-emerald-500/10 text-emerald-400";
      label = "Resolved";
    } else if (status === "closed") {
      style = "bg-slate-500/10 text-slate-400";
      label = "Closed";
    } else if (status === "pending_tl") {
      style = "bg-yellow-500/10 text-yellow-400";
      label = "Pending TL";
    }

    return (
      <span 
        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide inline-block max-w-full truncate ${style}`}
        title={label}
      >
        {label}
      </span>
    );
  };

  const getTypeBadge = (item: CRMCase) => {
    if (item.crmType === "inquiry") {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Inquiry
        </span>
      );
    } else if (item.crmType === "complaint") {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Complaint
        </span>
      );
    } else if (item.crmType === "client_comm") {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Client Comm
        </span>
      );
    } else {
      const platform = item.raw.platform;
      if (platform === "tamara") {
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Tamara
          </span>
        );
      } else if (platform === "tabby") {
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            Tabby
          </span>
        );
      } else if (platform === "one_time_payment") {
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            One Time
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          Payment
        </span>
      );
    }
  };

  return (
    <div id="crm-table-container" className="w-full h-full flex flex-col min-h-0 bg-[#0d0d11] rounded-2xl border border-white/5 overflow-hidden">
      {/* Table grid for larger screens */}
      <div className="hidden lg:block overflow-x-auto min-h-0 custom-scrollbar">
        <table className="w-full min-w-[900px] text-left text-xs text-slate-300 whitespace-nowrap table-fixed">
          <thead className="bg-[#121216] text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-white/5 sticky top-0 z-15">
            <tr>
              <th className="p-2 w-6"></th>
              <th className="p-2 w-32">
                <button 
                  onClick={() => onSortChange(sortBy === 'newest' ? 'oldest' : 'newest')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  Reference {sortBy === 'newest' ? <ChevronDown className="w-3 h-3" /> : sortBy === 'oldest' ? <ChevronUp className="w-3 h-3" /> : null}
                </button>
              </th>
              <th className="p-2 w-20">Type</th>
              <th className="p-2 w-48">Patient / Subject</th>
              <th className="p-2 w-24">Clinic</th>
              <th className="p-2 w-24">Assignee</th>
              <th className="p-2 w-28">Status</th>
              <th className="p-2 w-28">
                <button 
                  onClick={() => onSortChange('sla_urgency')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  SLA / Age {sortBy === 'sla_urgency' ? <ChevronDown className="w-3 h-3 text-emerald-400" /> : null}
                </button>
              </th>
              <th className="p-2 w-8 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-500 italic">
                  No cases found matching the filter criteria.
                </td>
              </tr>
            ) : (
              cases.map((item) => {
                const isSelected = selectedCaseId === item.id;
                const sla = getSLAStatus(item.createdAt, item.status, ["answered", "resolved", "closed"]);
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => onSelectCase(item)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "bg-indigo-600/10 text-white font-medium border-l-4 border-indigo-500"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="p-2 text-center">
                        {item.unread && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto" title="Unread activity" />
                        )}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-slate-100 font-bold truncate">
                        {item.referenceId}
                      </td>
                      <td className="p-2">
                        {getTypeBadge(item)}
                      </td>
                      <td className="p-2 max-w-[180px] truncate" title={item.patientName}>
                        <span className="font-bold text-slate-100 block truncate">
                          {item.patientName || "—"}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5 font-mono">
                          {item.phoneNumber || "—"}
                        </span>
                      </td>
                      <td className="p-2 truncate text-slate-400 font-medium text-[11px]">
                        {CLINIC_LABELS[item.clinicName] || item.clinicName}
                      </td>
                      <td className="p-2 truncate text-slate-400 text-[11px]">
                        {item.crmType === "inquiry" ? item.agentName : item.assignedToName || "Unassigned"}
                      </td>
                      <td className="p-2 overflow-hidden">
                        {getStatusBadge(item.crmType, item.status)}
                      </td>
                      <td className="p-2">
                        <span 
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border ${sla.color}`}
                          title={`Created: ${new Date(item.createdAt).toLocaleString()}`}
                        >
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          {sla.label}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(item);
                            if (onCopyCase) onCopyCase(item);
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10 flex items-center justify-center mx-auto"
                          title="Copy Case"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                    {isSelected && item.crmType === "inquiry" && (
                      <tr key={`${item.id}-details`} className="bg-[#050508]/65">
                        <td colSpan={9} className="p-5 border-t border-b border-indigo-500/25">
                          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-[#09090c] text-left">
                            <CaseDetailDrawer
                              caseData={item}
                              onClose={() => onSelectCase(item)}
                              currentUser={currentUser}
                              isTLOreSupport={isTLOreSupport}
                              addSystemNotification={addSystemNotification}
                              onAssignCase={onAssignCase}
                              onClaimCase={onClaimCase}
                              onDeleteCase={onDeleteCase}
                              onEditItem={onEditItem}
                              onSendToPartner={onSendToPartner}
                              onMarkInquirySent={onMarkInquirySent}
                              onMarkPatientContactedTT={onMarkPatientContactedTT}
                              onTLCommentComplaint={onTLCommentComplaint}
                              onCloseComplaint={onCloseComplaint}
                              onReopenComplaint={onReopenComplaint}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile dense list (hidden on desktop) */}
      <div className="lg:hidden divide-y divide-white/[0.04] overflow-y-auto max-h-[80vh]">
        {cases.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic">
            No cases found
          </div>
        ) : (
          cases.map((item) => {
            const isSelected = selectedCaseId === item.id;
            const sla = getSLAStatus(item.createdAt, item.status, ["answered", "resolved", "closed"]);
            return (
              <React.Fragment key={item.id}>
                <div
                  onClick={() => onSelectCase(item)}
                  className={`p-4 cursor-pointer transition-all space-y-3 ${
                    isSelected ? "bg-indigo-600/15 border-l-4 border-indigo-500 text-white" : "hover:bg-white/[0.01]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-100 font-black">
                      {item.referenceId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                      {getTypeBadge(item)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-200">
                      {item.patientName || "Subject Log"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {item.phoneNumber || "—"}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.subject}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {getStatusBadge(item.crmType, item.status)}
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border ${sla.color}`}>
                      <Clock className="w-2.5 h-2.5" />
                      {sla.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      {CLINIC_LABELS[item.clinicName] || item.clinicName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/[0.02]">
                    <span className="truncate">
                      👤 {item.crmType === "inquiry" ? item.agentName : item.assignedToName || "Unassigned"}
                    </span>
                    <div className="flex items-center gap-2">
                       <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(item);
                            if (onCopyCase) onCopyCase(item);
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10 flex items-center justify-center"
                          title="Copy Case"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                  </div>
                </div>
                {isSelected && item.crmType === "inquiry" && (
                  <div className="p-4 bg-[#050508]/80 border-t border-b border-indigo-500/20 text-left">
                    <CaseDetailDrawer
                      caseData={item}
                      onClose={() => onSelectCase(item)}
                      currentUser={currentUser}
                      isTLOreSupport={isTLOreSupport}
                      addSystemNotification={addSystemNotification}
                      onAssignCase={onAssignCase}
                      onClaimCase={onClaimCase}
                      onDeleteCase={onDeleteCase}
                      onEditItem={onEditItem}
                      onSendToPartner={onSendToPartner}
                      onMarkInquirySent={onMarkInquirySent}
                      onMarkPatientContactedTT={onMarkPatientContactedTT}
                      onTLCommentComplaint={onTLCommentComplaint}
                      onCloseComplaint={onCloseComplaint}
                      onReopenComplaint={onReopenComplaint}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
