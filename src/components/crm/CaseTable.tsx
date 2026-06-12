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
  Eye
} from "lucide-react";
import { CRMCase } from "./CRMTypes";
import { formatCaseRef, getSLAStatus } from "../../utils";

interface CaseTableProps {
  cases: CRMCase[];
  selectedCaseId: string | null;
  onSelectCase: (c: CRMCase) => void;
  sortBy: string;
  onSortChange: (field: 'newest' | 'oldest' | 'sla_urgency' | 'last_updated') => void;
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
}) => {
  const getStatusBadge = (crmType: string, status: string) => {
    let style = "bg-slate-800 text-slate-300 border-white/5";
    let label = status?.replace(/_/g, ' ') || 'Submitted';
    if (status === "awaiting_client_contact") {
      label = "Awaiting Contact";
    } else if (status === "not_confirmed") {
      label = "Not Confirmed";
    }

    if (status === "answered" || status === "resolved") {
      style = "bg-emerald-500/10 text-emerald-400 border-emerald-500/10";
    } else if (status === "not_confirmed" || status === "awaiting_client_contact" || status === "submitted") {
      style = "bg-amber-500/10 text-amber-400 border-amber-500/10 animate-pulse";
    } else if (status === "sent") {
      style = "bg-orange-500/10 text-orange-400 border-orange-500/10";
    } else if (status === "closed") {
      style = "bg-rose-500/10 text-rose-400 border-rose-500/10";
    }

    return (
      <span 
        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${style} inline-block max-w-full truncate leading-tight`}
        style={{ letterSpacing: '0.02em' }}
        title={label}
      >
        {label}
      </span>
    );
  };

  const getTypeBadge = (item: CRMCase) => {
    if (item.crmType === "inquiry") {
      return (
        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#1e1b4b] text-indigo-300 border border-indigo-500/20">
          Inquiry
        </span>
      );
    } else if (item.crmType === "complaint") {
      return (
        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#4c0519] text-rose-300 border border-rose-500/20">
          Complaint
        </span>
      );
    } else {
      const platform = item.raw.platform;
      if (platform === "tamara") {
        return (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#ff9900]/10 text-[#ffb84d] border border-[#ff9900]/20">
            Tamara
          </span>
        );
      } else if (platform === "tabby") {
        return (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#00e3a5]/10 text-[#2effc3] border border-[#00e3a5]/20">
            Tabby
          </span>
        );
      } else if (platform === "one_time_payment") {
        return (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            One Time
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          Unknown
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
              <th className="p-2 w-8 text-center">📎</th>
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
                  <tr
                    key={item.id}
                    onClick={() => onSelectCase(item)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-600/10 text-white font-medium border-l-2 border-indigo-500"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="p-2 text-center">
                      {item.unread && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mx-auto" title="Unread activity" />
                      )}
                    </td>
                    <td className="p-2 font-mono text-[10px] text-slate-100 font-bold truncate">
                      {item.referenceId}
                    </td>
                    <td className="p-2">
                      {getTypeBadge(item)}
                    </td>
                    <td className="p-2 max-w-[180px] truncate" title={item.patientName || item.subject}>
                      <span className="font-semibold text-slate-200 block truncate">
                        {item.patientName || "—"}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                        {item.subject}
                      </span>
                    </td>
                    <td className="p-2 truncate text-slate-400 font-medium text-[11px]">
                      {CLINIC_LABELS[item.clinicName] || item.clinicName}
                    </td>
                    <td className="p-2 truncate text-slate-400 text-[11px]">
                      {item.crmType === "inquiry" ? item.agentName : item.assignedToName || "Unassigned Queue"}
                    </td>
                    <td className="p-2 overflow-hidden">
                      {getStatusBadge(item.crmType, item.status)}
                    </td>
                    <td className="p-2">
                      <span 
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border ${sla.color}`}
                        title={`Last updated: ${new Date(item.updatedAt || item.createdAt).toLocaleString()}`}
                      >
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        {sla.label}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-1.5 text-slate-500">
                        {item.attachmentCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px]" title={`${item.attachmentCount} Attachment(s)`}>
                            <Paperclip className="w-3 h-3" />
                          </span>
                        )}
                        {item.replyCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px]" title={`${item.replyCount} Reply(s)`}>
                            <MessageSquare className="w-3 h-3" />
                          </span>
                        )}
                        {item.attachmentCount === 0 && item.replyCount === 0 && (
                          <span className="text-slate-700">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
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
              <div
                key={item.id}
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
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.subject}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {getStatusBadge(item.crmType, item.status)}
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] border ${sla.color}`}>
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
                    {item.attachmentCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Paperclip className="w-3 h-3" /> {item.attachmentCount}
                      </span>
                    )}
                    {item.replyCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="w-3 h-3" /> {item.replyCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
