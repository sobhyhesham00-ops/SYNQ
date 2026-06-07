import React, { useState, useEffect } from "react";
import { useEmulator, seedEmulatorDatabase } from "../firebase";
import { User, Role } from "../types";
import { Shield, Sparkles, Database, UserCheck, ChevronDown, Check, Key, Layers, RefreshCw } from "lucide-react";

interface EnvironmentBadgeProps {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export function EnvironmentBadge({ currentUser, setCurrentUser }: EnvironmentBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [environment, setEnvironment] = useState<"LOCAL" | "STAGING" | "PRODUCTION">("PRODUCTION");
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (useEmulator || hostname === "localhost" || hostname === "127.0.0.1") {
      setEnvironment("LOCAL");
    } else if (hostname.includes("-pre-") || hostname.includes("staging")) {
      setEnvironment("STAGING");
    } else {
      setEnvironment("PRODUCTION");
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

  const handleCopyPassword = (username: string) => {
    navigator.clipboard.writeText("Password123");
    setCopiedAccount(username);
    setTimeout(() => setCopiedAccount(null), 1500);
  };

  const badgeStyles = {
    LOCAL: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-emerald-950/20",
    STAGING: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-amber-950/20",
    PRODUCTION: "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 shadow-rose-950/20",
  };

  const dotStyles = {
    LOCAL: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse",
    STAGING: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse",
    PRODUCTION: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)] animate-pulse",
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans" id="env-badge-container">
      <button
        id="env-badge-button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md shadow-lg transition-all duration-300 ${badgeStyles[environment]}`}
      >
        <span className={`w-2 h-2 rounded-full ${dotStyles[environment]}`}></span>
        <span>{environment}</span>
        {useEmulator && <Database className="w-3.5 h-3.5 text-emerald-400" />}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          id="env-badge-dropdown"
          className="absolute bottom-10 left-0 w-80 bg-slate-900/95 border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl p-4 text-left animate-fade-in text-slate-100"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Environment Details</h4>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              v1.1.0
            </span>
          </div>

          <div className="space-y-2 mb-4 text-xs font-medium text-slate-400">
            <div className="flex justify-between items-center bg-slate-950/45 p-2 rounded-lg">
              <span>Firebase Emulator:</span>
              <span className={`font-semibold ${useEmulator ? "text-emerald-400" : "text-slate-500"}`}>
                {useEmulator ? "Enabled (localhost)" : "Disabled (cloud)"}
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/45 p-2 rounded-lg">
              <span>Active Database:</span>
              <span className="font-mono text-[10px] text-slate-300 truncate max-w-[150px]">
                {useEmulator ? "Emulator Workspace" : "operating-nebula-7sjh2"}
              </span>
            </div>
          </div>

          {environment === "LOCAL" && (
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" /> Seed Login Assist
                </span>
                <button 
                  onClick={() => {
                    seedEmulatorDatabase();
                  }}
                  title="Reseed Emulator Database"
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mb-3">
                Click an account to immediately sign in locally without entering passwords.
              </p>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {seedAccounts.map((acc) => (
                  <div
                    key={acc.username}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition group text-xs border border-transparent hover:border-white/5"
                  >
                    <button
                      onClick={() => handleQuickLogin(acc)}
                      className="flex-1 text-left"
                    >
                      <div className="font-semibold text-slate-200 truncate">{acc.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{acc.username}</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-mono text-[9px] uppercase">{acc.role}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleCopyPassword(acc.username)}
                      title="Copy standard password (Password123)"
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition flex items-center gap-1"
                    >
                      {copiedAccount === acc.username ? (
                        <Check className="w-3 h-3 text-emerald-400 animate-scale-up" />
                      ) : (
                        <Key className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      )}
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
