import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Layers, 
  User, 
  FolderLock, 
  CheckCircle2, 
  Users, 
  Trash2, 
  SlidersHorizontal 
} from "lucide-react";
import { CRMFiters, CRMQuickView } from "./CRMTypes";

interface CaseCommandBarProps {
  filters: CRMFiters;
  onFiltersChange: (f: CRMFiters) => void;
  quickView: CRMQuickView;
  onQuickViewChange: (q: CRMQuickView) => void;
  totalResults: number;
  onClearFilters: () => void;
  uniqueClinics: string[];
  uniqueSubmitters: string[];
  uniqueAssignees: string[];
}

const CLINIC_LABELS: Record<string, string> = {
  dermadent: "Dermadent",
  onetouch_mo3tred: "One Touch AlMutarid",
  onetouch_merkhnya: "One Touch Markhaniya",
  welltouch: "Well Touch",
  newage: "New Age",
};

export const CaseCommandBar: React.FC<CaseCommandBarProps> = ({
  filters,
  onFiltersChange,
  quickView,
  onQuickViewChange,
  totalResults,
  onClearFilters,
  uniqueClinics,
  uniqueSubmitters,
  uniqueAssignees,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchQuery: e.target.value,
    });
  };

  const handleFilterSelect = (name: keyof CRMFiters, value: string) => {
    onFiltersChange({
      ...filters,
      [name]: value,
    });
  };

  const hasActiveFilters = 
    filters.searchQuery || 
    filters.status || 
    filters.type !== 'all' || 
    filters.clinic || 
    filters.submitter || 
    filters.assignee || 
    filters.sourceChannel || 
    filters.sla !== 'all' || 
    filters.date;

  return (
    <div id="case-search-filter-command-bar" className="bg-white/[0.05] border border-white/5 p-4 rounded-2xl space-y-4 sticky top-0 z-40 shadow">
      {/* 1. View Segment Filters & Count */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex flex-wrap gap-2.5">
          {[
            { id: "my_cases", label: "My Cases", icon: <User className="w-3.5 h-3.5" /> },
            { id: "unassigned", label: "Unassigned Queue", icon: <Layers className="w-3.5 h-3.5" /> },
            { id: "team_queue", label: "All Cases", icon: <Users className="w-3.5 h-3.5" /> },
            { id: "closed", label: "Closed Archive", icon: <CheckCircle2 className="w-3.5 h-3.5" /> }
          ].map((v) => {
            const isActive = quickView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onQuickViewChange(v.id as CRMQuickView)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/10 ring-1 ring-indigo-500/20"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                }`}
              >
                {v.icon}
                {v.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span>Results:</span>
          <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/15 text-indigo-300 font-extrabold rounded-xl font-mono">
            {totalResults} matches
          </span>
        </div>
      </div>

      {/* 2. Main Search Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by reference, patient name, phone, assignee, comment text..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-white/[0.03] border border-white/10 pl-10 pr-4 py-2 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Advanced filters toggler */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              showAdvanced || hasActiveFilters
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-black"
                : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="Clear all search parameters and filters"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Dropdown-based Collapsible Filter Sub-panel */}
      {(showAdvanced || hasActiveFilters) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/5 bg-transparent p-4 rounded-xl">
          {/* Filter 1: Case Type */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Case Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterSelect('type', e.target.value)}
              className="w-full bg-[#1b1b22] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-sans cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="inquiry">Inquiries</option>
              <option value="complaint">Complaints</option>
              <option value="tabby_tamara">Tabby & Tamara Requests</option>
            </select>
          </div>

          {/* Filter 2: Clinic */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Clinic Name</label>
            <select
              value={filters.clinic}
              onChange={(e) => handleFilterSelect('clinic', e.target.value)}
              className="w-full bg-[#1b1b22] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-sans cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Clinics</option>
              {uniqueClinics.map((c) => (
                <option key={c} value={c}>
                  {CLINIC_LABELS[c] || c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Submitter */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Created By</label>
            <select
              value={filters.submitter}
              onChange={(e) => handleFilterSelect('submitter', e.target.value)}
              className="w-full bg-[#1b1b22] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-sans cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Submitters</option>
              {uniqueSubmitters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: Assignee */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Assignee</label>
            <select
              value={filters.assignee}
              onChange={(e) => handleFilterSelect('assignee', e.target.value)}
              className="w-full bg-[#1b1b22] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-sans cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Assignees</option>
              {uniqueAssignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 5: SLA Age */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">SLA Age</label>
            <select
              value={filters.sla}
              onChange={(e) => handleFilterSelect('sla', e.target.value)}
              className="w-full bg-[#1b1b22] border border-[#ff0055]/5 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-sans cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Any SLA Age</option>
              <option value="unresolved">Open / Unresolved Only</option>
              <option value="over_24h">🚨 Red Range (&gt; 24h open)</option>
              <option value="over_4h">⚠️ Orange Range (&gt; 4h open)</option>
              <option value="over_1h">⚡ Amber Range (&gt; 1h open)</option>
              <option value="under_1h">⏱️ Fresh Range (&lt; 1h open)</option>
            </select>
          </div>

          {/* Filter 6: Status */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Status Filter</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterSelect('status', e.target.value)}
              className="w-full bg-[#1b1b22] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-sans cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="">Any Status</option>
              <option value="submitted">Submitted</option>
              <option value="answered">Answered / Replied</option>
              <option value="sent">Sent to Partner</option>
              <option value="not_confirmed">Not Confirmed</option>
              <option value="confirmed">Confirmed</option>
              <option value="closed">Closed / Solved</option>
            </select>
          </div>

          {/* Filter 7: Date Range */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Created Date</label>
            <div className="relative">
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterSelect('date', e.target.value)}
                className="w-full bg-[#1b1b22] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-sans cursor-pointer focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Filter 8: Source Channel */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Source Channel</label>
            <select
              value={filters.sourceChannel}
              onChange={(e) => handleFilterSelect('sourceChannel', e.target.value)}
              className="w-full bg-[#1b1b22] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-sans cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="">Any Channel</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="call_center">Call Center</option>
              <option value="chat">Web Chat</option>
              <option value="social">Social Media</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
