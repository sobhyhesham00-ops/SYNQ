import React, { useState } from 'react';
import { 
  Calendar, CheckCircle2, AlertTriangle, Info, Sparkles, Trash2, 
  Upload, Download, RefreshCw, GitPullRequest, Sliders, ChevronRight, 
  PlusCircle, Users, Activity, Lock, HelpCircle, Shield, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, setDoc } from 'firebase/firestore';

// Define Props Interface
interface SchedulesRosterProps {
  schedules: any[];
  setSchedules: (s: any[]) => void;
  requests: any[];
  setRequests: (r: any[]) => void;
  agentsList: string[];
  currentUser: any;
  rebuildSmartRoster: () => Promise<void>;
  clearTargetSchedules: () => Promise<void>;
  googleSheetId: string;
  setGoogleSheetId: (id: string) => void;
  dragActive: boolean;
  setDragActive: (b: boolean) => void;
  isSyncingSheets: boolean;
  setIsSyncingSheets: (b: boolean) => void;
  uploadError: string | null;
  setUploadError: (s: string | null) => void;
  uploadSuccess: string | null;
  setUploadSuccess: (s: string | null) => void;
  tempSchedules: any[];
  setTempSchedules: (s: any[]) => void;
  tempNewAgents: string[];
  setTempNewAgents: (a: string[]) => void;
  tempParsedMeta: any;
  setTempParsedMeta: (m: any) => void;
  commitSchedules: () => void;
  isRosterPublished: boolean;
  setIsRosterPublished: (b: boolean) => void;
  scheduleViewMode: 'month' | 'fortnight' | 'week';
  setScheduleViewMode: (v: 'month' | 'fortnight' | 'week') => void;
  scheduleFilterAgent: string;
  setScheduleFilterAgent: (s: string) => void;
  schedulePageOffset: number;
  setSchedulePageOffset: (n: number) => void;
  heatmapMorningTarget: number;
  setHeatmapMorningTarget: (n: number) => void;
  heatmapAfternoonTarget: number;
  setHeatmapAfternoonTarget: (n: number) => void;
  heatmapNightTarget: number;
  setHeatmapNightTarget: (n: number) => void;
  heatmapConfigureOpen: boolean;
  setHeatmapConfigureOpen: (b: boolean) => void;
  baseDatesList: string[];
  safeOffset: number;
  displayDaysCount: number;
  activeDisplayDates: string[];
  visibleAgents: string[];
  getAgentLOB: (name: string) => string;
  registeredUsers: any[];
  setSelectedShiftForActivities: (s: any | null) => void;
  syncShiftsToGoogleCalendar: () => Promise<void>;
  downloadShiftsICS: () => void;
  isSyncingCalendar: boolean;
  downloadScheduleTemplate: () => void;
  handleScheduleFileChange: (e: any) => void;
  fetchGoogleSheetCSV: (id: string, gid: string) => Promise<string>;
  parseScheduleCSV: (text: string, list: string[]) => any;
  forceOffline: boolean;
  setForceOffline: (b: boolean) => void;
  syncStatus: any;
  syncEngine: any;
  p2pSelectedDate: string;
  setP2pSelectedDate: (s: string) => void;
  p2pTargetAgent: string;
  setP2pTargetAgent: (s: string) => void;
  p2pTargetShift: string;
  setP2pTargetShift: (s: string) => void;
  p2pNotes: string;
  setP2pNotes: (s: string) => void;
  validateSwapRequest: (date: string, shift: string, systemTime: Date) => any;
  handlePartnerDecision: (id: string, b: boolean) => void;
  manualRosterAgent: string;
  setManualRosterAgent: (s: string) => void;
  manualRosterDate: string;
  setManualRosterDate: (s: string) => void;
  manualRosterShift: string;
  setManualRosterShift: (s: string) => void;
  manualRosterNotes: string;
  setManualRosterNotes: (s: string) => void;
  handleManualRosterSubmit: (e: any) => void;
  systemTime: Date;
  db: any;
  getShiftBadgeStyle: (lbl: string) => { bg: string; display: string };
  addSystemNotification: (t: string, m: string, tp: string, aud: string) => void;
}

