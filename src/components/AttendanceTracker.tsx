import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { doc, setDoc, query, collection, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AttendanceRecord, User, AgentDirectoryRow, INITIAL_AGENTS, ScheduledShift } from "../types";
import {
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  Palmtree,
  Activity,
  XCircle,
  AlertOctagon,
  PhoneOff,
  UserX,
  Search,
  Filter,
  Users,
  Check,
  RefreshCw,
} from "lucide-react";
import { getAgentLOB, getUsernameFromFullName, normalizeAgentLob } from "../utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AttendanceTrackerProps {
  attendanceRecords: AttendanceRecord[];
  currentUser: User | null;
  agentDirectory?: AgentDirectoryRow[];
  registeredUsers?: User[];
  schedules?: { agentName: string; date: string; shiftLabel: string }[];
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  attendanceRecords,
  currentUser,
  agentDirectory = [],
  registeredUsers = [],
  schedules = [],
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [lateTimes, setLateTimes] = useState<Record<string, string>>({});

  // Date range export states
  const [rangeFrom, setRangeFrom] = useState<string>("");
  const [rangeTo, setRangeTo] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLOB, setSelectedLOB] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [attendanceRecords, selectedDate, searchTerm, selectedLOB, currentPage]);

  // Sync / load late values whenever records or selectedDate changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLOB, selectedDate]);

  useEffect(() => {
    const times: Record<string, string> = {};
    attendanceRecords.forEach((r) => {
      if (r.date === selectedDate && r.status === "late" && r.lateTime) {
        times[r.agentName] = r.lateTime;
      }
    });
    setLateTimes(times);
  }, [attendanceRecords, selectedDate]);

  // One-time Firestore migration of stale 'no_show' or 'no_call' statuses to 'nsnc'
  useEffect(() => {
    const runMigration = async () => {
      try {
        const q = query(
          collection(db, "attendance_records"),
          where("status", "in", ["no_show", "no_call"])
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          console.log(`[Migration] Found ${querySnapshot.size} stale records to update.`);
          const promises = querySnapshot.docs.map((docSnap) => {
            return updateDoc(doc(db, "attendance_records", docSnap.id), {
              status: "nsnc",
            });
          });
          await Promise.all(promises);
          toast.success(`Successfully migrated ${querySnapshot.size} old attendance records to NSNC.`);
        }
      } catch (error) {
        console.error("Attendance status migration error:", error);
      }
    };
    runMigration();
  }, []);

  // Build full agent roster list, not schedule-dependent
  const rosterOfAgents = useMemo(() => {
    const list: { name: string; lob: string }[] = [];
    const seen = new Set<string>();

    // 1) From agentDirectory spreadsheet uploads
    if (agentDirectory && agentDirectory.length > 0) {
      agentDirectory.forEach((row) => {
        const name = (row.agentName || "").trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          const lob = normalizeAgentLob(row.data?.["lob"] || row.data?.["LOB"] || getAgentLOB(name) || "Chat", "agent");
          list.push({ name, lob });
        }
      });
    }

    // 2) Fallback to registeredUsers filtered to role === 'agent'
    if (list.length === 0 && registeredUsers && registeredUsers.length > 0) {
      registeredUsers
        .filter((u) => u.role === "agent")
        .forEach((u) => {
          const name = (u.name || "").trim();
          if (name && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            const lob = normalizeAgentLob(u.lob || getAgentLOB(name) || "Chat", "agent");
            list.push({ name, lob });
          }
        });
    }

    // 3) Final fallback to INITIAL_AGENTS list
    if (list.length === 0) {
      INITIAL_AGENTS.forEach((name) => {
        const cleanName = name.trim();
        if (cleanName && !seen.has(cleanName.toLowerCase())) {
          seen.add(cleanName.toLowerCase());
          list.push({ name: cleanName, lob: normalizeAgentLob(getAgentLOB(cleanName) || "Chat", "agent") });
        }
      });
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [agentDirectory, registeredUsers]);

  // Resolve processed list of agents with status + record for sorting
  const processedRoster = useMemo(() => {
    return rosterOfAgents
      .map((agent) => {
        const record = attendanceRecords.find(
          (r) => r.agentName === agent.name && r.date === selectedDate
        );
        const status = record?.status || "not_marked";
        return {
          ...agent,
          record,
          status,
        };
      })
      .sort((a, b) => {
        // "not_marked" comes first
        if (a.status === "not_marked" && b.status !== "not_marked") return -1;
        if (a.status !== "not_marked" && b.status === "not_marked") return 1;
        // Then alphabetical
        return a.name.localeCompare(b.name);
      });
  }, [rosterOfAgents, attendanceRecords, selectedDate]);

  // Aggregate stats
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let onLeave = 0; // Annual + Sick + Casual
    let offCount = 0; // Off Days
    let noShowNoCall = 0; // No Show + No Call
    let notMarked = 0;

    processedRoster.forEach((item) => {
      if (item.status === "present") present++;
      else if (item.status === "late") late++;
      else if (item.status === "absent") absent++;
      else if (["annual", "sick", "casual"].includes(item.status)) onLeave++;
      else if (item.status === "off") offCount++;
      else if (item.status === "nsnc") noShowNoCall++;
      else notMarked++;
    });

    return {
      total: processedRoster.length,
      present,
      late,
      absent,
      onLeave,
      offCount,
      noShowNoCall,
      notMarked,
    };
  }, [processedRoster]);

  // Navigate dates
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleJumpToToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  // Mark status function
  const handleMarkStatus = async (
    agentName: string,
    status: AttendanceRecord["status"]
  ) => {
    if (!currentUser) {
      toast.error("Please login to perform this action");
      return;
    }
    const recordId = `${getUsernameFromFullName(agentName)}_${selectedDate}`;
    const defaultLateTime = status === "late" ? (lateTimes[agentName] || "09:00") : null;

    try {
      await setDoc(
        doc(db, "attendance_records", recordId),
        {
          id: recordId,
          agentName,
          date: selectedDate,
          status,
          lateTime: defaultLateTime,
          markedBy: currentUser.name || "Unknown TL",
          markedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      if (status === "late") {
        setLateTimes((prev) => ({ ...prev, [agentName]: defaultLateTime || "09:00" }));
      }
      toast.success(`Marked ${agentName} as ${status}`);
    } catch (e) {
      console.error("Failed to mark status", e);
      toast.error("Database sync error occurred");
    }
  };

  const handleLateTimeChange = async (agentName: string, timeVal: string) => {
    setLateTimes((prev) => ({ ...prev, [agentName]: timeVal }));
    if (!currentUser) return;

    const recordId = `${getUsernameFromFullName(agentName)}_${selectedDate}`;
    try {
      await setDoc(
        doc(db, "attendance_records", recordId),
        {
          id: recordId,
          agentName,
          date: selectedDate,
          status: "late",
          lateTime: timeVal,
          markedBy: currentUser.name || "Unknown TL",
          markedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Failed to update late time", e);
    }
  };

  // Export helper
  const exportToExcel = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, filename);
  };

  // Export single date
  const handleExportSingleDate = () => {
    if (processedRoster.length === 0) {
      toast.error("No data to export");
      return;
    }
    const rows = processedRoster.map((item) => {
      const rec = item.record;
      return {
        "Agent Name": item.name,
        "LOB": item.lob,
        "Date": selectedDate,
        "Status": (() => { const s = getEffectiveStatus(item); return s === "not_marked" ? "Not Marked" : s.toUpperCase(); })(),
        "Late Time": rec?.lateTime || "",
        "Marked By": rec?.markedBy || "",
        "Marked At": rec?.markedAt ? new Date(rec.markedAt).toLocaleString() : "",
      };
    });

    exportToExcel(rows, `attendance-${selectedDate}.xlsx`);
    toast.success(`Exported ${rows.length} attendance record(s) for ${selectedDate}.`);
  };

  // Export date range
  const handleExportRange = () => {
    if (!rangeFrom || !rangeTo) {
      toast.error("Please specify both From and To dates for the range export");
      return;
    }
    if (rangeFrom > rangeTo) {
      toast.error("The start date cannot be after the end date");
      return;
    }

    const filteredRecords = attendanceRecords.filter(
      (r) => r.date >= rangeFrom && r.date <= rangeTo
    );

    if (filteredRecords.length === 0) {
      toast.error("No attendance records found in the specified range.");
      return;
    }

    const rows = filteredRecords.map((rec) => {
      const lob = getAgentLOB(rec.agentName);
      return {
        "Agent Name": rec.agentName,
        "LOB": lob,
        "Date": rec.date,
        "Status": rec.status.toUpperCase(),
        "Late Time": rec.lateTime || "",
        "Marked By": rec.markedBy || "",
        "Marked At": rec.markedAt ? new Date(rec.markedAt).toLocaleString() : "",
      };
    });

    // Sort by Date, then Agent Name
    rows.sort((a, b) => {
      if (a.Date !== b.Date) return a.Date.localeCompare(b.Date);
      return a["Agent Name"].localeCompare(b["Agent Name"]);
    });

    exportToExcel(rows, `attendance-${rangeFrom}-to-${rangeTo}.xlsx`);
    toast.success(`Exported ${rows.length} range records to attendance-${rangeFrom}-to-${rangeTo}.xlsx`);
  };

  // Helper selectors
  const availableLOBs = useMemo(() => {
    const lobs = new Set<string>();
    rosterOfAgents.forEach((a) => {
      if (a.lob) lobs.add(a.lob);
    });
    return ["ALL", ...Array.from(lobs).sort()];
  }, [rosterOfAgents]);

  const lobCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rosterOfAgents.forEach((a) => {
      counts[a.lob] = (counts[a.lob] || 0) + 1;
    });
    return counts;
  }, [rosterOfAgents]);

  const markingProgress = useMemo(() => {
    const total = stats.total;
    const marked = total - stats.notMarked;
    const percent = total > 0 ? Math.round((marked / total) * 100) : 0;
    return { total, marked, percent };
  }, [stats]);

  const filteredRoster = useMemo(() => {
    return processedRoster.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lob.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status.replace("_", " ").toLowerCase().includes(searchTerm.toLowerCase());
      const matchLOB = selectedLOB === "ALL" || item.lob === selectedLOB;
      return matchSearch && matchLOB;
    });
  }, [processedRoster, searchTerm, selectedLOB]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRoster.length / itemsPerPage));
  }, [filteredRoster.length, itemsPerPage]);

  const paginatedRoster = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRoster.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRoster, currentPage, itemsPerPage]);

  const getAgentShiftLabel = (agentName: string): string | null => {
    const sched = schedules.find(
      (s) =>
        s.date === selectedDate &&
        s.agentName?.toLowerCase() === agentName.toLowerCase()
    );
    if (!sched?.shiftLabel) return null;
    const shiftMap: Record<string, string> = {
      "07:00 - 16:00": "Morning  07:00–16:00",
      "13:00 - 22:00": "Midday  13:00–22:00",
      "22:00 - 07:00": "Night  22:00–07:00",
    };
    return shiftMap[sched.shiftLabel] || sched.shiftLabel;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name[0] || "A").toUpperCase();
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const isViewingToday = selectedDate === todayStr;

  // For today's view: treat "not_marked" as "absent" visually and in exports
  const getEffectiveStatus = (item: { status: string; name: string }): AttendanceRecord["status"] => {
    if (isViewingToday && item.status === "not_marked") return "absent";
    return item.status as AttendanceRecord["status"];
  };

  const getLOBGradient = (lob: string) => {
    const clean = (lob || "").toLowerCase();
    if (clean.includes("chat")) return "from-indigo-500 to-blue-600 ";
    if (clean.includes("voice")) return "from-sky-400 to-blue-500 ";
    if (clean.includes("care")) return "from-emerald-400 to-teal-500 ";
    if (clean.includes("operation")) return "from-orange-400 to-red-500 ";
    return "from-slate-500 to-slate-700 ";
  };

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans">
      {/* Salesforce style Top Command Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/[0.03] border border-white/8 p-6 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-transparent rounded-xl text-indigo-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Daily Attendance Log
                <span className="text-[11px] font-semibold bg-transparent border border-white/12 text-white border border-transparent text-indigo-400 px-2 py-0.5 rounded-lg">
                  CRM Live Workspace
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                LOB compliance ledger. Realtime manually-controlled logs stored in secure cloud databases.
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector Navigation Panel */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/40 p-2 rounded-xl border border-white/8">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-white/5 active:bg-white/10 text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center gap-1.5 px-3 bg-white/5 border border-white/8 rounded-xl h-9">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-100 text-[11px] font-bold font-sans focus:outline-none border-none cursor-pointer w-28 text-center"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-white/5 active:bg-white/10 text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleJumpToToday}
            className="h-9 px-3.5 text-[11px] font-bold bg-transparent border border-white/12 text-white hover:bg-white/5 text-indigo-300 border border-transparent rounded-xl transition-all cursor-pointer ml-1 active:scale-95"
          >
            Go Today
          </button>
        </div>
      </div>

      {/* Date Range Export Console */}
      <div className="bg-transparent border border-white/8 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
            Roster Ledger Excel Exporter
          </h4>
          <p className="text-[11px] text-slate-400">Select an analytics window to compile complete historical CSV/Excel sheets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase font-bold text-slate-500">From</span>
            <input
              type="date"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              className="bg-slate-950/60 border border-white/8 rounded-xl px-3 py-1.5 text-[11px] font-sans text-slate-200 focus:border-transparent focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase font-bold text-slate-500">To</span>
            <input
              type="date"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              className="bg-slate-950/60 border border-white/8 rounded-xl px-3 py-1.5 text-[11px] font-sans text-slate-200 focus:border-transparent focus:outline-none"
            />
          </div>
          <button
            onClick={handleExportRange}
            className="h-9 px-4 bg-transparent border border-white/12 text-white hover:bg-white/5 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-indigo-500/10"
          >
            <Download className="w-3.5 h-3.5" /> Range Export
          </button>
        </div>
      </div>

      {/* Main Stats Ribbon & Interactive Ratio Pie Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Metric Cards Ribbon */}
        <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="p-4 bg-white/[0.02] border border-white/8 rounded-xl text-center flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-slate-500" />
            <p className="text-[11px] uppercase font-bold text-slate-500 tracking-widest">Global Roster</p>
            <div className="h-9 flex items-center justify-center mt-1 relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={stats.total}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="text-xl font-bold text-slate-100 block"
                >
                  {stats.total}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Agents Total</span>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-center flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-emerald-500" />
            <p className="text-[11px] uppercase font-bold text-emerald-400 tracking-widest">Present</p>
            <div className="h-9 flex items-center justify-center mt-1 relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={stats.present}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="text-xl font-bold text-emerald-400 block"
                >
                  {stats.present}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[11px] text-emerald-500/80 mt-0.5">On Duty</span>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/15 rounded-xl text-center flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-amber-500" />
            <p className="text-[11px] uppercase font-bold text-amber-400 tracking-widest">Late</p>
            <div className="h-9 flex items-center justify-center mt-1 relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={stats.late}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="text-xl font-bold text-amber-400 block"
                >
                  {stats.late}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[11px] text-amber-500/80 mt-0.5">Delayed</span>
          </div>

          <div className="p-4 bg-rose-500/10 border border-rose-500/15 rounded-xl text-center flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-rose-500" />
            <p className="text-[11px] uppercase font-bold text-rose-400 tracking-widest">Absent</p>
            <div className="h-9 flex items-center justify-center mt-1 relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={stats.absent}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="text-xl font-bold text-rose-400 block"
                >
                  {stats.absent}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[11px] text-rose-500/80 mt-0.5">Off Duty</span>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/15 rounded-xl text-center flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500" />
            <p className="text-[11px] uppercase font-bold text-blue-400 tracking-widest">On Leave</p>
            <div className="h-9 flex items-center justify-center mt-1 relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={stats.onLeave}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="text-xl font-bold text-blue-400 block"
                >
                  {stats.onLeave}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[11px] text-blue-500/80 mt-0.5">Approved Out</span>
          </div>

          <div className="p-4 bg-slate-500/10 border border-transparent rounded-xl text-center flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-slate-500" />
            <p className="text-[11px] uppercase font-bold text-slate-300 tracking-widest">OFF</p>
            <div className="h-9 flex items-center justify-center mt-1 relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={stats.offCount}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="text-xl font-bold text-slate-300 block"
                >
                  {stats.offCount}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">Weekly Rest</span>
          </div>

          <div className="p-4 bg-red-500/10 border border-transparent rounded-xl text-center flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500" />
            <p className="text-[11px] uppercase font-bold text-red-500 tracking-widest">NSNC</p>
            <div className="h-9 flex items-center justify-center mt-1 relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={stats.noShowNoCall}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="text-xl font-bold text-red-500 block"
                >
                  {stats.noShowNoCall}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[11px] text-red-500/80 mt-0.5">No Show</span>
          </div>

          <div className="p-4 bg-slate-800/20 border border-white/8 rounded-xl text-center flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-slate-700" />
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest">Unmarked</p>
            <div className="h-9 flex items-center justify-center mt-1 relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={stats.notMarked}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="text-xl font-bold text-slate-400 block"
                >
                  {stats.notMarked}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Pending TL</span>
          </div>
        </div>

        {/* Bounded Pie Chart container to prevent Recharts -1 dimensions warnings */}
        <div className="bg-white/[0.02] border border-white/8 p-5 rounded-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-bold uppercase text-slate-300 tracking-wider">Attendance Breakdown</h4>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Wrapper has a fixed pixel height dimension and relative parent. ResponsiveContainer works flawlessly. */}
          <div className="relative h-[150px] w-full mt-auto mb-auto flex items-center justify-center">
            <ResponsiveContainer width="99%" height={150}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Present", value: stats.present, color: "#10b981" },
                    { name: "Late", value: stats.late, color: "#f59e0b" },
                    { name: "Absent", value: stats.absent, color: "#f43f5e" },
                    { name: "On Leave", value: stats.onLeave, color: "#3b82f6" },
                    { name: "OFF", value: stats.offCount, color: "#94a3b8" },
                    { name: "NSNC", value: stats.noShowNoCall, color: "#ef4444" },
                    { name: "Not Marked", value: stats.notMarked, color: "#64748b" }
                  ].filter(d => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={55}
                  paddingAngle={4}
                >
                  {[
                    { name: "Present", value: stats.present, color: "#10b981" },
                    { name: "Late", value: stats.late, color: "#f59e0b" },
                    { name: "Absent", value: stats.absent, color: "#f43f5e" },
                    { name: "On Leave", value: stats.onLeave, color: "#3b82f6" },
                    { name: "NSNC", value: stats.noShowNoCall, color: "#ef4444" },
                    { name: "Not Marked", value: stats.notMarked, color: "#64748b" }
                  ].filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Roster Marking Path Tracker (Salesforce visual style) */}
      <div className="bg-transparent border border-white/8 p-5 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${markingProgress.percent === 100 ? "bg-emerald-500" : "bg-indigo-500 animate-pulse"}`} />
            <h4 className="text-[11px] font-bold uppercase text-slate-300 tracking-wider">
              Marking Progress Level
            </h4>
          </div>
          <span className="text-[11px] font-bold font-sans text-indigo-400 bg-transparent border border-white/12 text-white border border-transparent px-2.5 py-1 rounded-xl">
            {markingProgress.percent}% Complete ({markingProgress.marked}/{markingProgress.total} Roster Assigned)
          </span>
        </div>
        <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-white/8 p-[2px]">
          <div
            style={{ width: `${markingProgress.percent}%` }}
            className={`h-full rounded-full bg-gradient-to-r ${markingProgress.percent === 100 ? "from-emerald-500 to-green-400" : "from-indigo-500 via-purple-500 to-pink-500"} transition-all duration-500`}
          />
        </div>
      </div>

      {/* Main Console Split View: Left LOB Sidebar / Right Table Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Salesforce Lightning Left Side Department Filter Navigation */}
        <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 space-y-2 lg:sticky lg:top-4">
          <h3 className="text-[11px] font-bold uppercase text-slate-500 tracking-widest px-3 mb-2.5 flex items-center gap-2">
            <Filter className="w-3 h-3" />
            LOB Departments
          </h3>
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
            {availableLOBs.map((lob) => {
              const isActive = selectedLOB === lob;
              const count = lob === "ALL" ? rosterOfAgents.length : (lobCounts[lob] || 0);

              return (
                <button
                  key={lob}
                  onClick={() => setSelectedLOB(lob)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl w-full text-left font-semibold text-[11px] transition-all border shrink-0 lg:shrink-1 ${ isActive ? "bg-white/10 border-white/15 text-slate-100" : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5" }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full ${ lob === "ALL" ? "bg-slate-400" : lob.toLowerCase().includes("chat") ? "bg-indigo-400" : lob.toLowerCase().includes("voice") ? "bg-sky-400" : "bg-emerald-400" }`} />
                    {lob === "ALL" ? "All Departments" : `${lob} Desk`}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-xl border font-mono ${isActive ? "bg-indigo-500/10 border-transparent text-indigo-300" : "bg-slate-950/40 border-white/8 text-slate-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right CRM Records Table Workspace */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls Belt */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.03] border border-white/8 p-4 rounded-xl">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, LOB or marked status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/8 focus:border-transparent hover:border-white/8 rounded-xl text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none transition-all font-medium"
              />
            </div>

            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              <span className="text-[11px] text-slate-500 font-bold font-sans">
                Showing {filteredRoster.length} of {processedRoster.length} matches
              </span>

              <button
                onClick={handleExportSingleDate}
                disabled={processedRoster.length === 0}
                className="h-9 px-4 bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 rounded-xl text-[11px] font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Export {selectedDate}
              </button>
            </div>
          </div>

          {/* Roster Ledger Cards/Table Container */}
          <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
            {filteredRoster.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <AlertOctagon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-400">No agent records matches active filter</p>
                <p className="text-[11px] text-slate-600">Clear search input or change selected desk filter to view all roster lists.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Left gradient indicator */}
                {canScrollLeft && (
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/40 to-transparent pointer-events-none z-10" />
                )}
                {/* Right gradient indicator */}
                {canScrollRight && (
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/40 to-transparent pointer-events-none z-10" />
                )}

                <div 
                  ref={scrollContainerRef}
                  className="overflow-x-auto custom-scrollbar scrollbar-thin"
                >
                  {/* Desktop High-Density Table */}
                  <table className="w-full table-fixed text-left border-collapse hidden md:table">
                    <colgroup>
                      <col className="w-[38%]" />
                      <col className="w-[16%]" />
                      <col className="w-[24%]" />
                      <col className="w-[22%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-white/8 bg-slate-950/20 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                        <th className="p-2.5 pl-4">Personnel Agent Roster</th>
                        <th className="p-2.5">Desk LOB</th>
                        <th className="p-2.5 text-center">Attendance Status</th>
                        <th className="p-2.5 pr-4 text-right">Quick Ledger Action Panel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedRoster.map((item) => {
                        const effectiveStatus = getEffectiveStatus(item);
                        const badgeColor = getStatusBadgeColor(effectiveStatus);

                        return (
                          <tr
                            key={item.name}
                            className="hover:bg-transparent transition-colors group"
                          >
                            {/* Name & Initials Avatar */}
                            <td className="p-2.5 pl-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getLOBGradient(item.lob)} flex items-center justify-center text-white text-[11px] font-bold tracking-wider -sm shrink-0`}>
                                  {getInitials(item.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-200 text-[11px] truncate max-w-full" title={item.name}>
                                    {item.name}
                                  </div>
                                  {item.record?.markedBy ? (
                                    <div className="text-[11px] text-slate-500 mt-0.5 font-sans truncate max-w-full" title={`Marked by ${item.record.markedBy}`}>
                                      Marked by {item.record.markedBy} at {new Date(item.record.markedAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-indigo-400/60 mt-0.5 tracking-wider uppercase font-bold text-[11px] truncate max-w-full">
                                      Awaiting Decision
                                    </div>
                                  )}
                                  {(() => {
                                    const shift = getAgentShiftLabel(item.name);
                                    if (!shift) return null;
                                    const isNight = shift.includes("Night");
                                    const isMid = shift.includes("Midday");
                                    return (
                                      <div className={`text-[11px] font-bold font-mono mt-0.5 truncate max-w-full ${isNight ? "text-purple-400/80" : isMid ? "text-amber-400/80" : "text-emerald-400/80"}`}>
                                        {shift}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </td>

                            {/* LOB Desk Badge */}
                            <td className="p-2.5">
                              <span className="text-[11px] font-bold bg-slate-950/40 border border-white/8 px-2.5 py-1 rounded-xl text-slate-300 uppercase tracking-wider truncate inline-block max-w-full">
                                {item.lob}
                              </span>
                            </td>

                            {/* Interactive Status Indicator with dynamic fields */}
                            <td className="p-2.5">
                              <div className="flex flex-col items-center justify-center gap-1.5 min-w-0">
                                <span className={`px-2.5 py-1 text-[11px] uppercase font-bold border rounded-lg font-mono truncate max-w-full ${badgeColor}`}>
                                  {effectiveStatus === "not_marked"
                                    ? "NOT MARKED"
                                    : effectiveStatus === "nsnc"
                                      ? "NSNC 🚫"
                                      : effectiveStatus === "absent" && isViewingToday && item.status === "not_marked"
                                        ? "ABSENT (AUTO)"
                                        : effectiveStatus.replace("_", " ")}
                                  {item.status === "late" && (item.record?.lateTime || lateTimes[item.name]) ? (
                                    <span className="ml-1 text-slate-100 font-bold font-sans">
                                      ({item.record?.lateTime || lateTimes[item.name]})
                                    </span>
                                  ) : null}
                                </span>

                                {/* Inline Late Entry Time Dial */}
                                {item.status === "late" && (
                                  <div className="flex items-center gap-1 mt-1 shrink-0">
                                    <span className="text-[11px] text-slate-500 uppercase font-bold mr-1">Time:</span>
                                    <input
                                      type="time"
                                      value={lateTimes[item.name] || "09:00"}
                                      onChange={(e) => handleLateTimeChange(item.name, e.target.value)}
                                      className="bg-slate-950 border border-white/8 text-slate-100 rounded px-1.5 py-0.5 text-[11px] font-sans font-bold focus:outline-none focus:border-transparent"
                                    />
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Actions Controller Buttons */}
                            <td className="p-2.5 pr-4">
                              <div className="flex items-center justify-end gap-0.5">
                                <StatusSelectorButton
                                  label="Present"
                                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                  isActive={item.status === "present"}
                                  activeStyle="bg-emerald-500/10 text-emerald-400 border-transparent"
                                  onClick={() => handleMarkStatus(item.name, "present")}
                                  iconOnly={true}
                                />
                                <StatusSelectorButton
                                  label="Late"
                                  icon={<Clock className="w-3.5 h-3.5" />}
                                  isActive={item.status === "late"}
                                  activeStyle="bg-amber-500/10 text-amber-400 border-transparent"
                                  onClick={() => handleMarkStatus(item.name, "late")}
                                  iconOnly={true}
                                />
                                <StatusSelectorButton
                                  label="Leave"
                                  icon={<Palmtree className="w-3.5 h-3.5" />}
                                  isActive={["annual", "sick", "casual"].includes(item.status)}
                                  activeStyle="bg-blue-500/10 text-blue-300 border-transparent"
                                  onClick={() => handleMarkStatus(item.name, "annual")}
                                  iconOnly={true}
                                />
                                <StatusSelectorButton
                                  label="Absent"
                                  icon={<XCircle className="w-3.5 h-3.5" />}
                                  isActive={item.status === "absent"}
                                  activeStyle="bg-rose-500/10 text-rose-400 border-transparent"
                                  onClick={() => handleMarkStatus(item.name, "absent")}
                                  iconOnly={true}
                                />
                                <StatusSelectorButton
                                  label="OFF"
                                  icon={<Home className="w-3.5 h-3.5" />}
                                  isActive={item.status === "off"}
                                  activeStyle="bg-slate-500/10 text-slate-300 border-transparent"
                                  onClick={() => handleMarkStatus(item.name, "off")}
                                  iconOnly={true}
                                />
                                <StatusSelectorButton
                                  label="NSNC"
                                  icon={<AlertOctagon className="w-3.5 h-3.5" />}
                                  isActive={item.status === "nsnc"}
                                  activeStyle="bg-red-500/10 text-red-400 border-transparent animate-pulse"
                                  onClick={() => handleMarkStatus(item.name, "nsnc")}
                                  iconOnly={true}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Mobile Responsive Cards View */}
                  <div className="block md:hidden divide-y divide-white/5">
                    {paginatedRoster.map((item) => {
                      const effectiveStatus = getEffectiveStatus(item);
                      const badgeColor = getStatusBadgeColor(effectiveStatus);

                      return (
                        <div key={item.name} className="p-5 space-y-4 hover:bg-slate-800/10 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getLOBGradient(item.lob)} flex items-center justify-center text-white text-[11px] font-bold`}>
                                {getInitials(item.name)}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-100 text-[11px]">{item.name}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">Section LOB: {item.lob}</p>
                                {(() => {
                                  const shift = getAgentShiftLabel(item.name);
                                  if (!shift) return null;
                                  const isNight = shift.includes("Night");
                                  const isMid = shift.includes("Midday");
                                  return (
                                    <p className={`text-[11px] font-bold font-mono mt-0.5 ${isNight ? "text-purple-400/80" : isMid ? "text-amber-400/80" : "text-emerald-400/80"}`}>
                                      {shift}
                                    </p>
                                  );
                                })()}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-2 py-0.5 rounded-lg text-[11px] uppercase font-bold border ${badgeColor}`}>
                                {effectiveStatus === "not_marked"
                                  ? "NOT MARKED"
                                  : effectiveStatus === "nsnc"
                                    ? "NSNC 🚫"
                                    : effectiveStatus === "absent" && isViewingToday && item.status === "not_marked"
                                      ? "ABSENT (AUTO)"
                                      : effectiveStatus.replace("_", " ")}
                                {item.status === "late" && (item.record?.lateTime || lateTimes[item.name]) ? (
                                  <span className="ml-1 font-mono">({item.record?.lateTime || lateTimes[item.name]})</span>
                                ) : null}
                              </span>

                              {item.status === "late" && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-slate-500 font-bold uppercase">Time:</span>
                                  <input
                                    type="time"
                                    value={lateTimes[item.name] || "09:00"}
                                    onChange={(e) => handleLateTimeChange(item.name, e.target.value)}
                                    className="bg-slate-950 border border-white/8 text-slate-100 rounded px-1.5 py-0.5 text-[11px] font-sans font-bold focus:outline-none focus:border-transparent"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <StatusSelectorButton
                              label="Present"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              isActive={item.status === "present"}
                              activeStyle="bg-emerald-500/10 text-emerald-400 border-transparent"
                              onClick={() => handleMarkStatus(item.name, "present")}
                            />
                            <StatusSelectorButton
                              label="Late"
                              icon={<Clock className="w-3.5 h-3.5" />}
                              isActive={item.status === "late"}
                              activeStyle="bg-amber-500/10 text-amber-400 border-transparent"
                              onClick={() => handleMarkStatus(item.name, "late")}
                            />
                            <StatusSelectorButton
                              label="Leave"
                              icon={<Palmtree className="w-3.5 h-3.5" />}
                              isActive={["annual", "sick", "casual"].includes(item.status)}
                              activeStyle="bg-blue-500/10 text-blue-300 border-transparent"
                              onClick={() => handleMarkStatus(item.name, "annual")}
                            />
                            <StatusSelectorButton
                              label="Absent"
                              icon={<XCircle className="w-3.5 h-3.5" />}
                              isActive={item.status === "absent"}
                              activeStyle="bg-rose-500/10 text-rose-400 border-transparent"
                              onClick={() => handleMarkStatus(item.name, "absent")}
                            />
                            <StatusSelectorButton
                              label="OFF"
                              icon={<Home className="w-3.5 h-3.5" />}
                              isActive={item.status === "off"}
                              activeStyle="bg-slate-500/10 text-slate-300 border-transparent"
                              onClick={() => handleMarkStatus(item.name, "off")}
                            />
                            <StatusSelectorButton
                              label="NSNC"
                              icon={<AlertOctagon className="w-3.5 h-3.5" />}
                              isActive={item.status === "nsnc"}
                              activeStyle="bg-red-500/10 text-red-400 border-transparent animate-pulse"
                              onClick={() => handleMarkStatus(item.name, "nsnc")}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Unified Pagination Controls Bar */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/40 border-t border-white/8 p-4">
                <div className="text-[11px] text-slate-400 font-semibold font-sans">
                  Showing {Math.min(filteredRoster.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredRoster.length, currentPage * itemsPerPage)} of {filteredRoster.length} matches
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 bg-white/[0.03] border border-white/8 hover:border-white/8 text-slate-400 hover:text-slate-200 disabled:opacity-35 rounded-xl text-[11px] font-bold transition-all disabled:cursor-not-allowed select-none"
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3 bg-white/[0.03] border border-white/8 hover:border-white/8 text-slate-400 hover:text-slate-200 disabled:opacity-35 rounded-xl text-[11px] font-bold transition-all disabled:cursor-not-allowed flex items-center gap-1 select-none"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prevVal = arr[idx - 1];
                        const showEllipsis = prevVal && p - prevVal > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span className="text-slate-600 px-1 text-[11px] font-bold">...</span>}
                            <button
                              onClick={() => setCurrentPage(p)}
                              className={`w-8 h-8 rounded-xl text-[11px] font-bold flex items-center justify-center transition-all ${ currentPage === p ? "bg-white/10 border border-white/15 text-white" : "bg-slate-950/30 border border-white/8 text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]" }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 bg-white/[0.03] border border-white/8 hover:border-white/8 text-slate-400 hover:text-slate-200 disabled:opacity-35 rounded-xl text-[11px] font-bold transition-all disabled:cursor-not-allowed flex items-center gap-1 select-none"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 bg-white/[0.03] border border-white/8 hover:border-white/8 text-slate-400 hover:text-slate-200 disabled:opacity-35 rounded-xl text-[11px] font-bold transition-all disabled:cursor-not-allowed select-none"
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal status configurations
const getStatusBadgeColor = (status: AttendanceRecord["status"]) => {
  switch (status) {
    case "present":
      return "bg-emerald-500/10 text-emerald-400 border-transparent";
    case "late":
      return "bg-amber-500/10 text-amber-400 border-transparent";
    case "absent":
      return "bg-rose-500/10 text-rose-400 border-transparent";
    case "nsnc":
      return "bg-red-500/10 text-red-500 border-transparent";
    case "off":
      return "bg-slate-500/10 text-slate-300 border-transparent";
    case "annual":
    case "sick":
    case "casual":
      return "bg-blue-500/10 text-blue-300 border-transparent";
    default:
      return "bg-slate-800 text-slate-400 border-white/8";
  }
};

const StatusSelectorButton = ({
  label,
  icon,
  isActive,
  activeStyle,
  onClick,
  iconOnly,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  activeStyle: string;
  onClick: () => void;
  iconOnly?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`rounded-xl border font-bold transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 shrink-0 select-none ${ iconOnly ? "w-11 h-11 p-1 gap-0.5" : "px-2.5 py-1.5 gap-1 flex-row" } ${ isActive ? activeStyle : "bg-slate-950/40 border-white/8 text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] hover:border-white/8/50" }`}
    >
      <span className="flex items-center justify-center shrink-0">{icon}</span>
      {iconOnly ? (
        <span className="text-[11px] font-bold uppercase tracking-tight leading-none">{label}</span>
      ) : (
        <span className="text-[11px]">{label}</span>
      )}
    </button>
  );
};
