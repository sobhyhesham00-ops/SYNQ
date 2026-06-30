import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coffee,
  Utensils,
  Upload,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Users,
  Send,
  X,
  Sparkles,
  BookOpen,
  CalendarDays,
  ListFilter,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { formatDateNice, getLocalISOString } from '../utils';

interface ScheduledShift {
  id: string;
  agentName: string;
  date: string;
  shiftLabel: string;
  breakTime?: string;
  lunchTime?: string;
  [key: string]: any;
}

interface BreakSchedulePanelProps {
  currentUser: any;
  schedules: ScheduledShift[];
  isTLOrAdmin: boolean;
  isSuperAdmin: boolean;
  systemTime: Date;
  addSystemNotification: (
    title: string,
    message: string,
    type: string,
    targetAgent: string,
    stableId?: string,
    entityType?: string,
    entityId?: string
  ) => void;
  onSchedulesUpdated: (updatedShifts: ScheduledShift[]) => void;
}

interface ParsedBreakRow {
  date: string;
  agentName: string;
  breakTime: string;
  lunchTime: string;
  matchedShiftId?: string;
  status: 'matched' | 'no_shift' | 'error';
  error?: string;
}

const TIME_PRESETS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
];

function parseBreakCSV(raw: string, shifts: ScheduledShift[]): ParsedBreakRow[] {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  const results: ParsedBreakRow[] = [];

  for (const line of lines) {
    // Skip header rows
    if (line.toLowerCase().includes('date') && line.toLowerCase().includes('agent')) continue;
    // Support: date, agent, break, lunch — comma or tab separated
    const parts = line.split(/[,\t]/).map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 2) continue;

    const [rawDate, agentName, breakTime = '', lunchTime = ''] = parts;

    // Normalize date to YYYY-MM-DD
    let date = rawDate;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
      const [m, d, y] = rawDate.split('/');
      date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(rawDate)) {
      const [d, m, y] = rawDate.split('-');
      date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      results.push({ date: rawDate, agentName, breakTime, lunchTime, status: 'error', error: 'Invalid date format' });
      continue;
    }

    const matchedShift = shifts.find(
      s => s.date === date && s.agentName?.toLowerCase().trim() === agentName?.toLowerCase().trim()
    );

    if (matchedShift) {
      results.push({ date, agentName, breakTime, lunchTime, matchedShiftId: matchedShift.id, status: 'matched' });
    } else {
      results.push({ date, agentName, breakTime, lunchTime, status: 'no_shift', error: `No shift found for ${agentName} on ${date}` });
    }
  }

  return results;
}

