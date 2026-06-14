import React, { useState } from "react";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Clock, Lock, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface TodoItem {
  id: string;
  agentName: string;
  text: string;
  isCompleted: boolean;
  reminderTimeMs: number | null;
  createdAt: string;
  notified?: boolean;
  category?: 'Work' | 'Personal' | 'Urgent';
  isPersonalReminder?: boolean;
}

interface AgentFollowUpsTabProps {
  todos: TodoItem[];
  currentUser: { name: string; id: string };
  db: any;
  addSystemNotification: (
    title: string,
    message: string,
    type: any,
    targetAgent: string,
    stableId?: string
  ) => void;
}

export const AgentFollowUpsTab: React.FC<AgentFollowUpsTabProps> = ({
  todos,
  currentUser,
  db,
  addSystemNotification,
}) => {
  const [description, setDescription] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter personal follow-ups for the current agent
  const myFollowUps = todos
    .filter(
      (t) =>
        t.agentName === currentUser.name &&
        t.isPersonalReminder === true
    )
    .sort((a, b) => {
      // Completed items at the end
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // Sort by reminder time ascending
      const timeA = a.reminderTimeMs || Infinity;
      const timeB = b.reminderTimeMs || Infinity;
      return timeA - timeB;
    });

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const reminderTimeMs = reminderDate ? new Date(reminderDate).getTime() : null;
      const itemId = `td_personal_${Date.now()}`;
      
      const newFollowUp: TodoItem = {
        id: itemId,
        agentName: currentUser.name,
        text: description.trim(),
        isCompleted: false,
        reminderTimeMs,
        createdAt: new Date().toISOString(),
        category: "Personal",
        isPersonalReminder: true,
      };

      await setDoc(doc(db, "todos", itemId), newFollowUp);

      // Successfully saved
      setDescription("");
      setReminderDate("");
      
      // Send a purely local system notification to the action logs as feedback for the user
      addSystemNotification(
        "Follow-up Saved",
        `Personal follow-up task added!`,
        "general",
        currentUser.name,
        `personal_notif_added_${Date.now()}`
      );
    } catch (err) {
      console.error("Error saving personal follow-up:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDone = async (id: string, currentCompleted: boolean) => {
    try {
      await updateDoc(doc(db, "todos", id), {
        isCompleted: !currentCompleted,
      });
    } catch (err) {
      console.error("Error updating personal follow-up status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this personal follow-up?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "todos", id));
    } catch (err) {
      console.error("Error deleting personal follow-up:", err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-1">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" /> Personal Follow-up Reminders
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Log your personal reminders, lead follow-ups, or pending administrative tasks. 
            All entries here are <strong className="text-emerald-300">strictly private to you</strong>, visible only on your portal, and will never trigger notifications to Team Leaders.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl shrink-0 self-start md:self-center">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Agent Only Privacy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Container */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest border-b border-white/10 pb-3">
            Add New Reminder
          </h3>
          <form onSubmit={handleSaveFollowUp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Task / Follow-up Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Call patient John Doe regarding his unresolved Tamara complaint."
                rows={3}
                required
                className="w-full bg-[#1e1e1e]/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Reminder Date &amp; Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-[#1e1e1e]/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Leave empty to save as a list item without a scheduled time-alert.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/25 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Follow-up"}
            </button>
          </form>
        </div>

        {/* List Container */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
              My Active Follow-ups ({myFollowUps.length})
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
              Latest First
            </span>
          </div>

          {myFollowUps.length === 0 ? (
            <div className="text-center bg-slate-900/20 border border-slate-800/60 rounded-2xl py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800/40 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-slate-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">All Done! No Pending Reminders</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Excellent work! Use the panel on the left to add a follow-up date for files, calls, or tickets you are managing.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {myFollowUps.map((t) => {
                const isOverdue = t.reminderTimeMs && !t.isCompleted && t.reminderTimeMs < Date.now();
                return (
                  <div
                    key={t.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                      t.isCompleted
                        ? "bg-slate-950/20 border-slate-900/40 opacity-55"
                        : isOverdue
                        ? "bg-rose-950/25 border-rose-900/60 shadow-lg shadow-rose-950/10"
                        : "bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleMarkDone(t.id, t.isCompleted)}
                        className={`mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full flex items-center justify-center border transition-all ${
                          t.isCompleted
                            ? "bg-emerald-500 border-emerald-500 text-slate-950"
                            : isOverdue
                            ? "border-rose-500 hover:bg-rose-500/10 text-transparent"
                            : "border-slate-600 hover:border-emerald-400 text-transparent"
                        }`}
                        title={t.isCompleted ? "Mark Pending" : "Mark Completed"}
                      >
                        {t.isCompleted && (
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                          </svg>
                        )}
                      </button>

                      <div className="min-w-0 space-y-1.5">
                        <p
                          className={`text-slate-200 text-sm leading-relaxed font-medium break-words ${
                            t.isCompleted ? "line-through text-slate-500" : ""
                          }`}
                        >
                          {t.text}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 py-0.5 px-2 rounded-full inline-flex items-center gap-1 uppercase tracking-wider">
                            <Lock className="w-2.5 h-2.5" /> Personal
                          </span>

                          {t.reminderTimeMs && (
                            <span className={`text-[9px] font-bold py-0.5 px-2 rounded-full inline-flex items-center gap-1 font-mono ${
                              t.isCompleted
                                ? "bg-slate-800 text-slate-500"
                                : isOverdue
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/20 animate-pulse"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                            }`}>
                              <Clock className="w-3 h-3" />
                              {isOverdue && !t.isCompleted && "OVERDUE: "}
                              {new Date(t.reminderTimeMs).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}

                          {t.isCompleted ? (
                            <span className="text-[9px] font-bold bg-slate-800 text-slate-400 py-0.5 px-2 rounded-full uppercase tracking-wider">
                              Done
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[9px] font-bold bg-rose-500/15 text-rose-300 py-0.5 px-2 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> Action Needed
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-sky-500/10 text-sky-400 py-0.5 px-2 rounded-full uppercase tracking-wider">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="text-slate-500 hover:text-rose-400 p-2 border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        title="Delete Follow-up"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
