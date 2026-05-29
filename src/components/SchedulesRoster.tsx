import React, { useState } from 'react';
import { Calendar, Trash2, Sliders, Info, Server, RefreshCw } from 'lucide-react';

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
  agentsList,
  currentUser,
  clearTargetSchedules,
  isRosterPublished,
  activeDisplayDates,
  visibleAgents,
  getAgentLOB,
  registeredUsers,
  setSelectedShiftForActivities,
  handleScheduleFileChange,
  getShiftBadgeStyle,
  uploadError,
  uploadSuccess
}) => {
  const canManageRoster = currentUser.role === 'tl' || currentUser.role === 'admin' || currentUser.role === 'director';

  const formatDateNice = (dStr: string) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-pink-300 bg-clip-text flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-400" />
            Schedules & Roster
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Cleanly designed calendar tracking and assignment viewer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isRosterPublished ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className="font-mono text-[10px] uppercase font-black">
              {isRosterPublished ? '🟢 Published' : '🟡 Draft'}
            </span>
          </div>
          
          {canManageRoster && (
            <button
              onClick={clearTargetSchedules}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!isRosterPublished && currentUser.role === 'agent' ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-indigo-500/30 bg-slate-900/20 space-y-4">
          <Info className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-300">Roster in Draft</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            The schedule roster is currently under construction by administration. Please check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Agent View Grid */}
          <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-black/45 shadow-xl">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800">
                  <th className="px-5 py-4 text-xs font-extrabold text-slate-200 w-52 bg-slate-900 border-r border-slate-800">
                    Agent
                  </th>
                  {activeDisplayDates.map((dateStr: string) => {
                    const d = new Date(dateStr);
                    const isValidDate = !isNaN(d.getTime());
                    return (
                      <th key={dateStr} className="px-3 py-3 text-center border-r border-slate-800 min-w-[95px]">
                        <p className="text-[10px] text-indigo-300 uppercase font-black">{isValidDate ? d.toLocaleDateString('en-US', { weekday: 'short' }) : 'Invalid'}</p>
                        <p className="text-base font-black text-slate-300 mt-1">{isValidDate ? d.getDate() : '-'}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleAgents.length === 0 ? (
                  <tr>
                    <td colSpan={activeDisplayDates.length + 1} className="text-center py-8 text-slate-500 text-xs">
                      No agents found.
                    </td>
                  </tr>
                ) : (
                  visibleAgents.map((agentName: string) => (
                    <tr key={agentName} className="border-b border-slate-800 hover:bg-slate-900/40">
                      <td className="px-5 py-3 text-xs font-black text-slate-300 border-r border-slate-800 bg-slate-950/40">
                        {agentName}
                        <span className="block text-[9px] text-slate-500 font-normal mt-1">{getAgentLOB(agentName)}</span>
                      </td>
                      {activeDisplayDates.map((dateStr: string) => {
                        const findShift = schedules.find((s: any) => s && s.agentName && s.agentName.toLowerCase() === agentName.toLowerCase() && s.date === dateStr);
                        const userProfile = registeredUsers.find((u: any) => u && u.name && u.name.toLowerCase() === agentName.toLowerCase());
                        const profileShift = userProfile?.assignedShifts?.[dateStr];
                        const label = findShift ? findShift.shiftLabel : (profileShift || 'Not Scheduled');
                        const style = getShiftBadgeStyle(label);
                        
                        return (
                          <td
                            key={dateStr}
                            onClick={() => {
                              if (canManageRoster && findShift) {
                                setSelectedShiftForActivities({ ...findShift });
                              }
                            }}
                            className={`p-2 border-r border-slate-800 relative group transition-colors cursor-pointer`}
                          >
                            <div className={`mx-auto rounded-lg px-2 py-1.5 flex flex-col items-center justify-center min-h-[46px] border ${style.bg}`}>
                              <span className="text-[10px] font-black uppercase tracking-wider text-center pt-0.5 leading-tight">
                                {style.display}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Admin Upload Section */}
          {canManageRoster && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 mt-8">
              <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" />
                Upload Shift Data
              </h3>
              
              <div className="border border-dashed border-slate-700 bg-black/40 p-6 rounded-xl hover:bg-black/60 transition">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleScheduleFileChange} 
                  className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-3">Attach a CSV file exported from the standard shift roster template to mass-update assignments.</p>
              </div>

              {uploadError && (
                <div className="mt-4 p-4 border border-rose-500/30 bg-rose-500/10 text-rose-300 rounded-lg text-sm">
                  <strong>Error:</strong> {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="mt-4 p-4 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 rounded-lg text-sm">
                  <strong>Success:</strong> {uploadSuccess}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
