import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Filter,
  Award,
  BookOpen,
  Zap,
  Clock
} from "lucide-react";
import { Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint, ClientCommunicationRequest } from "../types";

interface WeeklyPerformanceHeatmapProps {
  inquiries: Inquiry[];
  tabbyTamaraRequests: TabbyTamaraRequest[];
  tabbyTamaraComplaints: TabbyTamaraComplaint[];
  clientComms: ClientCommunicationRequest[];
}

interface AgentWeekStat {
  agentName: string;
  weeks: {
    week1: { count: number; totalHours: number; avgHours: number | null }; // 22-30 days ago
    week2: { count: number; totalHours: number; avgHours: number | null }; // 15-21 days ago
    week3: { count: number; totalHours: number; avgHours: number | null }; // 8-14 days ago
    week4: { count: number; totalHours: number; avgHours: number | null }; // last 7 days
  };
  overallAvg: number | null;
  overallCount: number;
}

export const WeeklyPerformanceHeatmap: React.FC<WeeklyPerformanceHeatmapProps> = ({
  inquiries = [],
  tabbyTamaraRequests = [],
  tabbyTamaraComplaints = [],
  clientComms = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"count" | "speed" | "name">("count");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCell, setSelectedCell] = useState<{ agent: string; weekName: string; count: number; avg: number | null } | null>(null);

  // Parse and aggregate resolution data
  const agentStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const statsMap: Record<string, AgentWeekStat> = {};

    const initializeAgent = (name: string): AgentWeekStat => ({
      agentName: name,
      weeks: {
        week1: { count: 0, totalHours: 0, avgHours: null },
        week2: { count: 0, totalHours: 0, avgHours: null },
        week3: { count: 0, totalHours: 0, avgHours: null },
        week4: { count: 0, totalHours: 0, avgHours: null },
      },
      overallAvg: null,
      overallCount: 0,
    });

    const getWeekIndex = (createdDateStr: string): "week1" | "week2" | "week3" | "week4" | null => {
      const createdDate = new Date(createdDateStr);
      if (isNaN(createdDate.getTime())) return null;
      if (createdDate < thirtyDaysAgo) return null;

      const diffMs = now.getTime() - createdDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 7) return "week4";
      if (diffDays <= 14) return "week3";
      if (diffDays <= 21) return "week2";
      if (diffDays <= 30) return "week1";
      return null;
    };

    const addResolvedRecord = (agent: string, createdAt: string, resolvedAt: string) => {
      if (!agent || !createdAt || !resolvedAt) return;
      const agentClean = agent.trim();
      if (!agentClean) return;

      const weekKey = getWeekIndex(createdAt);
      if (!weekKey) return;

      const createdTime = new Date(createdAt).getTime();
      const resolvedTime = new Date(resolvedAt).getTime();
      if (isNaN(createdTime) || isNaN(resolvedTime)) return;

      const elapsedMs = resolvedTime - createdTime;
      // Safeguard against invalid dates or timezone skew
      const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));

      if (!statsMap[agentClean]) {
        statsMap[agentClean] = initializeAgent(agentClean);
      }

      const stat = statsMap[agentClean];
      stat.weeks[weekKey].count += 1;
      stat.weeks[weekKey].totalHours += elapsedHours;
    };

    // 1. Inquiries
    inquiries.forEach((inq) => {
      const resolvedAt = inq.answeredAt || inq.closedAt;
      if (resolvedAt && (inq.status === "answered" || inq.status === "closed")) {
        addResolvedRecord(inq.agentName, inq.createdAt, resolvedAt);
      }
    });

    // 2. Tabby Tamara Requests
    tabbyTamaraRequests.forEach((req) => {
      const resolvedAt = req.confirmedAt;
      if (resolvedAt && req.status === "confirmed") {
        addResolvedRecord(req.agentName, req.createdAt, resolvedAt);
      }
    });

    // 3. Tabby Tamara Complaints
    tabbyTamaraComplaints.forEach((comp) => {
      const resolvedAt = comp.tlHandledAt;
      if (resolvedAt && comp.status === "closed") {
        addResolvedRecord(comp.agentName, comp.createdAt, resolvedAt);
      }
    });

    // 4. Client Comms
    clientComms.forEach((comm) => {
      const resolvedAt = comm.handledAt;
      if (resolvedAt && comm.status === "contacted") {
        addResolvedRecord(comm.callCenterAgentName, comm.createdAt, resolvedAt);
      }
    });

    // Finalize averages
    const list = Object.values(statsMap).map((agent) => {
      let grandTotalHours = 0;
      let grandTotalCount = 0;

      (Object.keys(agent.weeks) as Array<keyof typeof agent.weeks>).forEach((wk) => {
        const w = agent.weeks[wk];
        if (w.count > 0) {
          w.avgHours = w.totalHours / w.count;
          grandTotalHours += w.totalHours;
          grandTotalCount += w.count;
        } else {
          w.avgHours = null;
        }
      });

      agent.overallCount = grandTotalCount;
      agent.overallAvg = grandTotalCount > 0 ? grandTotalHours / grandTotalCount : null;

      return agent;
    });

    return list;
  }, [inquiries, tabbyTamaraRequests, tabbyTamaraComplaints, clientComms]);

  // Handle Filtering & Sorting
  const filteredAndSortedStats = useMemo(() => {
    let result = agentStats.filter((a) =>
      a.agentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.agentName.localeCompare(b.agentName);
      } else if (sortBy === "count") {
        comparison = a.overallCount - b.overallCount;
      } else if (sortBy === "speed") {
        const avgA = a.overallAvg !== null ? a.overallAvg : 999999;
        const avgB = b.overallAvg !== null ? b.overallAvg : 999999;
        // Faster is better, so ascending average is higher rank
        comparison = avgB - avgA; 
      }

      return sortOrder === "desc" ? comparison : -comparison;
    });

    return result;
  }, [agentStats, searchTerm, sortBy, sortOrder]);

  const toggleSort = (type: "count" | "speed" | "name") => {
    if (sortBy === type) {
      setSortOrder(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortBy(type);
      setSortOrder("desc");
    }
  };

  // Help calculate styles for cells
  const getCellMeta = (avgHours: number | null) => {
    if (avgHours === null) {
      return {
        bg: "bg-slate-800/40 text-slate-500 hover:bg-slate-800/70 border border-slate-800/50",
        label: "N/A",
        desc: "No resolved cases"
      };
    }
    if (avgHours <= 1.0) {
      return {
        bg: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/35 border border-emerald-500/30 font-bold",
        label: `${avgHours.toFixed(1)}h`,
        desc: "Fast Response (<1h)"
      };
    }
    if (avgHours <= 4.0) {
      return {
        bg: "bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 border border-teal-500/20",
        label: `${avgHours.toFixed(1)}h`,
        desc: "Moderate Response (1h-4h)"
      };
    }
    if (avgHours <= 8.0) {
      return {
        bg: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/25 animate-pulse",
        label: `${avgHours.toFixed(1)}h`,
        desc: "Slow Response (4h-8h)"
      };
    }
    return {
      bg: "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 font-black animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.15)]",
      label: `${avgHours.toFixed(1)}h`,
      desc: "Critical SLA Overdue (>8h)"
    };
  };

  // Find agents who need mentorship
  const mentorshipCandidates = useMemo(() => {
    return agentStats
      .filter((a) => a.overallAvg !== null && a.overallAvg > 6.0 && a.overallCount >= 3)
      .slice(0, 3);
  }, [agentStats]);

  // Find star performers
  const starPerformers = useMemo(() => {
    return agentStats
      .filter((a) => a.overallAvg !== null && a.overallAvg <= 2.0 && a.overallCount >= 5)
      .slice(0, 3);
  }, [agentStats]);

  return (
    <div id="weekly-performance-heatmap" className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] text-left relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-24 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />

      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-black text-white tracking-tight">Weekly Performance Heatmap</h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
            Visualizes average ticket resolution speeds (hours) over the last 30 days grouped weekly. Helps TLs pinpoint stars and coach team members who need mentorship.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-60">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-slate-900/60 transition-all font-sans"
            />
          </div>
          <button
            onClick={() => setSearchTerm("")}
            className="px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 py-2 px-3.5 bg-white/[0.01] border border-white/5 rounded-xl text-xs text-slate-400 mb-6 font-mono">
        <span className="font-bold text-slate-300 mr-1 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" /> Resolution SLA:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
          <span>Fast (&le;1h)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-teal-500/15 border border-teal-500/30 inline-block" />
          <span>Moderate (1h-4h)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-500/15 border border-amber-500/30 inline-block" />
          <span>Slow (4h-8h)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/35 inline-block" />
          <span>Critical (&gt;8h)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-slate-800/40 border border-slate-800/50 inline-block" />
          <span>No Cases</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/40">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 min-w-[150px]">
                <button 
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  Agent Name 
                  {sortBy === "name" && (sortOrder === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </button>
              </th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Wk 1 (Oldest)
              </th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Wk 2
              </th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Wk 3
              </th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Wk 4 (Latest)
              </th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                <button 
                  onClick={() => toggleSort("count")}
                  className="flex items-center gap-1 mx-auto hover:text-white transition-colors"
                >
                  Total Resolved
                  {sortBy === "count" && (sortOrder === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </button>
              </th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                <button 
                  onClick={() => toggleSort("speed")}
                  className="flex items-center gap-1 mx-auto hover:text-white transition-colors"
                >
                  Avg Response
                  {sortBy === "speed" && (sortOrder === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredAndSortedStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs font-mono">
                    No matching agent resolution data found in the last 30 days.
                  </td>
                </tr>
              ) : (
                filteredAndSortedStats.map((agent) => {
                  return (
                    <motion.tr
                      key={agent.agentName}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/5 hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Name */}
                      <td className="p-3 text-xs font-black text-slate-200">
                        {agent.agentName}
                      </td>

                      {/* Weeks Grid */}
                      {(["week1", "week2", "week3", "week4"] as const).map((wkKey) => {
                        const wData = agent.weeks[wkKey];
                        const meta = getCellMeta(wData.avgHours);
                        return (
                          <td key={wkKey} className="p-2 text-center">
                            <button
                              onClick={() => setSelectedCell({
                                agent: agent.agentName,
                                weekName: wkKey === "week1" ? "Week 1 (22-30d ago)" : wkKey === "week2" ? "Week 2 (15-21d ago)" : wkKey === "week3" ? "Week 3 (8-14d ago)" : "Week 4 (Last 7d)",
                                count: wData.count,
                                avg: wData.avgHours
                              })}
                              className={`w-full max-w-[100px] mx-auto py-2.5 rounded-xl flex flex-col justify-center items-center cursor-pointer transition-all ${meta.bg}`}
                            >
                              <span className="text-xs leading-none mb-0.5">{meta.label}</span>
                              <span className="text-xs font-mono opacity-50 font-normal">
                                {wData.count > 0 ? `${wData.count} tkt` : ""}
                              </span>
                            </button>
                          </td>
                        );
                      })}

                      {/* Total Count */}
                      <td className="p-3 text-center text-xs font-bold font-mono text-slate-300">
                        {agent.overallCount}
                      </td>

                      {/* Average speed */}
                      <td className="p-3 text-center text-xs font-black">
                        {agent.overallAvg !== null ? (
                          <span className={agent.overallAvg <= 2.0 ? "text-emerald-400" : agent.overallAvg <= 6.0 ? "text-teal-400" : "text-rose-400"}>
                            {agent.overallAvg.toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-slate-600 font-normal font-mono">N/A</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Selected cell tooltip details block */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-4 p-3.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 flex items-center justify-between gap-4 shadow"
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">●</span>
              <span>
                <strong>{selectedCell.agent}</strong> resolution summary in <strong>{selectedCell.weekName}</strong>:{" "}
                {selectedCell.count > 0 ? (
                  <>
                    Resolved <strong>{selectedCell.count}</strong> tickets with an average resolution speed of{" "}
                    <strong className="text-white">{selectedCell.avg?.toFixed(1)}h</strong>.
                  </>
                ) : (
                  "No tickets were resolved in this week."
                )}
              </span>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-slate-500 hover:text-slate-300 font-black cursor-pointer px-2 py-1 bg-white/5 rounded-xl hover:bg-white/10"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mentorship & Coaching Advice Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Under-performing agents requesting mentorship */}
        <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-black uppercase text-rose-300 tracking-wider">Mentorship Alerts (&gt;6h average)</h4>
            </div>
            {mentorshipCandidates.length > 0 ? (
              <div className="space-y-3">
                {mentorshipCandidates.map((cand) => (
                  <div key={cand.agentName} className="flex items-start justify-between gap-2 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{cand.agentName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Avg speed: <span className="text-rose-400 font-bold">{cand.overallAvg?.toFixed(1)}h</span> ({cand.overallCount} resolved)
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-bold tracking-wider uppercase">
                      Needs coaching
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono italic">
                Awesome! No active agents have resolution times exceeding the 6h threshold in the last 30 days.
              </p>
            )}
          </div>
          {mentorshipCandidates.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-rose-400/80">
              <BookOpen className="w-3.5 h-3.5" />
              <span>SLA coaching recommended. Pair them with star performers to review workflows.</span>
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-black uppercase text-emerald-300 tracking-wider">Top Performers (&le;2h average)</h4>
            </div>
            {starPerformers.length > 0 ? (
              <div className="space-y-3">
                {starPerformers.map((star) => (
                  <div key={star.agentName} className="flex items-start justify-between gap-2 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{star.agentName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Avg speed: <span className="text-emerald-400 font-bold">{star.overallAvg?.toFixed(1)}h</span> ({star.overallCount} resolved)
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-bold tracking-wider uppercase">
                      Fast responder
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono italic">
                Keep driving speed! No agents have averages &le;2.0 hours with &ge;5 tickets yet.
              </p>
            )}
          </div>
          {starPerformers.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-emerald-400/80">
              <Zap className="w-3.5 h-3.5" />
              <span>Recognize star performers during the next huddle to boost team spirit!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
