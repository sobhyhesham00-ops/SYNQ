import React, { useState, useEffect } from "react";
import { useEmulator, seedEmulatorDatabase } from "../firebase";
import { User, Role } from "../types";
import { Shield, Sparkles, Database, UserCheck, ChevronDown, Check, Key, Layers, RefreshCw, Zap, CalendarDays, Info, X } from "lucide-react";
import { copyToClipboard } from '../utils';

interface EnvironmentBadgeProps {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const APP_VERSION = "2.4.1";
const BUILD_DATE = "June 2026";
const FIRST_OP_DAY = "May 17, 2026";
const FIRST_OP_DAYS_AGO = (() => {
  const first = new Date("2026-05-17");
  const now = new Date();
  return Math.floor((now.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
})();

const CHANGELOG = [
  { version: "2.4.1", date: "Jun 2026", note: "CRM table redesign — all request types unified" },
  { version: "2.3.0", date: "May 2026", note: "Tabby/Tamara complaint workflow & stepper" },
  { version: "2.2.0", date: "Apr 2026", note: "QA scorecards & agent performance panel" },
  { version: "2.1.0", date: "Mar 2026", note: "WhatsApp clipboard templates & link support" },
  { version: "2.0.0", date: "Feb 2026", note: "SYNQ rebranded from SKD — full CRM launch" },
  { version: "1.0.0", date: "May 2026", note: "First operational day — live with 3 clinics" },
];

export function EnvironmentBadge({ currentUser, setCurrentUser }: EnvironmentBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (useEmulator || hostname === "localhost" || hostname === "127.0.0.1") {
      setIsDevMode(true);
    }
  }, []);

  const seedAccounts: { name: string; username: string; role: string; roleKey: Role }[] = [
    { name: "Hesham Sobhy", username: "h.sobhy", role: "Super Admin", roleKey: "tl" },
    { name: "Amira Hassan", username: "a.hassan", role: "Director", roleKey: "tl" },
    { name: "Shymaa Hassan", username: "s.hassan", role: "Team Leader", roleKey: "tl" },
    { name: "Basma Rabea", username: "b.rabea", role: "QA Evaluator", roleKey: "qa" },
    { name: "Jodie El Sayed Mohamed Mohamed", username: "j.mohamed", role: "Temporary Support", roleKey: "agent" },
    { name: "AbdelRahman Al Sayed", username: "a.sayed", role: "Agent", roleKey: "agent" },
  ];

  const handleQuickLogin = (acc: typeof seedAccounts[0]) => {
    const authenticatedUser: User = {
      id: `usr_${Date.now()}`,
      name: acc.name,
      role: acc.roleKey,
    };
    setCurrentUser(authenticatedUser);
    setIsOpen(false);
  };

  const handleCopyPassword = async (username: string) => {
    const ok = await copyToClipboard("Password123", "Copied Password123!");
    if (ok) {
      setCopiedAccount(username);
      setTimeout(() => setCopiedAccount(null), 1500);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans" id="env-badge-container">
      {/* Version pill button */}
      <button
        id="env-badge-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-mono font-semibold backdrop-blur-md shadow transition-all duration-200"
      >
        <Zap className="w-3 h-3 text-indigo-400" />
        <span>SYNQ v{APP_VERSION}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          id="env-badge-dropdown"
          className="absolute bottom-11 left-0 w-80 bg-slate-950/95 border border-white/10 rounded-2xl shadow backdrop-blur-xl p-4 text-left animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 tracking-wide">SYNQ Operations</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Version + build info */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center bg-white/[0.04] px-3 py-2 rounded-xl border border-white/5">
              <span className="text-xs text-slate-500">Version</span>
              <span className="font-mono text-xs text-indigo-300 font-bold">v{APP_VERSION} — {BUILD_DATE}</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.04] px-3 py-2 rounded-xl border border-white/5">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 text-emerald-400" />
                First operation day
              </span>
              <span className="font-mono text-xs text-emerald-400 font-bold">{FIRST_OP_DAY}</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.04] px-3 py-2 rounded-xl border border-white/5">
              <span className="text-xs text-slate-500">Days since launch</span>
              <span className="font-mono text-xs text-amber-400 font-bold">{FIRST_OP_DAYS_AGO} days live</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.04] px-3 py-2 rounded-xl border border-white/5">
              <span className="text-xs text-slate-500">Firebase</span>
              <span className={`text-xs font-semibold ${useEmulator ? "text-amber-400" : "text-slate-400"}`}>
                {useEmulator ? "Emulator (local)" : "Cloud (live)"}
              </span>
            </div>
          </div>

          {/* Changelog */}
          <div className="mb-3">
            <p className="text-xs uppercase tracking-widest text-slate-600 font-bold mb-2 flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Release history
            </p>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {CHANGELOG.map((entry, i) => (
                <div
                  key={entry.version}
                  className={`flex items-start gap-2.5 px-2.5 py-2 rounded-xl border ${
                    i === 0
                      ? "bg-indigo-500/10 border-indigo-500/20"
                      : "bg-transparent border-white/[0.04]"
                  }`}
                >
                  <span className={`font-mono text-xs font-bold shrink-0 mt-0.5 ${i === 0 ? "text-indigo-400" : "text-slate-600"}`}>
                    v{entry.version}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-snug">{entry.note}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{entry.date}</p>
                  </div>
                  {i === 0 && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                      LATEST
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dev mode login assist — only shown on localhost/emulator */}
          {isDevMode && (
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3 h-3" /> Dev Login Assist
                </span>
                <button
                  onClick={() => seedEmulatorDatabase()}
                  title="Reseed Emulator Database"
                  className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-emerald-400 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {seedAccounts.map((acc) => (
                  <div
                    key={acc.username}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] transition group text-xs border border-white/[0.04]"
                  >
                    <button onClick={() => handleQuickLogin(acc)} className="flex-1 text-left">
                      <div className="font-semibold text-slate-200 text-xs truncate">{acc.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="font-mono">{acc.username}</span>
                        <span>·</span>
                        <span className="text-indigo-400">{acc.role}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleCopyPassword(acc.username)}
                      className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-slate-200 transition"
                      title="Copy password"
                    >
                      {copiedAccount === acc.username
                        ? <Check className="w-3 h-3 text-emerald-400" />
                        : <Key className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
