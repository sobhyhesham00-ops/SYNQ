import React, { useState } from "react";
import { User, Check, RefreshCw } from "lucide-react";
import { AGENT_LOBS } from "../../types";
import { CRMCase } from "./CRMTypes";

interface AssignmentControlProps {
  caseData: CRMCase;
  currentUser: any;
  isTLOreSupport: boolean;
  onAssign: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara', agentName: string) => Promise<void> | void;
  onClaim: (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara') => Promise<void> | void;
}

export const AssignmentControl: React.FC<AssignmentControlProps> = ({
  caseData,
  currentUser,
  isTLOreSupport,
  onAssign,
  onClaim,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getAgents = () => {
    return Object.keys(AGENT_LOBS).sort((a, b) => a.localeCompare(b));
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
      await onAssign(caseData.id, caseData.crmType, agentName);
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = !!currentAssigneeName;
  const isAssignedToMe = currentUser && currentAssigneeName?.toLowerCase() === currentUser.name?.toLowerCase();

  return (
    <div id="assignment-control" className="bg-[#121216] border border-white/5 p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Ownership & Assignment</span>
        {isAssigned ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            👤 Assigned
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            ⚠️ Unassigned
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 font-bold border border-white/10">
          {currentAssigneeName ? currentAssigneeName.charAt(0) : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 leading-none mb-1">Assignee</p>
          <p className="text-sm font-bold text-slate-200 truncate">
            {currentAssigneeName || "Unassigned Queue"}
          </p>
          {currentAssigneeName && (
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
              LOB: {AGENT_LOBS[currentAssigneeName] || "General"}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
        {/* Claim button if not assigned to self */}
        {!isAssignedToMe && currentUser && (
          <button
            onClick={handleClaim}
            disabled={loading}
            className="flex-1 min-w-[80px] bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            Claim Case
          </button>
        )}

        {/* Reassign dropdown button for Team Leaders */}
        {isTLOreSupport && (
          <div className="relative flex-1 min-w-[100px]">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-sans font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <User className="w-3 h-3" />
              {currentAssigneeName ? "Reassign" : "Assign"}
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-1.5 right-0 z-50 bg-[#1a1a20] border border-white/10 rounded-xl w-60 max-h-60 overflow-y-auto shadow-2xl p-1.5 space-y-0.5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2.5 py-1">
                  Select Assignee
                </p>
                {getAgents().map((agent) => (
                  <button
                    key={agent}
                    onClick={() => handleAssignSelect(agent)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-all flex items-center justify-between font-medium ${
                      currentAssigneeName === agent
                        ? "bg-indigo-600/20 text-indigo-300"
                        : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span>{agent}</span>
                    <span className="text-[8px] opacity-60 font-semibold uppercase tracking-wider">
                      {AGENT_LOBS[agent]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
