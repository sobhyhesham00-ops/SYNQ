import React, { useState, useEffect, useRef } from "react";
import { User, Check, RefreshCw, Search, X } from "lucide-react";
import { AGENT_LOBS } from "../../types";
import { CRMCase } from "./CRMTypes";
import { assignCase } from "../../services/assignmentService";
import { getAgentLOB } from "../../utils";
import { toast } from "sonner";

import { SlideToConfirm } from '../SlideToConfirm';

interface AssignmentControlProps {
  caseData: CRMCase;
  currentUser: any;
  isTLOreSupport: boolean;
  onAssign: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm', agentName: string) => Promise<void> | void;
  onClaim: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm') => Promise<void> | void;
}

export const AssignmentControl: React.FC<AssignmentControlProps> = ({
  caseData,
  currentUser,
  isTLOreSupport,
  onAssign,
  onClaim,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) {
      setAssignSearchQuery("");
    }
  }, [dropdownOpen]);

  const getAgents = () => {
    const all = Object.keys(AGENT_LOBS).sort((a, b) => a.localeCompare(b));
    return all.filter(agent => agent.toLowerCase().includes(assignSearchQuery.toLowerCase()));
  };

  const currentAssigneeName = caseData.crmType === "inquiry" ? caseData.agentName : caseData.assignedToName;

  const handleClaim = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await onClaim(caseData.id, caseData.crmType);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSelect = async (agentName: string) => {
    setDropdownOpen(false);
    setLoading(true);
    try {
      const mappedType = caseData.crmType === "tabby_tamara" ? "tt_request" : caseData.crmType === "complaint" ? "tt_complaint" : caseData.crmType;
      const assigneeId = "usr_" + agentName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const success = await assignCase(mappedType, caseData.id, { id: assigneeId, name: agentName }, currentUser);
      if (success) {
        await onAssign(caseData.id, caseData.crmType, agentName);
      } else {
        toast.error("Failed to assign case.");
      }
    } catch (err: any) {
      toast.error("Error during case assignment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = !!currentAssigneeName;
  const isAssignedToMe = currentUser && currentAssigneeName?.toLowerCase() === currentUser.name?.toLowerCase();

  return (
    <div id="assignment-control" className="bg-transparent border border-white/8 p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Ownership & Assignment</span>
        {isAssigned ? (
          <span className="text-[11px] px-2 py-0.5 rounded-lg font-bold bg-transparent border border-white/12 text-white text-indigo-400 border border-transparent">
            👤 Assigned
          </span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 rounded-lg font-bold bg-amber-500/10 text-amber-400 border border-transparent animate-pulse">
            ⚠️ Unassigned
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-300 font-bold border border-white/8">
          {currentAssigneeName ? currentAssigneeName.charAt(0) : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-400 leading-none mb-1">Assignee</p>
          <p className="text-xs font-bold text-slate-200 truncate">
            {currentAssigneeName || "Unassigned Queue"}
          </p>
          {currentAssigneeName && getAgentLOB(currentAssigneeName) && (
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              LOB: {getAgentLOB(currentAssigneeName)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/8">
        {/* Claim button if not assigned to self */}
        {!isAssignedToMe && currentUser && (
          <SlideToConfirm
            label="Slide to Claim This Case"
            confirmedLabel="Claimed!"
            colorClass="from-indigo-500 to-purple-500"
            icon={<Check className="w-5 h-5 text-white" />}
            onConfirm={handleClaim}
            disabled={loading}
          />
        )}

        {/* Reassign dropdown button for Team Leaders */}
        {isTLOreSupport && (
          <div className="relative flex-1 min-w-[100px]" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/8 font-sans font-bold text-[11px] uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <User className="w-3 h-3" />
              {currentAssigneeName ? "Reassign" : "Assign"}
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-1.5 right-0 z-50 bg-slate-950 border border-white/8 rounded-xl w-64 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-2.5 border-b border-white/8/40 bg-[#18181f] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assign Agent</span>
                  <button 
                    onClick={() => setDropdownOpen(false)}
                    className="text-slate-500 hover:text-slate-350 p-0.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search Box */}
                <div className="p-2 border-b border-white/8/20 bg-[#16161b]">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search agent..."
                      value={assignSearchQuery}
                      onChange={(e) => setAssignSearchQuery(e.target.value)}
                      className="w-full bg-[#1e1e24] border border-white/8/40 rounded-xl text-[11px] py-1.5 pl-8 pr-7 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/85 transition-colors font-sans"
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
                <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 bg-[#15151a] scrollbar-thin">
                  {getAgents().length === 0 ? (
                    <p className="text-center py-6 text-[11px] text-slate-500 font-sans">No agents found</p>
                  ) : (
                    getAgents().map((agent) => {
                      const lob = getAgentLOB(agent);
                      const isSelected = currentAssigneeName === agent;
                      const isChat = lob === 'Chat';
                      return (
                        <button
                          key={agent}
                          onClick={() => handleAssignSelect(agent)}
                          className={`w-full text-left px-2.5 py-1.5 text-[11px] rounded-xl transition-all flex items-center justify-between font-medium cursor-pointer ${ isSelected ? "bg-indigo-500/10 text-indigo-300 font-bold border border-transparent" : "text-slate-300 hover:bg-white/[0.06] hover:text-white" }`}
                        >
                          <span className="truncate pr-2">{agent}</span>
                          {lob && (
                            <span className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${ isChat ? "bg-emerald-500/10 text-emerald-400 border border-transparent" : "bg-blue-500/10 text-blue-450 border border-transparent" }`}>
                              {lob === 'Chat' ? 'Chat' : 'Call'}
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
      </div>
    </div>
  );
};