export const BreakSchedulePanel: React.FC<BreakSchedulePanelProps> = ({
  currentUser,
  schedules,
  isTLOrAdmin,
  isSuperAdmin,
  systemTime,
  addSystemNotification,
  onSchedulesUpdated,
}) => {
  const [csvInput, setCsvInput] = useState('');
  const [parsed, setParsed] = useState<ParsedBreakRow[] | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [agentViewDays, setAgentViewDays] = useState(7);
  const [activeUploadTab, setActiveUploadTab] = useState<'paste' | 'manual'>('paste');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Manual single-entry state
  const [manualDate, setManualDate] = useState(getLocalISOString(systemTime));
  const [manualAgent, setManualAgent] = useState('');
  const [manualBreak, setManualBreak] = useState('');
  const [manualLunch, setManualLunch] = useState('');

  const todayStr = getLocalISOString(systemTime);

  // Get distinct agent names from schedules for autocomplete/select
  const activeAgentsList = useMemo(() => {
    const list = new Set<string>();
    schedules.forEach(s => {
      if (s.agentName) list.add(s.agentName);
    });
    return Array.from(list).sort();
  }, [schedules]);

  // ─── Agent view: my upcoming breaks in the next N days ───────────────────
  const myUpcomingBreaks = useMemo(() => {
    if (!currentUser) return [];
    const cutoff = new Date(systemTime);
    cutoff.setDate(cutoff.getDate() + agentViewDays);
    const cutoffStr = getLocalISOString(cutoff);

    return schedules
      .filter(s =>
        s.agentName?.toLowerCase() === currentUser.name?.toLowerCase() &&
        s.date >= todayStr &&
        s.date <= cutoffStr &&
        (s.breakTime || s.lunchTime)
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [schedules, currentUser, todayStr, agentViewDays, systemTime]);

  const todayBreak = myUpcomingBreaks.find(s => s.date === todayStr);

  // ─── TL view: all agents with breaks for a given date ────────────────────
  const uniqueDatesWithBreaks = useMemo(() => {
    const dateSet = new Set<string>();
    schedules
      .filter(s => s.date >= todayStr && (s.breakTime || s.lunchTime))
      .forEach(s => dateSet.add(s.date));
    return Array.from(dateSet).sort();
  }, [schedules, todayStr]);

  const shiftsForDate = (date: string) =>
    schedules.filter(s => s.date === date && (s.breakTime || s.lunchTime));

  // ─── Parse CSV ────────────────────────────────────────────────────────────
  const handleParseCSV = () => {
    if (!csvInput.trim()) { toast.error('Paste your break schedule data first.'); return; }
    const rows = parseBreakCSV(csvInput, schedules);
    setParsed(rows);
    const matched = rows.filter(r => r.status === 'matched').length;
    const errors = rows.filter(r => r.status !== 'matched').length;
    toast.info(`Parsed ${rows.length} rows — ${matched} matched, ${errors} issues.`);
  };

  // ─── Publish parsed CSV ───────────────────────────────────────────────────
  const handlePublishCSV = async () => {
    if (!parsed) return;
    const toUpdate = parsed.filter(r => r.status === 'matched' && r.matchedShiftId);
    if (toUpdate.length === 0) { toast.error('No matched shifts to update.'); return; }

    setIsPublishing(true);
    try {
      const batch = writeBatch(db);
      const updatedShifts = [...schedules];

      toUpdate.forEach(row => {
        const shift = schedules.find(s => s.id === row.matchedShiftId)!;
        const updated = { ...shift, breakTime: row.breakTime || undefined, lunchTime: row.lunchTime || undefined };
        batch.set(doc(db, 'schedules', row.matchedShiftId!), updated, { merge: true });
        
        const idx = updatedShifts.findIndex(s => s.id === row.matchedShiftId);
        if (idx !== -1) {
          updatedShifts[idx] = updated;
        }
      });

      await batch.commit();
      onSchedulesUpdated(updatedShifts);

      // Notify each affected agent individually
      const notifiedAgents = new Set<string>();
      toUpdate.forEach(row => {
        if (!notifiedAgents.has(row.agentName)) {
          addSystemNotification(
            '☕ Break Schedule Updated',
            `Your break/lunch times have been published for ${formatDateNice(row.date)} and upcoming days. Check your Break Schedule in the Schedules tab.`,
            'schedule',
            row.agentName,
            `break_pub_${row.agentName.replace(/\s+/g, '_')}_${row.date}`,
          );
          notifiedAgents.add(row.agentName);
        }
      });

      toast.success(`Published break schedules for ${notifiedAgents.size} agent(s) across ${toUpdate.length} shifts!`);
      setParsed(null);
      setCsvInput('');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to publish break schedules.');
    } finally {
      setIsPublishing(false);
    }
  };

  // ─── Publish single manual entry ─────────────────────────────────────────
  const handleManualPublish = async () => {
    if (!manualAgent || !manualDate) { toast.error('Agent and date are required.'); return; }
    const shift = schedules.find(
      s => s.date === manualDate && s.agentName?.toLowerCase() === manualAgent.toLowerCase()
    );
    if (!shift) {
      toast.error(`No shift found for ${manualAgent} on ${formatDateNice(manualDate)}. Add their shift first.`);
      return;
    }

    setIsPublishing(true);
    try {
      const updated = { ...shift, breakTime: manualBreak || undefined, lunchTime: manualLunch || undefined };
      const { wrappedSetDoc } = await import('../firebase');
      await wrappedSetDoc(doc(db, 'schedules', shift.id), updated, { merge: true });
      const updatedShifts = schedules.map(s => (s.id === shift.id ? updated : s));
      onSchedulesUpdated(updatedShifts);

      addSystemNotification(
        '☕ Break & Lunch Assigned',
        `Your TL set: Break ${manualBreak || 'N/A'}, Lunch ${manualLunch || 'N/A'} for ${formatDateNice(manualDate)}.`,
        'schedule',
        manualAgent,
        `break_manual_${manualAgent.replace(/\s+/g, '_')}_${manualDate}`,
      );

      toast.success(`Break schedule saved for ${manualAgent}!`);
      setManualBreak('');
      setManualLunch('');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save break schedule.');
    } finally {
      setIsPublishing(false);
    }
  };

  // ─── Unique agents for manual dropdown ───────────────────────────────────
  const agentsOnDate = useMemo(() => {
    return schedules
      .filter(s => s.date === manualDate)
      .map(s => s.agentName)
      .filter((n, i, arr) => arr.indexOf(n) === i)
      .sort();
  }, [schedules, manualDate]);

  // ─── Time display helper ─────────────────────────────────────────────────
  const fmtTime = (t?: string) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="space-y-5">
      {/* ── Section header ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-1 border-b border-white/8">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-transparent flex items-center justify-center">
          <Coffee className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100 font-sans tracking-tight">Break Schedule</h3>
          <p className="text-xs text-slate-500">
            {isTLOrAdmin ? 'Publish break & lunch times for your team' : 'Your assigned breaks and lunch times'}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          AGENT VIEW — personal break timeline
      ════════════════════════════════════════════════ */}
      {!isTLOrAdmin && (
        <div className="space-y-4">
          {/* Today's break card */}
          {todayBreak ? (
            <div className="bg-amber-500/5 border border-transparent rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Today's Schedule</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{formatDateNice(todayBreak.date)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-transparent border border-amber-500/15 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Coffee className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Break</span>
                  </div>
                  {todayBreak.breakTime ? (
                    <p className="text-xl font-bold text-slate-100 font-mono">{fmtTime(todayBreak.breakTime)}</p>
                  ) : (
                    <p className="text-sm font-bold text-slate-500 italic">Not set</p>
                  )}
                </div>

                <div className="bg-transparent border border-orange-500/15 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-orange-400">
                    <Utensils className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Lunch</span>
                  </div>
                  {todayBreak.lunchTime ? (
                    <p className="text-xl font-bold text-slate-100 font-mono">{fmtTime(todayBreak.lunchTime)}</p>
                  ) : (
                    <p className="text-sm font-bold text-slate-500 italic">Not set</p>
                  )}
                </div>
              </div>

              {/* Visual timeline for today */}
              {(todayBreak.breakTime || todayBreak.lunchTime) && (
                <div className="pt-2 border-t border-white/8">
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">Timeline</p>
                  <div className="flex items-center gap-0">
                    {/* Shift start */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-xs text-slate-500 font-sans">{todayBreak.shiftLabel?.split('-')[0]?.trim() || 'Start'}</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-white/10" />
                    {todayBreak.breakTime && (
                      <>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="w-3 h-3 rounded-full bg-amber-400 flex items-center justify-center">
                            <Coffee className="w-2 h-2 text-slate-900" />
                          </div>
                          <span className="text-xs text-amber-400 font-mono font-bold">{fmtTime(todayBreak.breakTime)}</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-white/10" />
                      </>
                    )}
                    {todayBreak.lunchTime && (
                      <>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="w-3 h-3 rounded-full bg-orange-400 flex items-center justify-center">
                            <Utensils className="w-2 h-2 text-slate-900" />
                          </div>
                          <span className="text-xs text-orange-400 font-mono font-bold">{fmtTime(todayBreak.lunchTime)}</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-white/10" />
                      </>
                    )}
                    {/* Shift end */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-xs text-slate-500 font-sans">{todayBreak.shiftLabel?.split('-')[1]?.trim() || 'End'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-transparent border border-white/8 rounded-xl p-5 text-center">
              <Coffee className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No break schedule set for today.</p>
              <p className="text-xs text-slate-600 mt-0.5">Your TL will publish your break times here.</p>
            </div>
          )}

          {/* Upcoming breaks */}
          {myUpcomingBreaks.filter(s => s.date !== todayStr).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Upcoming</p>
                <div className="flex gap-1">
                  {[3, 7, 14].map(d => (
                    <button
                      key={d}
                      onClick={() => setAgentViewDays(d)}
                      className={`px-2 py-0.5 rounded-xl text-xs font-bold transition-all ${agentViewDays === d ? 'bg-indigo-500/10 text-indigo-300 border border-transparent' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {myUpcomingBreaks
                .filter(s => s.date !== todayStr)
                .map(shift => (
                  <div key={shift.id} className="flex items-center gap-3 p-3 bg-transparent border border-white/8 rounded-xl hover:border-white/8 transition-all">
                    <div className="text-center shrink-0 w-10">
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        {new Date(shift.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-sm font-bold text-slate-200">
                        {new Date(shift.date + 'T12:00:00').getDate()}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {shift.breakTime && (
                        <span className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded-xl">
                          <Coffee className="w-2.5 h-2.5" /> {fmtTime(shift.breakTime)}
                        </span>
                      )}
                      {shift.lunchTime && (
                        <span className="flex items-center gap-1 text-xs font-sans text-orange-400 bg-orange-500/10 border border-orange-500/15 px-2 py-0.5 rounded-xl">
                          <Utensils className="w-2.5 h-2.5" /> {fmtTime(shift.lunchTime)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 font-sans">{shift.shiftLabel}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          TL / ADMIN VIEW
      ════════════════════════════════════════════════ */}
      {isTLOrAdmin && (
        <div className="space-y-5">
          {/* ── Upload tabs ─────────────────────────────── */}
          <div className="bg-transparent border border-white/8 rounded-xl overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-white/8">
              {[
                { id: 'paste' as const, label: 'Bulk Upload (CSV / Paste)' },
                { id: 'manual' as const, label: 'Single Entry' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveUploadTab(tab.id)}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${ activeUploadTab === tab.id ? 'text-amber-300 border-b-2 border-amber-400 bg-amber-500/5' : 'text-slate-500 hover:text-slate-300' }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* ── PASTE / CSV tab ─────────────────────── */}
              {activeUploadTab === 'paste' && (
                <div className="space-y-3">
                  <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-3 space-y-1 text-left">
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Expected format (CSV or paste from Excel)</p>
                    <p className="text-xs text-slate-400 font-mono">date, agent_name, break_time, lunch_time</p>
                    <p className="text-xs text-slate-500 font-sans">2025-07-01, Sara Ahmed, 10:30, 13:00</p>
                    <p className="text-xs text-slate-500">Date formats accepted: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY</p>
                  </div>

                  <textarea
                    value={csvInput}
                    onChange={e => setCsvInput(e.target.value)}
                    placeholder={`date,agent_name,break_time,lunch_time\n2025-07-01,Sara Ahmed,10:30,13:00\n2025-07-01,Ahmed Ali,11:00,13:30`}
                    rows={6}
                    className="w-full bg-white/[0.02] border border-white/8 rounded-xl p-3 text-xs text-slate-200 font-sans placeholder:text-slate-600 focus:outline-none focus:border-transparent resize-none"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleParseCSV}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/8 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Parse & Preview
                    </button>
                    {csvInput && (
                      <button
                        onClick={() => { setCsvInput(''); setParsed(null); }}
                        className="px-3 py-2 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-xl border border-transparent transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Preview table */}
                  <AnimatePresence>
                    {parsed && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2 pt-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Preview — {parsed.filter(r => r.status === 'matched').length} of {parsed.length} rows matched
                          </p>
                          <button
                            onClick={() => setParsed(null)}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          {parsed.map((row, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs border ${ row.status === 'matched' ? 'bg-emerald-500/5 border-emerald-500/15 text-slate-200' : 'bg-rose-500/5 border-rose-500/15 text-rose-300' }`}
                            >
                              <span className="font-mono shrink-0">{row.date}</span>
                              <span className="font-semibold truncate">{row.agentName}</span>
                              {row.status === 'matched' ? (
                                <div className="flex gap-1.5 ml-auto shrink-0">
                                  {row.breakTime && <span className="text-amber-400">☕ {row.breakTime}</span>}
                                  {row.lunchTime && <span className="text-orange-400">🍽 {row.lunchTime}</span>}
                                </div>
                              ) : (
                                <span className="text-rose-400 text-xs ml-auto">{row.error}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {parsed.filter(r => r.status === 'matched').length > 0 && (
                          <button
                            onClick={handlePublishCSV}
                            disabled={isPublishing}
                            className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/10 border border-transparent text-amber-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {isPublishing ? (
                              <><span className="animate-spin">⟳</span> Publishing...</>
                            ) : (
                              <><Send className="w-3.5 h-3.5" /> Publish & Notify {parsed.filter(r => r.status === 'matched').length} Shifts</>
                            )}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── MANUAL SINGLE ENTRY tab ─────────────── */}
              {activeUploadTab === 'manual' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block">Date</label>
                      <input
                        type="date"
                        value={manualDate}
                        onChange={e => { setManualDate(e.target.value); setManualAgent(''); }}
                        className="w-full bg-white/[0.02] border border-white/8 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block">
                        Agent {manualDate && <span className="text-slate-600">({agentsOnDate.length} scheduled)</span>}
                      </label>
                      <select
                        value={manualAgent}
                        onChange={e => setManualAgent(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/8 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-transparent"
                      >
                        <option value="">-- Select agent --</option>
                        {agentsOnDate.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-amber-500/70 tracking-wider flex items-center gap-1">
                        <Coffee className="w-3 h-3" /> Break Time
                      </label>
                      <select
                        value={manualBreak}
                        onChange={e => setManualBreak(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/8 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-transparent"
                      >
                        <option value="">Not set</option>
                        {TIME_PRESETS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-orange-500/70 tracking-wider flex items-center gap-1">
                        <Utensils className="w-3 h-3" /> Lunch Time
                      </label>
                      <select
                        value={manualLunch}
                        onChange={e => setManualLunch(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/8 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-transparent"
                      >
                        <option value="">Not set</option>
                        {TIME_PRESETS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleManualPublish}
                    disabled={!manualAgent || !manualDate}
                    className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/10 border border-transparent text-amber-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" /> Save & Notify Agent
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Published break schedule summary (TL view) ─────── */}
          {uniqueDatesWithBreaks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Published Break Days
              </p>

              {uniqueDatesWithBreaks.slice(0, 10).map(date => {
                const dayShifts = shiftsForDate(date);
                const isExpanded = expandedDate === date;
                const isToday = date === todayStr;

                return (
                  <div key={date} className={`border rounded-xl overflow-hidden transition-all ${isToday ? 'border-transparent bg-amber-500/5' : 'border-white/8 bg-transparent'}`}>
                    <button
                      onClick={() => setExpandedDate(isExpanded ? null : date)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                        <span className={`text-xs font-bold ${isToday ? 'text-amber-300' : 'text-slate-200'}`}>
                          {formatDateNice(date)}
                          {isToday && <span className="ml-1.5 text-xs text-amber-500/70 font-bold uppercase">Today</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {dayShifts.length}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden border-t border-white/8"
                        >
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {dayShifts.map(shift => (
                              <div key={shift.id} className="flex items-center gap-2 p-2 bg-transparent rounded-xl">
                                <div className="w-6 h-6 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                                  {shift.agentName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-200 truncate">{shift.agentName}</p>
                                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                                    {shift.breakTime && (
                                      <span className="text-xs text-amber-400 font-mono">☕ {fmtTime(shift.breakTime)}</span>
                                    )}
                                    {shift.lunchTime && (
                                      <span className="text-xs text-orange-400 font-mono">🍽 {fmtTime(shift.lunchTime)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {uniqueDatesWithBreaks.length === 0 && (
            <div className="text-center py-6 border border-dashed border-white/8 rounded-xl">
              <Sparkles className="w-5 h-5 text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">No break schedules published yet.</p>
              <p className="text-xs text-slate-600 mt-0.5">Upload a CSV or add entries manually above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
