import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Users, 
  Activity,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Bell
} from 'lucide-react';

interface DashboardSummaryProps {
  currentUser: { name: string; role: string };
  myNextShift: any;
  pendingRequestsCount: number;
  activeCasesCount: number;
  inquiriesCount?: number;
  ttRequestsCount?: number;
  qaScores?: any[];
  onNavigate: (tab: string) => void;
  announcements?: any[];
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ 
  currentUser, 
  myNextShift, 
  pendingRequestsCount, 
  activeCasesCount,
  inquiriesCount = 0,
  ttRequestsCount = 0,
  qaScores = [],
  onNavigate,
  announcements = []
}) => {
  const isAgent = currentUser.role === 'agent';
  const isTL = currentUser.role === 'tl';

  // For agents, show their own avg score, for TLs show team avg
  const myQaScores = isAgent 
    ? qaScores.filter(s => s.agentName.toLowerCase() === currentUser.name.toLowerCase())
    : qaScores;
  
  const avgQaScore = myQaScores.length > 0 
    ? Math.round((myQaScores.reduce((acc, s) => acc + (s.totalScore / s.maxTotalScore), 0) / myQaScores.length) * 100)
    : null;

  return (
    <div className="space-y-6 w-full">
      {/* Prominent Live Announcement Banner */}
      {announcements && announcements.length > 0 && (() => {
        const latest = announcements[0];
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 border border-amber-500/30 rounded-3xl bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-transparent backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-yellow-500/5"
          >
            {/* Pulsing glow layer */}
            <div className="absolute top-0 right-0 w-48 h-12 bg-yellow-500/10 blur-xl rounded-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 relative border border-amber-400/30">
                  <Bell className="w-5 h-5 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-400/20">
                      Live Broadcast
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {latest.author} • {new Date(latest.createdAt).toLocaleDateString()} at {new Date(latest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {latest.clinicFilter && latest.clinicFilter !== 'all' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                        Target: {latest.clinicFilter}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-bold text-slate-200 mt-1">Latest Update from Management:</h4>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-4xl line-clamp-3">
                    {latest.message}
                  </p>
                </div>
              </div>
              
              <div className="shrink-0 flex items-center gap-3 self-end md:self-center">
                <button 
                  onClick={() => onNavigate('tl-announcements')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  Read Full Board <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
      {/* Welcome Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 p-6 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-600/20 flex flex-col justify-between relative overflow-hidden group"
      >
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <TrendingUp className="w-48 h-48 text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 text-white">
               {isTL ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Operational Overview</p>
              <h2 className="text-2xl font-black text-white tracking-tight">Salam, {currentUser.name.split(' ')[0]}</h2>
            </div>
          </div>
          <p className="text-indigo-100/80 text-sm max-w-md leading-relaxed mt-4">
            {isTL 
              ? "Your team is currently under review. 3 members have active shift swap requests pending your approval."
              : "You're all set for your next rotation. Remember to sync your latest schedule to Google Calendar."}
          </p>
        </div>

        <div className="relative z-10 flex gap-3 mt-6">
          <button 
            onClick={() => onNavigate('roster')}
            className="px-5 py-2 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            Go to Roster <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Shift Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-between group hover:border-indigo-500/30 transition-all cursor-pointer"
        onClick={() => onNavigate('roster')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
            Active
          </div>
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Upcoming Rotation</p>
          <h3 className="text-xl font-bold text-slate-100">{myNextShift?.shiftLabel || 'Off Duty'}</h3>
          <p className="text-slate-400 text-xs mt-1">{myNextShift?.date || 'No scheduled date'}</p>
        </div>
      </motion.div>

      {/* Activities Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-between group hover:border-amber-500/30 transition-all cursor-pointer"
        onClick={() => onNavigate(isAgent ? 'cases' : 'client-comms')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          {pendingRequestsCount > 0 && (
            <div className="relative">
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping opacity-75" />
              <div className="relative w-2.5 h-2.5 bg-amber-500 rounded-full" />
            </div>
          )}
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Queue Status</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-100">{pendingRequestsCount + activeCasesCount}</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Items</span>
          </div>
          <p className="text-slate-400 text-xs mt-2 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> {pendingRequestsCount} Pending Requests
          </p>
        </div>
      </motion.div>
      {/* QA Score Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-between group hover:border-green-500/30 transition-all cursor-pointer"
        onClick={() => onNavigate('qa-scorecard')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">QA Performance</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-3xl font-black ${avgQaScore && avgQaScore < 70 ? 'text-red-400' : 'text-green-400'}`}>
              {avgQaScore !== null ? `${avgQaScore}%` : 'N/A'}
            </h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Average</span>
          </div>
          <p className="text-slate-400 text-xs mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" /> {myQaScores.length} Evaluations
          </p>
        </div>
      </motion.div>

      {/* Inquiries Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-between group hover:border-pink-500/30 transition-all cursor-pointer"
        onClick={() => onNavigate('inquiries')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Inquiries</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-pink-400">{inquiriesCount}</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</span>
          </div>
          <p className="text-slate-400 text-xs mt-2 flex items-center gap-1.5 hover:text-pink-300">
            Click to view all inquiries <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </motion.div>

      {/* Fintech Requests Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-500/30 transition-all cursor-pointer"
        onClick={() => onNavigate('tabby-tamara')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Fintech Requests</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-cyan-400">{ttRequestsCount}</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</span>
          </div>
          <p className="text-slate-400 text-xs mt-2 flex items-center gap-1.5 hover:text-cyan-300">
            Click to view Tabby/Tamara <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </motion.div>


    </div>
  </div>
  );
};