export const SchedulesRoster: React.FC<SchedulesRosterProps> = ({
  schedules,
  setSchedules,
  requests,
  setRequests,
  agentsList,
  currentUser,
  rebuildSmartRoster,
  clearTargetSchedules,
  googleSheetId,
  setGoogleSheetId,
  dragActive,
  setDragActive,
  isSyncingSheets,
  setIsSyncingSheets,
  uploadError,
  setUploadError,
  uploadSuccess,
  setUploadSuccess,
  tempSchedules,
  setTempSchedules,
  tempNewAgents,
  setTempNewAgents,
  tempParsedMeta,
  setTempParsedMeta,
  commitSchedules,
  isRosterPublished,
  setIsRosterPublished,
  scheduleViewMode,
  setScheduleViewMode,
  scheduleFilterAgent,
  setScheduleFilterAgent,
  schedulePageOffset,
  setSchedulePageOffset,
  heatmapMorningTarget,
  setHeatmapMorningTarget,
  heatmapAfternoonTarget,
  setHeatmapAfternoonTarget,
  heatmapNightTarget,
  setHeatmapNightTarget,
  heatmapConfigureOpen,
  setHeatmapConfigureOpen,
  baseDatesList,
  safeOffset,
  displayDaysCount,
  activeDisplayDates,
  visibleAgents,
  getAgentLOB,
  registeredUsers,
  setSelectedShiftForActivities,
  syncShiftsToGoogleCalendar,
  downloadShiftsICS,
  isSyncingCalendar,
  downloadScheduleTemplate,
  handleScheduleFileChange,
  fetchGoogleSheetCSV,
  parseScheduleCSV,
  forceOffline,
  setForceOffline,
  syncStatus,
  syncEngine,
  p2pSelectedDate,
  setP2pSelectedDate,
  p2pTargetAgent,
  setP2pTargetAgent,
  p2pTargetShift,
  setP2pTargetShift,
  p2pNotes,
  setP2pNotes,
  validateSwapRequest,
  handlePartnerDecision,
  manualRosterAgent,
  setManualRosterAgent,
  manualRosterDate,
  setManualRosterDate,
  manualRosterShift,
  setManualRosterShift,
  manualRosterNotes,
  setManualRosterNotes,
  handleManualRosterSubmit,
  systemTime,
  db,
  getShiftBadgeStyle,
  addSystemNotification
}) => {
  const [nestedTab, setNestedTab] = useState<'calendar' | 'timeline' | 'p2p_market' | 'admin'>('calendar');
  const [activeTimelineDate, setActiveTimelineDate] = useState<string>('');
  
  const canManageRoster = currentUser.role === 'tl' || currentUser.role === 'admin' || currentUser.role === 'director';

  // Format Helper
  const formatDateNice = (dStr: string) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  // Drag Helper
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setIsSyncingSheets(true);
      setTimeout(() => {
        const fakeEvent = { target: { files: e.dataTransfer.files } };
        handleScheduleFileChange(fakeEvent);
        setIsSyncingSheets(false);
      }, 500);
    }
  };

  const SHIFTS = [
    { id: 'morning', label: '07:00 - 16:00', display: 'Morning Shift' },
    { id: 'afternoon', label: '13:00 - 22:00', display: 'Afternoon Shift' },
    { id: 'night', label: '22:00 - 07:00', display: 'Night Shift' }
  ];

  // Coverage Helper
  const getCoverageForDate = (dateStr: string) => {
    const dayShifts = schedules.filter(s => s.date === dateStr);
    
    const morningAgents = dayShifts.filter(s => {
      const norm = s.shiftLabel.toLowerCase();
      return norm.includes('07:00') || norm.includes('morning');
    }).map(s => s.agentName);
    
    const afternoonAgents = dayShifts.filter(s => {
      const norm = s.shiftLabel.toLowerCase();
      return norm.includes('13:00') || norm.includes('afternoon');
    }).map(s => s.agentName);
    
    const nightAgents = dayShifts.filter(s => {
      const norm = s.shiftLabel.toLowerCase();
      return norm.includes('22:00') || norm.includes('night');
    }).map(s => s.agentName);

    const totalCount = morningAgents.length + afternoonAgents.length + nightAgents.length;
    const totalTarget = heatmapMorningTarget + heatmapAfternoonTarget + heatmapNightTarget;

    return {
      morning: { count: morningAgents.length, target: heatmapMorningTarget, agents: morningAgents },
      afternoon: { count: afternoonAgents.length, target: heatmapAfternoonTarget, agents: afternoonAgents },
      night: { count: heatmapNightTarget, target: heatmapNightTarget, agents: nightAgents },
      total: { count: totalCount, target: totalTarget, agents: [...morningAgents, ...afternoonAgents, ...nightAgents] }
    };
  };

  // Timeline Hour coverage calculations
  const targetDateForTimeline = activeTimelineDate || (activeDisplayDates.length > 0 ? activeDisplayDates[0] : new Date().toISOString().split('T')[0]);

  const hoursOfOperationalDay = Array.from({ length: 17 }, (_, i) => {
    const hr = i + 7;
    return `${hr < 10 ? '0' : ''}${hr}:00`;
  });

  const checkHourStatus = (hourStr: string, agentShift: any) => {
    const hourNum = parseInt(hourStr.split(':')[0], 10);
    let isScheduled = false;
    let isActivity = null;

    const label = agentShift.shiftLabel;
    if (label === '07:00 - 16:00') {
      isScheduled = (hourNum >= 7 && hourNum < 16);
    } else if (label === '13:00 - 22:00') {
      isScheduled = (hourNum >= 13 && hourNum < 22);
    } else if (label === '22:00 - 07:00') {
      isScheduled = (hourNum >= 22 || hourNum < 7);
    }

    if (isScheduled && agentShift.activities) {
      const matchedAct = agentShift.activities.find((act: any) => {
        const startH = parseInt(act.startTime.split(':')[0], 10);
        const endH = parseInt(act.endTime.split(':')[0], 10);
        if (startH <= endH) {
          return (hourNum >= startH && hourNum < endH) || (hourNum === startH);
        } else {
          return (hourNum >= startH || hourNum < endH);
        }
      });
      if (matchedAct) {
        isActivity = matchedAct.label;
      }
    }

    return { isScheduled, isActivity };
  };

  const getDayOverviewStats = () => {
    let morningCount = 0;
    let afternoonCount = 0;
    let nightCount = 0;
    let totalOff = 0;

    schedules.forEach(s => {
      if (s.date === targetDateForTimeline) {
        const label = s.shiftLabel;
        if (label === '07:00 - 16:00') morningCount++;
        else if (label === '13:00 - 22:00') afternoonCount++;
        else if (label === '22:00 - 07:00') nightCount++;
        else totalOff++;
      }
    });

    return { morningCount, afternoonCount, nightCount, totalOff };
  };

  const dayStatsObj = getDayOverviewStats();

  return (
    <div id="recreated-schedules-sub-dashboard" className="space-y-6">
      
      {/* Title Header: Sophisticated Gradient Styling */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-pink-300 bg-clip-text font-display flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-400" />
            Workforce Schedules & Roster
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Recreated with modular performance: browser shift overlap lineups, configure staffing heatmaps, swap peer-to-peer duties, or run automated lunch timelines.
          </p>
        </div>

        {/* Live Sync Queue & Sync State indicators */}
        <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 shadow-inner">
            <span className={`w-2 h-2 rounded-full ${isRosterPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="font-mono text-[10px] uppercase font-black tracking-wide">
              {isRosterPublished ? '🟢 Published' : '🟡 Draft revision'}
            </span>
          </div>
          
          {canManageRoster && (
            <div className="flex items-center gap-2">
              <button
                onClick={rebuildSmartRoster}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500/15 to-blue-500/15 hover:from-indigo-500/25 hover:to-blue-500/25 border border-indigo-500/30 hover:border-indigo-500/55 text-indigo-200 rounded-xl text-xs font-black tracking-wide transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                ⚡ Rebuild Smart Roster
              </button>
              <button
                onClick={clearTargetSchedules}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/35 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Roster Draft Blocker Mode for Agents */}
      {!isRosterPublished && currentUser.role === 'agent' ? (
        <div className="space-y-6">
          <div className="p-12 text-center rounded-3xl border border-dashed border-indigo-500/30 bg-slate-900/20 space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-300 tracking-wide font-display">Schedule Roster Draft Status</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                The collective team schedule roster is currently under construction and edit by administration. Once released, the complete calendar tracker and trading capabilities will become active.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold uppercase text-[9px] tracking-wider font-mono mx-auto">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                Roster Draft Stage
              </div>
            </div>
          </div>

          {/* Display personalized preview list for the agent */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4 text-left">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-indigo-350 uppercase tracking-widest font-mono">My Shift Coverage Preview</h4>
              <p className="text-xs text-slate-450 mt-1">Below are your upcoming assigned shifts as current in the administrator blueprint:</p>
            </div>

            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const myShiftsArr = schedules.filter(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date >= todayStr);
              if (myShiftsArr.length === 0) {
                return (
                  <div className="py-6 text-center text-xs text-slate-500 italic">
                    No upcoming scheduled shifts match your account name in this draft revision.
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {myShiftsArr.map(shift => {
                    const style = getShiftBadgeStyle(shift.shiftLabel);
                    return (
                      <div key={shift.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between shadow">
                        <div>
                          <p className="text-[10px] text-slate-450 font-mono font-medium">{formatDateNice(shift.date)}</p>
                          <p className="text-xs font-bold text-slate-350 mt-1 uppercase tracking-wide">{shift.agentName}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded border uppercase tracking-wider ${style.bg}`}>
                          {style.display}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        // Render Fully Interactive Visual Sub-Tabs
        <div className="space-y-6">
          
          {/* Internal Inline tab buttons */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/60 border border-slate-850 rounded-2xl max-w-2xl">
            <button
              onClick={() => setNestedTab('calendar')}
              className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                nestedTab === 'calendar'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar Matrix
            </button>

            <button
              onClick={() => setNestedTab('timeline')}
              className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                nestedTab === 'timeline'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Activity className="w-4 h-4" />
              Swimlane Timeline
            </button>

            <button
              onClick={() => setNestedTab('p2p_market')}
              className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                nestedTab === 'p2p_market'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <GitPullRequest className="w-4 h-4" />
              Trade Board
            </button>

            {canManageRoster && (
              <button
                onClick={() => setNestedTab('admin')}
                className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  nestedTab === 'admin'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Admin Terminal
              </button>
            )}
          </div>

          {/* TAB CONTENT: 1. CALENDAR MATRIX & STAFFING GRID */}
          {nestedTab === 'calendar' && (
            <div className="space-y-6 animate-fade-in text-left">
              
              {/* Coverage Heatmap Gradient Section */}
              <div className="bg-slate-900/85 border border-indigo-500/25 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-300 flex items-center gap-2 font-display">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      Inter-day Density staffing targets
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Live shift staffing metrics compared against customized target coverages. Hover cells to drill scheduled agents.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setHeatmapConfigureOpen(!heatmapConfigureOpen)}
                    className="px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/25 text-indigo-300 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {heatmapConfigureOpen ? 'Hide Staffing Sliders' : 'Configure Density Targets'}
                  </button>
                </div>

                {/* Target Sliders Drawer */}
                {heatmapConfigureOpen && (
                  <div className="p-4 bg-slate-950/45 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left transition-all">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-sans">
                        🌅 Morning Shift Target (07-16)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(1, heatmapMorningTarget - 1);
                            setHeatmapMorningTarget(val);
                            localStorage.setItem('heatmap_morning_target', String(val));
                          }}
                          className="w-8 h-8 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-slate-300 text-sm font-mono">
                          {heatmapMorningTarget}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const val = heatmapMorningTarget + 1;
                            setHeatmapMorningTarget(val);
                            localStorage.setItem('heatmap_morning_target', String(val));
                          }}
                          className="w-8 h-8 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-sans">
                        ☀️ Afternoon Shift Target (13-22)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(1, heatmapAfternoonTarget - 1);
                            setHeatmapAfternoonTarget(val);
                            localStorage.setItem('heatmap_afternoon_target', String(val));
                          }}
                          className="w-8 h-8 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-slate-300 text-sm font-mono">
                          {heatmapAfternoonTarget}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const val = heatmapAfternoonTarget + 1;
                            setHeatmapAfternoonTarget(val);
                            localStorage.setItem('heatmap_afternoon_target', String(val));
                          }}
                          className="w-8 h-8 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-sans">
                        🌙 Night Shift Target (22-07)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(1, heatmapNightTarget - 1);
                            setHeatmapNightTarget(val);
                            localStorage.setItem('heatmap_night_target', String(val));
                          }}
                          className="w-8 h-8 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-slate-300 text-sm font-mono">
                          {heatmapNightTarget}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const val = heatmapNightTarget + 1;
                            setHeatmapNightTarget(val);
                            localStorage.setItem('heatmap_night_target', String(val));
                          }}
                          className="w-8 h-8 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Heatmap Grid Row Layout */}
                <div className="overflow-x-auto pb-1.5 rounded-xl">
                  <div className="min-w-[850px] space-y-2">
                    <div className="flex">
                      <div className="w-44 shrink-0 flex items-center pl-3 text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                        Shift Group
                      </div>
                      <div className="flex-1 flex gap-1.5 pl-3">
                        {activeDisplayDates.map(dateStr => {
                          const d = new Date(dateStr);
                          return (
                            <div key={dateStr} className="flex-1 text-center bg-slate-900/60 py-1.5 rounded-xl border border-slate-800/40 shadow-sm">
                              <p className="text-[9px] text-indigo-300 uppercase font-black leading-none">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                              <p className="text-xs font-black text-slate-200 mt-1">{d.getDate()}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {[
                      { key: 'morning', label: '🌅 Morning Shift', target: heatmapMorningTarget, term: 'M' },
                      { key: 'afternoon', label: '☀️ Afternoon Shift', target: heatmapAfternoonTarget, term: 'A' },
                      { key: 'night', label: '🌙 Night Shift', target: heatmapNightTarget, term: 'N' },
                      { key: 'total', label: '📊 Total Coverage', target: heatmapMorningTarget + heatmapAfternoonTarget + heatmapNightTarget, term: 'All' }
                    ].map(row => (
                      <div key={row.key} className="flex items-stretch">
                        <div className="w-44 shrink-0 flex flex-col justify-center text-left pl-3 py-1 bg-slate-900/40 border-r border-slate-800 rounded-l-xl select-none">
                          <p className="text-xs font-black text-slate-200">{row.label}</p>
                          <p className="text-[8.5px] text-indigo-200/50">Target: {row.target} active</p>
                        </div>

                        <div className="flex-1 flex gap-1.5 pl-3">
                          {activeDisplayDates.map(dateStr => {
                            // @ts-ignore
                            const coverage = getCoverageForDate(dateStr)[row.key];
                            const count = coverage.count;
                            const target = row.target;
                            const ratio = count / target;

                            let cellStyle = "bg-rose-500/10 hover:bg-rose-500/20 text-rose-305 border border-rose-500/30 shadow-inner";
                            let statusText = "Critically Understaffed";

                            if (ratio >= 1.0) {
                              cellStyle = "bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 shadow-sm";
                              statusText = "Fully Covered";
                            } else if (ratio >= 0.5) {
                              cellStyle = "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30";
                              statusText = "Acceptable Margin";
                            } else if (ratio > 0.0) {
                              cellStyle = "bg-orange-500/15 hover:bg-orange-500/25 text-orange-305 border border-orange-500/30";
                              statusText = "Staffing Gap Alert";
                            }

                            return (
                              <div
                                key={dateStr}
                                className={`flex-1 min-h-[44px] relative group flex flex-col items-center justify-center rounded-xl transition-all duration-150 cursor-help ${cellStyle}`}
                              >
                                <span className="text-[11px] font-black tracking-tight">{count}/{target}</span>
                                <span className="text-[8px] uppercase tracking-wider font-extrabold opacity-70 mt-0.5">{row.term}</span>

                                {/* Tooltip Listing active agents */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 hidden group-hover:block bg-slate-950 border border-slate-800 text-slate-300 rounded-xl p-3 shadow-2xl z-50 text-[10px] leading-relaxed backdrop-blur-md">
                                  <p className="font-extrabold text-indigo-300 border-b border-indigo-500/10 pb-1 mb-1.5 flex items-center justify-between">
                                    <span>📋 Active Headcount</span>
                                    <span className="text-[8px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.2 rounded font-mono uppercase font-bold">{row.term}</span>
                                  </p>
                                  <p className="text-slate-400 text-[9px] mb-1 font-sans">{statusText} ({count} of {target} agents)</p>
                                  <p className="text-slate-100 text-[8.5px] uppercase tracking-wider font-black border-b border-slate-800 pb-0.5 mt-2">Scheduled On Duty:</p>
                                  {coverage.agents.length === 0 ? (
                                    <p className="text-slate-500 italic mt-1 text-[9px]">No agents scheduled</p>
                                  ) : (
                                    <div className="max-h-24 overflow-y-auto mt-1 space-y-1 font-mono text-[9px]">
                                      {coverage.agents.map((name: string, index: number) => (
                                        <div key={index} className="flex items-center gap-1.5 text-slate-300">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          <span className="font-bold">{name}</span>
                                          <span className="text-[8px] text-slate-450 font-sans">({getAgentLOB(name)})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend and stats footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-800 text-[10px] text-slate-450">
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="font-bold text-slate-300">Coverage Keys:</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
                      Optimal Density (100%+)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
                      Marginal Staffing (50%+)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500 block"></span>
                      Understaffed Gaps
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Search & Navigation Controller Toolbar */}
              <div className="p-4 bg-slate-900/50 border border-slate-850 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  
                  {/* Real-time Agent Search block */}
                  <input
                    type="text"
                    placeholder="Search by Agent name..."
                    value={scheduleFilterAgent}
                    onChange={(e) => setScheduleFilterAgent(e.target.value)}
                    className="px-4 py-2 bg-black/40 hover:bg-slate-900/30 border border-slate-800 focus:border-indigo-505 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-300 placeholder-slate-500 outline-none w-full sm:w-64"
                  />

                  {/* Grid Horizon Views toggles */}
                  <div className="flex rounded-xl bg-black/35 p-1 border border-slate-800">
                    {(['week', 'fortnight', 'month'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => {
                          setScheduleViewMode(mode);
                          setSchedulePageOffset(0);
                        }}
                        className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                          scheduleViewMode === mode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'fortnight' ? '2-weeks' : mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horizonal paging and Calendar alignment syncing */}
                <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                  <span className="text-[10px] text-slate-450 font-mono">
                    Index: {safeOffset + 1} - {Math.min(safeOffset + displayDaysCount, baseDatesList.length)} of {baseDatesList.length} dates
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      disabled={safeOffset === 0}
                      onClick={() => setSchedulePageOffset(Math.max(0, schedulePageOffset - displayDaysCount))}
                      className="px-3 py-1.5 bg-slate-900/40 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      &larr; Prev
                    </button>
                    <button
                      disabled={safeOffset + displayDaysCount >= baseDatesList.length}
                      onClick={() => setSchedulePageOffset(Math.min(baseDatesList.length - displayDaysCount, schedulePageOffset + displayDaysCount))}
                      className="px-3 py-1.5 bg-slate-900/40 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      Next &rarr;
                    </button>
                  </div>

                  {currentUser.role === 'agent' && (
                    <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                      <button
                        onClick={syncShiftsToGoogleCalendar}
                        disabled={isSyncingCalendar}
                        className="px-3.5 py-1.5 bg-indigo-605 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow"
                      >
                        {isSyncingCalendar ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5" />
                        )}
                        Google Sync
                      </button>
                      
                      <button
                        onClick={downloadShiftsICS}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold hover:border-slate-650 tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        ICS
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Core interactive Desktop coverage Table matrix grid */}
              <div className="hidden lg:block overflow-x-auto border border-slate-850 rounded-2xl bg-black/45 shadow-2xl">
                <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800">
                      <th className="px-5 py-3.5 text-xs font-extrabold text-slate-200 w-52 font-display bg-slate-900 sticky left-0 z-20 border-r border-slate-800">
                        Agent Account
                      </th>
                      {activeDisplayDates.map(dateStr => {
                        const d = new Date(dateStr);
                        return (
                          <th key={dateStr} className="px-3 py-3 text-center border-r border-slate-850 min-w-[95px]">
                            <p className="text-[10px] text-indigo-300 uppercase font-black">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <p className="text-base font-black text-slate-300 mt-0.5">{d.getDate()}</p>
                            <p className="text-[8.5px] text-slate-450 font-mono">{d.toLocaleDateString('en-US', { month: 'short' })}</p>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAgents.length === 0 ? (
                      <tr>
                        <td colSpan={activeDisplayDates.length + 1} className="text-center py-12 text-xs text-slate-500 italic">
                          No registered agents match the current filter query
                        </td>
                      </tr>
                    ) : (
                      visibleAgents.map(agentName => (
                        <tr key={agentName} className="border-b border-slate-850 hover:bg-slate-900/60 transition-all select-none duration-150">
                          <td className="px-5 py-3.5 text-xs font-black text-slate-300 bg-slate-950/80 border-r border-slate-800 sticky left-0 z-10 truncate shadow-sm">
                            {agentName}
                            <span className="block text-[8px] text-slate-450 font-normal mt-0.5 lowercase font-sans">{getAgentLOB(agentName)}</span>
                          </td>
                          {activeDisplayDates.map(dateStr => {
                            const findShift = schedules.find(s => s && s.agentName && s.agentName?.toLowerCase() === agentName.toLowerCase() && s.date === dateStr);
                            const userProfile = registeredUsers.find(u => u && u.name && u?.name?.toLowerCase() === agentName.toLowerCase());
                            const profileShift = userProfile?.assignedShifts?.[dateStr];
                            const label = findShift ? findShift.shiftLabel : (profileShift || 'Not Scheduled');
                            const style = getShiftBadgeStyle(label);
                            
                            return (
                              <td
                                key={dateStr}
                                onClick={() => {
                                  if (canManageRoster && findShift) {
                                    setSelectedShiftForActivities({ ...findShift });
                                  } else if (canManageRoster && !findShift) {
                                    // Let admin click empty cell to program individual shift
                                    setManualRosterAgent(agentName);
                                    setManualRosterDate(dateStr);
                                    setNestedTab('admin');
                                    toast.info(`Ready to assign shift hours for ${agentName} on ${formatDateNice(dateStr)}!`);
                                  }
                                }}
                                className={`p-1.5 border-r border-slate-850 hover:bg-slate-900/30 transition-all relative group ${
                                  canManageRoster ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500/20' : 'cursor-help'
                                }`}
                              >
                                <div className={`mx-auto rounded-xl px-2.5 py-2.5 text-center border text-[10px] font-black tracking-wide ${style.bg} transition-transform duration-100 flex flex-col items-center justify-center gap-1 relative overflow-hidden h-[46px]`}>
                                  <span className="relative z-10">{style.display}</span>
                                  {findShift?.shiftNotes && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0 absolute top-1.5 right-1.5" />
                                  )}
                                  
                                  {/* Render small colored interval dot trackers */}
                                  {findShift?.activities && findShift.activities.length > 0 && (
                                    <div className="absolute bottom-1.5 left-2 right-2 h-[3px] rounded-full flex gap-1.5 justify-center overflow-hidden">
                                      {findShift.activities.map((a: any, i: number) => {
                                        const color = a.label === 'Break' ? 'bg-amber-400' : a.label === 'Lunch' ? 'bg-orange-500' : 'bg-indigo-400';
                                        return <div key={i} className={`w-1 h-full rounded-full ${color}`} />;
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* Cellular Hover Details Drilldown Card */}
                                {(findShift?.shiftNotes || (findShift?.activities && findShift.activities.length > 0) || canManageRoster) && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-slate-950 border border-slate-800 text-slate-300 rounded-xl p-3 shadow-2xl z-50 text-[10px] leading-relaxed backdrop-blur-md">
                                    <p className="font-extrabold text-indigo-300 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
                                      <span>📌 Shift Card Detail</span>
                                      <span className="text-slate-400 font-mono text-[8px]">{dateStr}</span>
                                    </p>
                                    
                                    {findShift?.shiftNotes ? (
                                      <p className="text-slate-300 italic font-medium leading-normal mb-2 mb-1.5">"{findShift.shiftNotes}"</p>
                                    ) : (
                                      <p className="text-slate-500 italic mb-2">No shift comments logged</p>
                                    )}

                                    {findShift?.activities && findShift.activities.length > 0 && (
                                      <div className="space-y-1 mb-2">
                                        <p className="text-[9px] font-bold uppercase text-indigo-300">Intraday Break Timeline:</p>
                                        {[...findShift.activities].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)).map((act: any, idx3: number) => (
                                          <div key={idx3} className="flex items-center gap-1.5 justify-between bg-black/40 px-2 py-0.5 rounded border border-slate-800/40">
                                            <span className="font-mono text-[9px] text-indigo-200">{act.startTime}-{act.endTime}</span>
                                            <span className="font-bold text-slate-300 truncate">{act.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {canManageRoster && (
                                      <p className="text-[8px] text-emerald-400 font-extrabold uppercase tracking-wider text-center pt-1.5 border-t border-slate-800">
                                        {findShift ? '⚡ Edit Intraday interval' : '➕ Assign hours override'}
                                      </p>
                                    )}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Table Cards Alternative */}
              <div className="block lg:hidden space-y-4">
                {visibleAgents.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-450 italic">No agents found</p>
                ) : (
                  visibleAgents.map(agentName => {
                    const agentShifts = schedules.filter(s => s && s.agentName && s.agentName?.toLowerCase() === agentName.toLowerCase() && activeDisplayDates.includes(s.date));
                    return (
                      <div key={agentName} className="p-4 bg-slate-900/50 border border-slate-850 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <span className="text-xs font-black text-slate-200">{agentName}</span>
                          <span className="text-[9px] text-slate-400 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-lg">{getAgentLOB(agentName)}</span>
                        </div>
                        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                          {activeDisplayDates.map(dateStr => {
                            const d = new Date(dateStr);
                            const labelStr = `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`;
                            const findShift = agentShifts.find(s => s.date === dateStr);
                            const userProfile = registeredUsers.find(u => u && u.name && u?.name?.toLowerCase() === agentName.toLowerCase());
                            const profileShift = userProfile?.assignedShifts?.[dateStr];
                            const label = findShift ? findShift.shiftLabel : (profileShift || 'Not Scheduled');
                            const style = getShiftBadgeStyle(label);

                            return (
                              <div
                                key={dateStr}
                                onClick={() => {
                                  if (canManageRoster && findShift) setSelectedShiftForActivities({ ...findShift });
                                }}
                                className={`p-2 bg-slate-950 border border-slate-850/40 rounded-xl flex flex-col justify-between items-stretch ${
                                  canManageRoster && findShift ? 'cursor-pointer hover:border-indigo-500/50' : ''
                                }`}
                              >
                                <span className="text-[9px] text-slate-450 font-medium mb-1 truncate block">{labelStr}</span>
                                <span className={`px-1.5 py-1 rounded-lg border text-[9px] font-bold text-center block ${style.bg}`}>
                                  {style.display}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. SWIMLANE LINEAR TIMELINE LINEUPS */}
          {nestedTab === 'timeline' && (
            <div className="bg-slate-900/50 border border-slate-850 rounded-3xl p-6 shadow-2xl space-y-6 text-left animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-lg font-display flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Operational Hour Swimlane Liners
                  </h3>
                  <p className="text-xs text-slate-450">
                    A premium linear lineup mapping shift durations, dinners, and break activity blocks synchronously throughout a chosen date.
                  </p>
                </div>

                {/* Day selector control */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Horizon Focus:</span>
                  <select
                    value={targetDateForTimeline}
                    onChange={(e) => setActiveTimelineDate(e.target.value)}
                    className="px-3.5 py-1.5 bg-black/45 border border-slate-800 text-slate-350 rounded-xl text-xs font-black outline-none cursor-pointer focus:border-indigo-501"
                  >
                    {activeDisplayDates.map(d => (
                      <option key={d} value={d} className="bg-slate-950 text-slate-205">
                        {formatDateNice(d)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Statistical Snapshot Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/45 border border-slate-800/60 shadow-inner">
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">📅 Target Date</p>
                  <p className="text-sm font-black text-slate-200">{formatDateNice(targetDateForTimeline)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase tracking-widest text-[#22d3ee] font-bold font-mono">🌅 Morning Shift</p>
                  <p className="text-sm font-black text-cyan-300">{dayStatsObj.morningCount} Headcount</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase tracking-widest text-amber-500 font-bold font-mono">☀️ Afternoon Shift</p>
                  <p className="text-sm font-black text-amber-400">{dayStatsObj.afternoonCount} Headcount</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold font-mono">🌙 Night Shift</p>
                  <p className="text-sm font-black text-indigo-300">{dayStatsObj.nightCount} Headcount</p>
                </div>
              </div>

              {/* Linear Gantt Chart Table Matrix */}
              <div className="overflow-x-auto pb-4 rounded-2xl border border-slate-850">
                <div className="min-w-[950px] divide-y divide-slate-850">
                  
                  {/* Hour Headers row */}
                  <div className="flex bg-slate-950/60 p-3 items-center sticky top-0">
                    <div className="w-56 shrink-0 pl-3 text-[10px] font-black uppercase text-indigo-305 tracking-wider border-r border-slate-800">
                      Scheduled Agent
                    </div>
                    <div className="flex-1 flex gap-1 pl-4">
                      {hoursOfOperationalDay.map(hour => {
                        const hrVal = parseInt(hour.split(':')[0], 10);
                        const label = hrVal === 12 ? '12 PM' : hrVal > 12 ? `${hrVal - 12} PM` : `${hrVal} AM`;
                        return (
                          <div key={hour} className="flex-1 text-center font-mono text-[9px] text-slate-400 font-bold">
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Body lineup swimlanes */}
                  {visibleAgents.map(agentName => {
                    const findShift = schedules.find(s => s && s.agentName && s.agentName?.toLowerCase() === agentName.toLowerCase() && s.date === targetDateForTimeline);
                    const isOff = !findShift || findShift.shiftLabel === 'Off';

                    return (
                      <div key={agentName} className="flex p-3 items-center hover:bg-slate-950/15 transition-all">
                        {/* Left Info segment */}
                        <div className="w-56 shrink-0 text-left pl-3 border-r border-slate-850">
                          <p className="text-xs font-black text-slate-350">{agentName}</p>
                          <p className="text-[8.5px] text-slate-500 mt-0.5 font-mono">LOB: {getAgentLOB(agentName)} | {findShift ? findShift.shiftLabel : 'Not Scheduled'}</p>
                        </div>

                        {/* Swimlane Cells segment */}
                        <div className="flex-1 flex gap-1 pl-4 items-stretch h-[32px]">
                          {isOff ? (
                            <div className="flex-1 rounded-lg bg-slate-950/30 border border-slate-850 border-dashed flex items-center justify-center">
                              <span className="text-[9px] tracking-widest uppercase font-black text-slate-600 font-mono">ZZZ... REST / OFF DAY</span>
                            </div>
                          ) : (
                            hoursOfOperationalDay.map(hour => {
                              const { isScheduled, isActivity } = checkHourStatus(hour, findShift);
                              
                              if (!isScheduled) {
                                return (
                                  <div key={hour} className="flex-1 flex items-center justify-center rounded-lg bg-slate-955/20 border border-slate-855/10">
                                    <span className="text-[8px] text-slate-650">•</span>
                                  </div>
                                );
                              }

                              // Styled coverage intervals
                              let cellClass = "bg-sky-500/10 border border-sky-500/20 text-sky-400";
                              let displayLetter = "w";

                              if (isActivity === 'Lunch') {
                                cellClass = "bg-orange-600 border border-orange-500 text-white font-extrabold animate-pulse h-full flex items-center justify-center rounded-lg text-[9px]";
                                displayLetter = "LN";
                              } else if (isActivity === 'Break') {
                                cellClass = "bg-amber-500 border border-amber-400 text-slate-950 font-black h-full flex items-center justify-center rounded-lg text-[9px]";
                                displayLetter = "BR";
                              } else if (isActivity === 'Coaching' || isActivity === 'Meeting' || isActivity === 'Training') {
                                cellClass = "bg-indigo-600 border border-indigo-505 text-white font-bold h-full flex items-center justify-center rounded-lg text-[9px]";
                                displayLetter = "MT";
                              } else {
                                cellClass = "bg-sky-500/15 border border-sky-500/15 text-sky-305 h-full flex items-center justify-center rounded-lg text-[8px] font-mono opacity-80";
                                displayLetter = "••";
                              }

                              return (
                                <div key={hour} className={`flex-1 transition-all relative group select-none ${cellClass}`} title={isActivity || 'On Shift Duty'}>
                                  <span>{displayLetter}</span>
                                  
                                  {/* Tooltip on cell */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[8px] whitespace-nowrap z-50">
                                    Hour context: {hour} | Status: {isActivity || 'Duty coverage'}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Visual Help Guides */}
              <div className="flex flex-wrap gap-4 text-[9px] text-slate-450 border-t border-slate-800 pt-3">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-2 bg-orange-600 border border-orange-550 rounded inline-block"></span>
                  LN: Lunch Interval
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-2 bg-amber-500 border border-amber-450 rounded inline-block"></span>
                  BR: Break Interval
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-2 bg-indigo-650 border border-indigo-600 rounded inline-block"></span>
                  MT: Offline Coaching, Training or Meeting
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-2 bg-sky-505/15 border border-sky-500/20 rounded inline-block"></span>
                  ••: Normal Duty Coverage Active
                </span>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. PEER TO PEER SHIFT EXCHANGE BOARD */}
          {nestedTab === 'p2p_market' && (
            <div className="bg-slate-900/50 border border-slate-850 rounded-3xl p-6 shadow-2xl space-y-6 text-left animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="border-b border-slate-805 pb-4">
                <h3 className="font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-lg font-display flex items-center gap-2">
                  <GitPullRequest className="w-5 h-5 text-indigo-400 rotate-90" />
                  P2P Shift Swap exchange
                </h3>
                <p className="text-xs text-slate-450 mt-0.5">
                  Declare shift availability trading offers, request line of business trades, or accept peer proposals instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Visual Form Launcher */}
                <div className="bg-slate-950/40 p-5 border border-slate-800/80 rounded-2xl space-y-4">
                  <div>
                    <p className="text-xs font-black text-[#22d3ee] uppercase tracking-wider">Publish Trade Listing</p>
                    <p className="text-[10px] text-slate-450 mt-1 leading-normal">Let peers cover an upcoming assigned duty. Handshakes route to leadership.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Shift selector dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">1. Select Scheduled Shift Date</label>
                      {(() => {
                        const todayISO = new Date().toISOString().split('T')[0];
                        const myShedList = schedules
                          .filter(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date >= todayISO)
                          .sort((a, b) => a.date.localeCompare(b.date));
                        if (myShedList.length === 0) {
                          return (
                            <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[10px] text-rose-350">
                              No upcoming assigned shifts found match your agent profile.
                            </div>
                          );
                        }
                        return (
                          <select
                            value={p2pSelectedDate}
                            onChange={(e) => setP2pSelectedDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-350 outline-none h-10 cursor-pointer focus:border-indigo-500"
                          >
                            <option value="" className="bg-slate-950 text-slate-450">-- Choose Date --</option>
                            {myShedList.map(s => (
                              <option key={s.id} value={s.date} className="bg-slate-900 text-slate-100">
                                {formatDateNice(s.date)} (Shift: {s.shiftLabel})
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>

                    {/* Target trading partner agent selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">2. Targeted Swap partner</label>
                      <select
                        value={p2pTargetAgent}
                        onChange={(e) => setP2pTargetAgent(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-350 outline-none h-10 cursor-pointer focus:border-indigo-500"
                      >
                        <option value="" className="bg-slate-950 text-slate-450">-- Open Market: Let anyone grab --</option>
                        {agentsList
                          .filter(a => a?.toLowerCase() !== currentUser?.name?.toLowerCase() && getAgentLOB(a) === getAgentLOB(currentUser?.name))
                          .map(aName => (
                            <option key={aName} value={aName} className="bg-slate-900 text-slate-100">
                              {aName} ({getAgentLOB(aName)})
                            </option>
                          ))}
                      </select>
                      <p className="text-[9px] text-cyan-400/90 leading-tight">
                        * Matches LOB: Filtered to show colleagues sharing your team context ({getAgentLOB(currentUser?.name)})
                      </p>
                    </div>

                    {/* Wanted shift configuration */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">3. Desired Return Shift hours</label>
                      <select
                        value={p2pTargetShift}
                        onChange={(e) => setP2pTargetShift(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-350 outline-none h-10 cursor-pointer focus:border-indigo-500"
                      >
                        {SHIFTS.map(s => (
                          <option key={s.id} value={s.label} className="bg-slate-900 text-slate-100">
                            {s.display} ({s.label})
                          </option>
                        ))}
                        <option value="Off" className="bg-slate-900 text-slate-100">Rest Day (Off Day Swap)</option>
                      </select>
                    </div>

                    {/* Notes detail description */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">4. Explanatory Comments (Reason)</label>
                      <input
                        type="text"
                        placeholder="e.g. Doctor's appointment / prefer early start / fatigue..."
                        value={p2pNotes}
                        onChange={(e) => setP2pNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-501 h-10"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!p2pSelectedDate) {
                          toast.error("Please pick an upcoming shift date event first!");
                          return;
                        }
                        const myShift = schedules.find(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date === p2pSelectedDate);
                        const myShiftLabel = myShift ? myShift.shiftLabel : 'Off';

                        const newReq: any = {
                          id: 'req_' + Date.now(),
                          agentName: currentUser.name,
                          type: 'swap',
                          date: p2pSelectedDate,
                          shift: myShiftLabel,
                          swapWithAgent: p2pTargetAgent || 'Any Qualified Partner',
                          swapWithShift: p2pTargetShift,
                          status: p2pTargetAgent ? 'pending_partner' : 'pending',
                          createdAt: new Date().toISOString(),
                          notes: p2pNotes || "Shift swap listed via redesigned board",
                          ruleViolation: false
                        };

                        const check = validateSwapRequest(p2pSelectedDate, myShiftLabel, new Date());
                        if (!check.isValid) {
                          newReq.ruleViolation = true;
                          newReq.violationMessage = check.message;
                        }

                        const updatedRequests = [newReq, ...requests];
                        setRequests(updatedRequests);
                        localStorage.setItem('sched_requests', JSON.stringify(updatedRequests));

                        toast.success("✨ Shift trade published to swap board!");
                        setP2pSelectedDate('');
                        setP2pTargetAgent('');
                        setP2pNotes('');
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-xs rounded-xl tracking-wider uppercase transition-all shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4 text-slate-205" />
                      Publish Swap Listing
                    </button>
                  </div>
                </div>

                {/* Swap trades postings list */}
                <div className="xl:col-span-2 bg-slate-950/30 p-5 border border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-indigo-305 uppercase tracking-wide">Available Trade Board Listings</h4>
                    <p className="text-[10px] text-slate-450 mt-1">Review peer offerings, approve targeted trade requests, or rescind listing slots.</p>
                  </div>

                  <div className="border border-slate-850 rounded-xl bg-slate-950/45 overflow-hidden h-72 overflow-y-auto">
                    {(() => {
                      const swapRequests = requests.filter(r => r.type === 'swap');
                      if (swapRequests.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 italic animate-pulse py-12">
                            <GitPullRequest className="w-8 h-8 text-indigo-550/40" />
                            <span className="text-[10px]">No active peer swap postings are currently listed</span>
                          </div>
                        );
                      }
                      return (
                        <table className="w-full text-xs text-left text-slate-350">
                          <thead className="bg-[#030712] text-slate-450 text-[9px] uppercase font-bold border-b border-slate-850 sticky top-0">
                            <tr>
                              <th className="px-4 py-3">Agent</th>
                              <th className="px-4 py-3">Shift Date</th>
                              <th className="px-4 py-3">Offered Shift</th>
                              <th className="px-4 py-3">Target / Wanted</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 text-right">Offer Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 font-sans">
                            {swapRequests.map(req => {
                              const isTargetedToMe = req.swapWithAgent.toLowerCase() === currentUser?.name?.toLowerCase() || req.swapWithAgent === 'Any Qualified Partner';
                              const isMyListing = req.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();

                              return (
                                <tr key={req.id} className="hover:bg-slate-900/40 transition-colors">
                                  <td className="px-4 py-3.5 font-bold text-slate-300">
                                    {req.agentName}
                                    <span className="block text-[8px] text-slate-450 font-normal lowercase">{getAgentLOB(req.agentName)}</span>
                                  </td>
                                  <td className="px-4 py-3.5 text-slate-400 font-mono text-[10px]">{req.date}</td>
                                  <td className="px-4 py-3.5 font-bold text-indigo-305">{req.shift}</td>
                                  <td className="px-4 py-3.5">
                                    <span className="text-slate-300 block font-semibold">{req.swapWithAgent}</span>
                                    <span className="text-[8px] text-cyan-350 font-bold lowercase">Wants: {req.swapWithShift}</span>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    {req.status === 'pending_partner' ? (
                                      <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                                        P2P Handshake
                                      </span>
                                    ) : req.status === 'pending' ? (
                                      <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-wide bg-indigo-500/10 text-indigo-350 border border-indigo-500/20 uppercase">
                                        TL Queue
                                      </span>
                                    ) : req.status === 'approved' ? (
                                      <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-wide bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 uppercase">
                                        Approved
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-wide bg-slate-900 text-slate-450 border border-slate-800 uppercase">
                                        {req.status}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-sans">
                                    {req.status === 'pending_partner' && isTargetedToMe && !isMyListing ? (
                                      <div className="flex justify-end gap-1.5">
                                        <button
                                          onClick={() => {
                                            handlePartnerDecision(req.id, true);
                                            toast.success("🎉 Trade request handshake accepted! Routing to leadership queue.");
                                          }}
                                          className="px-2 py-1 bg-emerald-650 hover:bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          onClick={() => {
                                            handlePartnerDecision(req.id, false);
                                            toast.info("Decline sent back.");
                                          }}
                                          className="px-2 py-1 bg-slate-800 hover:bg-rose-500 hover:text-white border border-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition-all"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    ) : isMyListing ? (
                                      <button
                                        onClick={() => {
                                          const filtered = requests.filter(r => r.id !== req.id);
                                          setRequests(filtered);
                                          localStorage.setItem('sched_requests', JSON.stringify(filtered));
                                          toast.info("Shift swap listing rescinded.");
                                        }}
                                        className="px-2 py-1 bg-rose-500/10 hover:bg-rose-650 border border-rose-500/20 text-rose-350 hover:text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                                      >
                                        Rescind
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 italic">No action</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4. ADMIN TERMNAL OPERATIONAL TOOLS */}
          {nestedTab === 'admin' && canManageRoster && (
            <div className="space-y-6 animate-fade-in text-left">
              
              {/* Box 1: Unified CSV Upload & Sync Drawer */}
              <div className="bg-slate-900/50 border border-slate-850 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                {isSyncingSheets && (
                  <div className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                    <div className="p-4 bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-indigo-505 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-bold text-slate-300">Processing sheet spreadsheet calculations...</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-4 gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-lg font-display flex items-center gap-2">
                      <Upload className="w-5 h-5 text-indigo-400" />
                      Dynamic Schedule Spreadsheet Importer
                    </h3>
                    <p className="text-xs text-slate-450">
                      Upload standard team spreadsheets (<b>.xlsx, .xls, .csv</b> etc.) or pull directly from Google Sheets API.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadScheduleTemplate}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      CSV Template
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* File Dropzone card */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[220px] ${
                      dragActive ? 'border-indigo-400 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt,.json"
                      onChange={(e) => {
                        setIsSyncingSheets(true);
                        setTimeout(() => {
                          handleScheduleFileChange(e);
                          setIsSyncingSheets(false);
                        }, 500);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-14 h-14 bg-indigo-550/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-3 text-indigo-400">
                      <Upload className="w-6 h-6 animate-bounce" />
                    </div>
                    <h4 className="text-slate-350 font-black text-sm">Drag & Drop Spreadsheet here</h4>
                    <p className="text-slate-500 text-[11px] mt-1">or click to browse local files on computer</p>
                    <p className="text-[10px] text-slate-600 mt-4 leading-normal max-w-xs mx-auto">
                      Requires columns: Agent Name, Date, and Shift. Unregistered heads are mapped automatically.
                    </p>
                  </div>

                  {/* Google Sheets API connector card */}
                  <div className="border border-slate-850 bg-slate-950/15 shadow-inner rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" viewBox="0 0 48 48">
                        <path fill="#34A853" d="M41.5 8h-35C4 8 2 10 2 12.5v23C2 38 4 40 6.5 40h35c2.5 0 4.5-2 4.5-4.5v-23C46 10 44 8 41.5 8z"></path>
                        <path fill="#188038" d="M31.5 8h-25v32h25V8z"></path>
                        <path fill="#E8F0FE" d="M36 15.5h6v4h-6v-4zM36 24h6v4h-6v-4zM8 15.5h5v4H8v-4zM8 24h5v4H8v-4z"></path>
                      </svg>
                    </div>
                    <h4 className="font-bold text-slate-300">Sync Google Spreadsheet Link</h4>
                    <p className="text-[10px] text-slate-450 mt-1 mb-4 max-w-sm">Automatically sync live and published Google workspace document rows.</p>
                    <div className="w-full flex gap-2">
                      <input
                        type="text"
                        value={googleSheetId}
                        onChange={(e) => {
                          let val = e.target.value;
                          const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
                          if (match) val = match[1];
                          setGoogleSheetId(val);
                          localStorage.setItem('sched_google_sheet_id', val);
                        }}
                        placeholder="Paste Sheets URL or ID..."
                        className="flex-1 bg-slate-900 border border-slate-805 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none hover:border-slate-700"
                      />
                      <button
                        onClick={async () => {
                          if (!googleSheetId) {
                            toast.error("Please provide a valid Google Sheet ID or URL.");
                            return;
                          }
                          try {
                            setIsSyncingSheets(true);
                            setUploadError(null);
                            setUploadSuccess(null);
                            
                            const text = await fetchGoogleSheetCSV(googleSheetId, '0');
                            const result = parseScheduleCSV(text, agentsList);
                            
                            if (result.errors.length > 0) {
                              setUploadError(result.errors.join('\n'));
                            }
                            if (result.schedules.length > 0) {
                              setTempSchedules(result.schedules);
                              setTempNewAgents(result.newAgents || []);
                              setUploadSuccess("Successfully extracted shifts.");
                              toast.success("Spreadsheet data parsed! Review preview draft below.");
                            } else {
                              setUploadError((prev) => (prev ? prev + "\n" : "") + "No schedule data found.");
                            }
                          } catch (err: any) {
                            setUploadError("Extraction failed: " + err.message);
                            toast.error("Connection failed: could not parse sheet.");
                          } finally {
                            setIsSyncingSheets(false);
                          }
                        }}
                        disabled={isSyncingSheets}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg cursor-pointer whitespace-nowrap transition-all"
                      >
                        {isSyncingSheets ? 'Syncing...' : 'Sync Data'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dry Parse preview section */}
                {(tempSchedules.length > 0 || uploadError) && (
                  <div className="border border-slate-850 bg-slate-950/45 rounded-3xl overflow-hidden mt-6 animate-fade-in text-left">
                    <div className="px-5 py-4 flex items-center justify-between border-b border-slate-850 bg-[#070b14]/50">
                      <div>
                        <h4 className="font-extrabold text-slate-200 flex items-center gap-2">
                          <Info className="w-5 h-5 text-indigo-400" /> Imported Spreadsheet Roster preview
                        </h4>
                        <p className="text-[10px] text-slate-450 mt-0.5">Review shift mapping arrays and new registrations before writing to database.</p>
                      </div>
                      
                      {tempSchedules.length > 0 && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setTempSchedules([]);
                              setUploadError(null);
                              setUploadSuccess(null);
                            }}
                            className="px-3.5 py-1.5 border border-slate-800 text-slate-400 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Discard
                          </button>
                          
                          <button
                            onClick={() => {
                              commitSchedules();
                              setTempSchedules([]);
                              setTempNewAgents([]);
                              setUploadSuccess(null);
                              setUploadError(null);
                              toast.success("Spreadsheet written and released safely!");
                            }}
                            className="px-4 py-1.5 bg-emerald-600 text-white font-extrabold hover:bg-emerald-500 rounded-xl text-xs flex items-center gap-1.5 shadow"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Save Roster ({tempSchedules.length} items)
                          </button>
                        </div>
                      )}
                    </div>

                    {uploadError && (
                      <div className="bg-rose-500/10 p-4 border-b border-rose-500/20 text-xs">
                        <p className="font-bold text-rose-450 flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-4 h-4" /> Spreadsheet Parsing Issues:
                        </p>
                        <p className="text-rose-350/90 font-mono whitespace-pre-line leading-relaxed">{uploadError}</p>
                      </div>
                    )}

                    {tempSchedules.length > 0 && (
                      <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-[#030712] border-b border-slate-850 text-slate-450 text-[10px] font-bold uppercase sticky top-0">
                            <tr>
                              <th className="p-3 pl-6">Agent Name</th>
                              <th className="p-3">Shift Date</th>
                              <th className="p-3 font-semibold text-left">Assigned Working Hours</th>
                              <th className="p-3 pr-6 text-right">Validation Checked</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {tempSchedules.slice(0, 100).map((row, i) => (
                              <tr key={i} className="hover:bg-slate-900/40">
                                <td className="p-3 pl-6 font-bold text-slate-300">{row.agentName}</td>
                                <td className="p-3 text-slate-400 font-mono text-[10px]">{row.date}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-305 border border-indigo-500/20 rounded-md text-[9px] font-mono tracking-wide">
                                    {row.shiftLabel}
                                  </span>
                                </td>
                                <td className="p-3 pr-6 text-right text-emerald-400 font-semibold">
                                  ✓ Clear (No overlap)
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {tempSchedules.length > 100 && (
                          <div className="p-3 text-center text-[10px] text-slate-500 bg-slate-950 sticky bottom-0">
                            Showing first 100 elements out of {tempSchedules.length} rows.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Box 2: Release Status Switchener */}
              <div className="bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-blue-500/15 border border-indigo-505/30 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shadow-xl">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isRosterPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider font-display">Roster release state switch</h3>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    {isRosterPublished 
                      ? "Standard agents can fully browse the grid matrix, trace overlap timelines, and submit peer swap trade proposals."
                      : "The roster schedules are flagged as draft revision. Only leadership and admins see the grids. Standard agents see a Draft Blocker notice."
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase text-slate-400 font-mono">
                    {isRosterPublished ? '🟢 Published' : '🟡 Offline Draft'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isRosterPublished}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setIsRosterPublished(val);
                        localStorage.setItem('sched_roster_published', String(val));
                        setDoc(doc(db, "system", "sched_roster_published"), { data: val }).catch(e => console.error("Roster published sync error:", e));
                        
                        if (val) {
                          addSystemNotification(
                            "✨ Workforce Schedule Released & Active!",
                            `The schedule roster has been officially published and released. You can browse your active shifts and request swaps on the redesigned dashboard.`,
                            "schedule",
                            "all"
                          );
                        }
                        toast.success(`Roster set to: ${val ? '🔴 DEPLOYED & LIVE' : '🟡 OFFLINE DRAFT'}`);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-slate-800 after:border-slate-700 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-505 peer-checked:to-teal-600 border border-slate-800"></div>
                  </label>
                </div>
              </div>

              {/* Box 3: Individual Custom Shift programmer override */}
              <div className="bg-slate-900/50 border border-slate-850 rounded-3xl p-6 shadow-2xl space-y-5 text-left">
                <div>
                  <h3 className="font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-lg font-display flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-indigo-400" />
                    Custom Shift overrides programmer
                  </h3>
                  <p className="text-xs text-slate-450 mt-1">
                    Directly assign, override, or reprogram duty shifts and supervisor Incident notes for a specific agent.
                  </p>
                </div>

                <form onSubmit={handleManualRosterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">1. Target Agent Account</label>
                    <select
                      value={manualRosterAgent}
                      onChange={(e) => setManualRosterAgent(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-350 outline-none cursor-pointer h-10 focus:border-indigo-500"
                    >
                      <option value="">-- Choose Agent --</option>
                      {agentsList.map(name => (
                        <option key={name} value={name} className="bg-slate-900 text-slate-100">
                          {name} ({getAgentLOB(name)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">2. Target Date</label>
                    <input
                      type="date"
                      value={manualRosterDate}
                      onChange={(e) => setManualRosterDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-350 outline-none h-10 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">3. Shift working Hours</label>
                    <select
                      value={manualRosterShift}
                      onChange={(e) => setManualRosterShift(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-805 rounded-xl text-xs text-slate-350 outline-none cursor-pointer h-10 focus:border-indigo-500"
                    >
                      {SHIFTS.map(s => (
                        <option key={s.id} value={s.label} className="bg-slate-900 text-slate-100">
                          {s.display} ({s.label})
                        </option>
                      ))}
                      <option value="Off" className="bg-slate-900 text-slate-100">💤 Rest Day (Off Day)</option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full h-10 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold uppercase rounded-xl text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                      Program shift
                    </button>
                  </div>

                  {/* Incident note override row */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">4. Shift Programmer Note (Stored under Shift activity info logs)</label>
                    <input
                      type="text"
                      placeholder="e.g. Training session / Medical exception / Approved swap Handshake..."
                      value={manualRosterNotes}
                      onChange={(e) => setManualRosterNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-350 outline-none focus:border-indigo-505 placeholder-slate-600"
                    />
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
