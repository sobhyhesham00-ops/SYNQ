import React, { useMemo } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AttendanceRecord, ScheduledShift, User } from "../types";
import { CheckCircle2, XCircle, Clock, CalendarDays } from "lucide-react";

interface AttendanceTrackerProps {
  schedules: ScheduledShift[];
  attendanceRecords: AttendanceRecord[];
  currentUser: User | null;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  schedules,
  attendanceRecords,
  currentUser,
}) => {
  const today = new Date().toISOString().slice(0, 10);

  // Filter schedules for today
  const todaySchedules = useMemo(() => {
    return schedules.filter((s) => s.date === today);
  }, [schedules, today]);

  // Aggregate stats
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let onLeave = 0;
    let notMarked = 0;

    todaySchedules.forEach((shift) => {
      const record = attendanceRecords.find(
        (r) => r.agentName === shift.agentName && r.date === today
      );
      if (!record || record.status === "not_marked") {
        notMarked++;
      } else if (record.status === "present") {
        present++;
      } else if (record.status === "absent") {
        absent++;
      } else if (record.status === "late") {
        late++;
      } else if (record.status === "on_leave") {
        onLeave++;
      }
    });

    return { total: todaySchedules.length, present, absent, late, onLeave, notMarked };
  }, [todaySchedules, attendanceRecords, today]);

  const handleMarkStatus = async (
    agentName: string,
    status: AttendanceRecord["status"]
  ) => {
    if (!currentUser) return;
    const recordId = `${agentName}_${today}`;
    const record: AttendanceRecord = {
      id: recordId,
      agentName,
      date: today,
      status,
      markedBy: currentUser.name || "Unknown TL",
      markedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "attendance_records", recordId), record, {
        merge: true,
      });
    } catch (e) {
      console.error("Failed to mark attendance", e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-indigo-400 font-display flex items-center gap-3">
            <CalendarDays className="w-8 h-8" />
            Today's Attendance
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Scheduled" count={stats.total} color="slate" />
        <StatCard title="Present" count={stats.present} color="emerald" />
        <StatCard title="Absent" count={stats.absent} color="rose" />
        <StatCard title="Late" count={stats.late} color="amber" />
        <StatCard title="On Leave / Not Marked" count={stats.onLeave + stats.notMarked} color="indigo" />
      </div>

      {/* Roster */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {todaySchedules.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No agents scheduled for today.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {todaySchedules.map((shift) => {
              const record = attendanceRecords.find(
                (r) => r.agentName === shift.agentName && r.date === today
              );
              const status = record?.status || "not_marked";

              return (
                <div
                  key={shift.id}
                  className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-slate-200">
                      {shift.agentName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                        {shift.shiftLabel} {shift.shiftNotes ? `(${shift.shiftNotes})` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusButton
                      label="Present"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      isActive={status === "present"}
                      onClick={() => handleMarkStatus(shift.agentName, "present")}
                      activeClass="bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                      inactiveClass="bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700"
                    />
                    <StatusButton
                      label="Absent"
                      icon={<XCircle className="w-4 h-4" />}
                      isActive={status === "absent"}
                      onClick={() => handleMarkStatus(shift.agentName, "absent")}
                      activeClass="bg-rose-500/20 text-rose-400 border-rose-500/50"
                      inactiveClass="bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700"
                    />
                    <StatusButton
                      label="Late"
                      icon={<Clock className="w-4 h-4" />}
                      isActive={status === "late"}
                      onClick={() => handleMarkStatus(shift.agentName, "late")}
                      activeClass="bg-amber-500/20 text-amber-400 border-amber-500/50"
                      inactiveClass="bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700"
                    />
                    <StatusButton
                      label="On Leave"
                      icon={<CalendarDays className="w-4 h-4" />}
                      isActive={status === "on_leave"}
                      onClick={() =>
                        handleMarkStatus(shift.agentName, "on_leave")
                      }
                      activeClass="bg-indigo-500/20 text-indigo-400 border-indigo-500/50"
                      inactiveClass="bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  count,
  color,
}: {
  title: string;
  count: number;
  color: "slate" | "emerald" | "rose" | "amber" | "indigo";
}) => {
  const colors = {
    slate: "from-slate-800/50 to-slate-900/50 border-slate-700",
    emerald: "from-emerald-500/10 to-emerald-900/20 border-emerald-500/20",
    rose: "from-rose-500/10 to-rose-900/20 border-rose-500/20",
    amber: "from-amber-500/10 to-amber-900/20 border-amber-500/20",
    indigo: "from-indigo-500/10 to-indigo-900/20 border-indigo-500/20",
  };
  const textColors = {
    slate: "text-slate-300",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
    indigo: "text-indigo-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4 flex flex-col justify-center items-center`}
    >
      <span className="text-sm font-medium text-slate-400 mb-1">{title}</span>
      <span className={`text-3xl font-bold font-display ${textColors[color]}`}>
        {count}
      </span>
    </div>
  );
};

const StatusButton = ({
  label,
  icon,
  isActive,
  onClick,
  activeClass,
  inactiveClass,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  activeClass: string;
  inactiveClass: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
        isActive ? activeClass : inactiveClass
      }`}
    >
      {icon}
      {label}
    </button>
  );
};
