import React, { useMemo, useState, useEffect } from "react";
import { doc, setDoc, query, collection, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AttendanceRecord, User, AgentDirectoryRow, INITIAL_AGENTS } from "../types";
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
} from "lucide-react";
import { getAgentLOB, getUsernameFromFullName } from "../utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface AttendanceTrackerProps {
  attendanceRecords: AttendanceRecord[];
  currentUser: User | null;
  agentDirectory?: AgentDirectoryRow[];
  registeredUsers?: User[];
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  attendanceRecords,
  currentUser,
  agentDirectory = [],
  registeredUsers = [],
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [lateTimes, setLateTimes] = useState<Record<string, string>>({});

  // Date range export states
  const [rangeFrom, setRangeFrom] = useState<string>("");
  const [rangeTo, setRangeTo] = useState<string>("");

  // Sync / load late values whenever records or selectedDate changes
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
          const lob = row.data?.["lob"] || row.data?.["LOB"] || getAgentLOB(name) || "General";
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
            const lob = u.lob || getAgentLOB(name) || "General";
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
          list.push({ name: cleanName, lob: getAgentLOB(cleanName) || "General" });
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
    let noShowNoCall = 0; // No Show + No Call
    let off = 0;
    let notMarked = 0;

    processedRoster.forEach((item) => {
      if (item.status === "present") present++;
      else if (item.status === "late") late++;
      else if (item.status === "absent") absent++;
      else if (["annual", "sick", "casual"].includes(item.status)) onLeave++;
      else if (item.status === "nsnc") noShowNoCall++;
      else if (item.status === "off") off++;
      else notMarked++;
    });

    return {
      total: processedRoster.length,
      present,
      late,
      absent,
      onLeave,
      noShowNoCall,
      off,
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
        "Status": item.status === "not_marked" ? "Not Marked" : item.status.toUpperCase(),
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

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-400" />
            Daily Attendance Log
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Purely manual, Team Leader-driven attendance tracker. Entries are stored in local Firestore databases and are independent of user logs.
          </p>
        </div>

        {/* Date Selector Navigation Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-2 rounded-2xl border border-slate-800">
          <button
            onClick={handlePrevDay}
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-slate-100 text-xs font-bold font-mono focus:outline-none border-none py-1 cursor-pointer"
          />

          <button
            onClick={handleNextDay}
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1 text-[10px] uppercase font-black bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/10 rounded-lg transition-all cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Date Range Export Console */}
      <div className="bg-slate-900/25 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Date Range Analytics Export</h3>
          <p className="text-[11px] text-slate-500">Select any window range to pull complete attendance histories into an Excel sheet.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">From</span>
            <input
              type="date"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              className="bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">To</span>
            <input
              type="date"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              className="bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200"
            />
          </div>
          <button
            onClick={handleExportRange}
            className="px-3.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Range Export
          </button>
        </div>
      </div>

      {/* Quick Stats Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="p-4 bg-[#18181c]/50 border border-slate-800 rounded-2xl text-center">
          <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Total Active</p>
          <p className="text-2xl font-black text-slate-200 mt-1">{stats.total}</p>
        </div>
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
          <p className="text-[9px] uppercase font-black text-emerald-500 tracking-wider">Present</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.present}</p>
        </div>
        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
          <p className="text-[9px] uppercase font-black text-amber-500 tracking-wider">Late</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats.late}</p>
        </div>
        <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-center">
          <p className="text-[9px] uppercase font-black text-rose-500 tracking-wider">Absent</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{stats.absent}</p>
        </div>
        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
          <p className="text-[9px] uppercase font-black text-blue-500 tracking-wider">On Leave</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{stats.onLeave}</p>
        </div>
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-center">
          <p className="text-[9px] uppercase font-black text-red-500 tracking-wider">NSNC</p>
          <p className="text-2xl font-black text-red-400 mt-1">{stats.noShowNoCall}</p>
        </div>
        <div className="p-4 bg-gray-500/5 border border-gray-500/10 rounded-2xl text-center">
          <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Off</p>
          <p className="text-2xl font-black text-gray-400 mt-1">{stats.off}</p>
        </div>
        <div className="p-4 bg-slate-800/10 border border-slate-800 rounded-2xl text-center">
          <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Not Marked</p>
          <p className="text-2xl font-black text-slate-400 mt-1">{stats.notMarked}</p>
        </div>
      </div>

      {/* Control Banner & Single Date Export */}
      <div className="flex items-center justify-between bg-[#18181c]/40 border border-slate-800 px-5 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 block" />
          <span className="text-xs text-slate-400">
            Currently displaying records for <strong className="text-slate-200 font-mono">{selectedDate}</strong> sorted with <strong className="text-indigo-400">Not Marked</strong> first.
          </span>
        </div>

        <button
          onClick={handleExportSingleDate}
          disabled={processedRoster.length === 0}
          className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" /> Export Selected Date
        </button>
      </div>

      {/* Roster & Tracking Matrix */}
      <div className="bg-[#18181c]/65 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {processedRoster.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No agents found in global database directory roster fallback lists.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-xs font-black uppercase tracking-wider">
                  <th className="p-4 pl-6">Agent Name</th>
                  <th className="p-4">Department / LOB</th>
                  <th className="p-4 text-center">Current Status Badge</th>
                  <th className="p-4 pl-10 pr-6">Quick Attendance Selector Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {processedRoster.map((item) => {
                  const badgeColor = getStatusBadgeColor(item.status);

                  return (
                    <tr
                      key={item.name}
                      className="hover:bg-slate-800/10 transition-colors"
                    >
                      {/* Name & Mark Details */}
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-200">{item.name}</div>
                        {item.record?.markedBy && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Marked by {item.record.markedBy} at {new Date(item.record.markedAt || "").toLocaleTimeString()}
                          </div>
                        )}
                      </td>

                      {/* LOB */}
                      <td className="p-4">
                        <span className="text-xs bg-slate-800/50 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300 font-medium">
                          {item.lob}
                        </span>
                      </td>

                      {/* Current Status Badge with Late Arrival Options inline */}
                      <td className="p-4">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className={`px-2.5 py-1 text-[10px] uppercase font-black border rounded-full ${badgeColor}`}>
                            {item.status === "not_marked"
                              ? "NOT MARKED"
                              : item.status === "nsnc"
                                ? "NSNC 🚫"
                                : item.status.replace("_", " ")}
                            {item.status === "late" && (item.record?.lateTime || lateTimes[item.name]) ? (
                              <span className="ml-1 text-slate-100 font-bold font-mono">
                                ({item.record?.lateTime || lateTimes[item.name]})
                              </span>
                            ) : null}
                          </span>

                          {/* Inline late arrival entry fields */}
                          {item.status === "late" && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[9px] text-slate-500 uppercase font-extrabold mr-1">Time:</span>
                              <input
                                type="time"
                                value={lateTimes[item.name] || "09:00"}
                                onChange={(e) => handleLateTimeChange(item.name, e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-slate-100 rounded px-1.5 py-0.5 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Buttons controller */}
                      <td className="p-4 pl-10 pr-6">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusSelectorButton
                            label="Present"
                            icon="✅"
                            isActive={item.status === "present"}
                            activeStyle="bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            onClick={() => handleMarkStatus(item.name, "present")}
                          />
                          <StatusSelectorButton
                            label="Late"
                            icon="⏰"
                            isActive={item.status === "late"}
                            activeStyle="bg-amber-500/20 text-amber-300 border-amber-500/40"
                            onClick={() => handleMarkStatus(item.name, "late")}
                          />
                          <StatusSelectorButton
                            label="Casual"
                            icon="🏠"
                            isActive={item.status === "casual"}
                            activeStyle="bg-sky-500/20 text-sky-300 border-sky-500/40"
                            onClick={() => handleMarkStatus(item.name, "casual")}
                          />
                          <StatusSelectorButton
                            label="Annual"
                            icon="🏖️"
                            isActive={item.status === "annual"}
                            activeStyle="bg-blue-500/20 text-blue-300 border-blue-500/40"
                            onClick={() => handleMarkStatus(item.name, "annual")}
                          />
                          <StatusSelectorButton
                            label="Sick"
                            icon="🤒"
                            isActive={item.status === "sick"}
                            activeStyle="bg-purple-500/20 text-purple-300 border-purple-500/40"
                            onClick={() => handleMarkStatus(item.name, "sick")}
                          />
                          <StatusSelectorButton
                            label="Absent"
                            icon="❌"
                            isActive={item.status === "absent"}
                            activeStyle="bg-rose-500/20 text-rose-300 border-rose-500/40"
                            onClick={() => handleMarkStatus(item.name, "absent")}
                          />
                          <StatusSelectorButton
                            label="NSNC"
                            icon="🚫"
                            isActive={item.status === "nsnc"}
                            activeStyle="bg-red-500/25 text-red-00 border-red-500/40"
                            onClick={() => handleMarkStatus(item.name, "nsnc")}
                          />
                          <StatusSelectorButton
                            label="Off"
                            icon="🛌"
                            isActive={item.status === "off"}
                            activeStyle="bg-gray-500/25 text-gray-100 border-gray-500/40"
                            onClick={() => handleMarkStatus(item.name, "off")}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards Layout */}
            <div className="block md:hidden divide-y divide-slate-800">
              {processedRoster.map((item) => {
                const badgeColor = getStatusBadgeColor(item.status);

                return (
                  <div key={item.name} className="p-5 space-y-4 hover:bg-slate-800/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-100">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Department: {item.lob}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border ${badgeColor}`}>
                          {item.status === "not_marked"
                            ? "NOT MARKED"
                            : item.status === "nsnc"
                              ? "NSNC 🚫"
                              : item.status.replace("_", " ")}
                          {item.status === "late" && (item.record?.lateTime || lateTimes[item.name]) ? (
                            <span className="ml-1 font-mono">({item.record?.lateTime || lateTimes[item.name]})</span>
                          ) : null}
                        </span>

                        {item.status === "late" && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Time:</span>
                            <input
                              type="time"
                              value={lateTimes[item.name] || "09:00"}
                              onChange={(e) => handleLateTimeChange(item.name, e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-slate-100 rounded px-1.5 py-0.5 text-xs font-mono font-bold"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <StatusSelectorButton
                        label="Present"
                        icon="✅"
                        isActive={item.status === "present"}
                        activeStyle="bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        onClick={() => handleMarkStatus(item.name, "present")}
                      />
                      <StatusSelectorButton
                        label="Late"
                        icon="⏰"
                        isActive={item.status === "late"}
                        activeStyle="bg-amber-500/20 text-amber-300 border-amber-500/40"
                        onClick={() => handleMarkStatus(item.name, "late")}
                      />
                      <StatusSelectorButton
                        label="Casual"
                        icon="🏠"
                        isActive={item.status === "casual"}
                        activeStyle="bg-sky-500/20 text-sky-300 border-sky-500/40"
                        onClick={() => handleMarkStatus(item.name, "casual")}
                      />
                      <StatusSelectorButton
                        label="Annual"
                        icon="🏖️"
                        isActive={item.status === "annual"}
                        activeStyle="bg-blue-500/20 text-blue-300 border-blue-500/40"
                        onClick={() => handleMarkStatus(item.name, "annual")}
                      />
                      <StatusSelectorButton
                        label="Sick"
                        icon="🤒"
                        isActive={item.status === "sick"}
                        activeStyle="bg-purple-500/20 text-purple-300 border-purple-500/40"
                        onClick={() => handleMarkStatus(item.name, "sick")}
                      />
                      <StatusSelectorButton
                        label="Absent"
                        icon="❌"
                        isActive={item.status === "absent"}
                        activeStyle="bg-rose-500/20 text-rose-300 border-rose-500/40"
                        onClick={() => handleMarkStatus(item.name, "absent")}
                      />
                      <StatusSelectorButton
                        label="NSNC"
                        icon="🚫"
                        isActive={item.status === "nsnc"}
                        activeStyle="bg-red-500/25 text-red-100 border-red-500/40"
                        onClick={() => handleMarkStatus(item.name, "nsnc")}
                      />
                      <StatusSelectorButton
                        label="Off"
                        icon="🛌"
                        isActive={item.status === "off"}
                        activeStyle="bg-gray-500/25 text-gray-100 border-gray-500/40"
                        onClick={() => handleMarkStatus(item.name, "off")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal status configurations
const getStatusBadgeColor = (status: AttendanceRecord["status"]) => {
  switch (status) {
    case "present":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "late":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "absent":
    case "nsnc":
      return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    case "off":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    case "annual":
    case "sick":
    case "casual":
      return "bg-blue-500/15 text-blue-300 border-blue-500/25";
    default:
      return "bg-slate-800 text-slate-400 border-slate-700";
  }
};

const StatusSelectorButton = ({
  label,
  icon,
  isActive,
  activeStyle,
  onClick,
}: {
  label: string;
  icon: string | React.ReactNode;
  isActive: boolean;
  activeStyle: string;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer hover:border-slate-700 ${
        isActive
          ? activeStyle
          : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-900"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
};
