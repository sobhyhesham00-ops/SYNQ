import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  Trash2,
  Lock,
  Smartphone,
  ShieldCheck,
  FileText,
  Clock
} from 'lucide-react';
import { googleSignIn, logout as googleLogout, getAccessToken } from '../firebase';
import { toast } from 'sonner';

interface IntegrationsManagerProps {
  currentUser: { name: string; role: string; email?: string };
  onReset: () => void;
}

export const IntegrationsManager: React.FC<IntegrationsManagerProps> = ({ currentUser, onReset }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const isGlobalAdmin = currentUser?.email?.toLowerCase() === 'sobhyhesham00@gmail.com' ||
    currentUser?.name?.toLowerCase() === 'h.sobhy' ||
    currentUser?.name?.toLowerCase() === 'hesham sobhy' ||
    currentUser?.name?.toLowerCase() === 'hesso';

  useEffect(() => {
    // On load, check if we have a token (some persistence might carry over if session is active)
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const t = await getAccessToken();
    setToken(t);
  };

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setToken(result.accessToken);
        toast.success('Successfully linked Google Account!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to link Google account.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (window.confirm('Are you sure you want to unlink your Google Account? You will lose access to Calendar and Drive features.')) {
      await googleLogout();
      setGoogleUser(null);
      setToken(null);
      toast.info('Google Account unlinked.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">Connected Integrations</h2>
        <p className="text-sm text-slate-400">Manage external service connections for enhanced productivity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Workspace Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cloud className="w-32 h-32 text-indigo-500" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Calendar className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Google Workspace</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Drive & Calendar</span>
                    {token ? (
                      <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Linked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-black text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <AlertCircle className="w-2.5 h-2.5" /> Not Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                Sync your rosters to Google Calendar or export universal .ics files for Outlook and Apple Calendar. Save reports directly to your Google Drive.
              </p>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-transparent border border-white/5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-200">Universal Calendar Sync</p>
                    <p className="text-[10px] text-slate-500">Add shifts to Google, Outlook, or Apple Calendar.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-transparent border border-white/5">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-200">Google Drive Export</p>
                    <p className="text-[10px] text-slate-500">Save CSV and PDF reports directly to your cloud storage.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {token ? (
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-black">
                        G
                      </div>
                      <div className="text-[11px]">
                        <p className="text-indigo-200 font-bold">Authorized Session</p>
                        <p className="text-slate-500 truncate max-w-[150px]">{currentUser.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleUnlink}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Unlink Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  disabled={isLinking}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {isLinking ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5" />
                      Link Google Account
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Security & Access Info Card */}
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Security Protocol
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Authentication tokens are stored strictly in volatile memory. No credentials or session keys are persisted to your browser's local storage.
                </p>
              </div>
              <div className="flex gap-3">
                <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Permissions are restricted to app-created files and calendar events. We do not access your full personal Drive or private Calendar history.
                </p>
              </div>
              <div className="flex gap-3">
                <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sessions automatically expire upon logging out or closing the browser tab to ensure maximum security of your Workspace data.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-100">Ready to sync?</p>
              <p className="text-[10px] text-slate-400">Head over to your schedule to see new Google options.</p>
            </div>
            <ExternalLink className="w-5 h-5 text-indigo-400" />
          </div>

          {isGlobalAdmin && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-xs font-black uppercase tracking-widest">Dangerous Zone</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Admin tool for complete data management. Use with extreme caution.
              </p>
              <button
                onClick={onReset}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Full System Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
