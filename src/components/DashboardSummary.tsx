import React from 'react';
import { motion } from 'motion/react';
import { normalizeAgentLob } from '../utils';
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
import { WeeklyPerformanceHeatmap } from './WeeklyPerformanceHeatmap';
import { Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint, ClientCommunicationRequest } from '../types';

interface DashboardSummaryProps {
  currentUser: { name: string; role: string; teamLeader?: string; lob?: string };
  myNextShift: any;
  pendingRequestsCount: number;
  activeCasesCount: number;
  inquiriesCount?: number;
  ttRequestsCount?: number;
  qaScores?: any[];
  onNavigate: (tab: string) => void;
  onCardClick?: (cardType: 'queue' | 'qa' | 'inquiry' | 'fintech') => void;
  announcements?: any[];
  agentMeta?: Record<string, { tlName?: string; roleType?: string }>;
  inquiries?: Inquiry[];
  tabbyTamaraRequests?: TabbyTamaraRequest[];
  tabbyTamaraComplaints?: TabbyTamaraComplaint[];
  clientComms?: ClientCommunicationRequest[];
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
  onCardClick,
  announcements = [],
  agentMeta = {},
  inquiries = [],
  tabbyTamaraRequests = [],
  tabbyTamaraComplaints = [],
  clientComms = []
}) => {
  const isAgent = ['agent', 'sme'].includes(currentUser.role as string);
  const isTL = currentUser.role === 'tl';

  // For agents, show their own avg score, for TLs show team avg
  const myQaScores = isAgent 
    ? qaScores.filter(s => s.agentName.toLowerCase() === currentUser.name.toLowerCase())
    : qaScores;
  
  const avgQaScore = myQaScores.length > 0 
    ? Math.round((myQaScores.reduce((acc, s) => acc + (s.totalScore / s.maxTotalScore), 0) / myQaScores.length) * 100)
    : null;

  const handleCardTrigger = (type: 'queue' | 'qa' | 'inquiry' | 'fintech', defaultTab: string) => {
    if (onCardClick) {
      onCardClick(type);
    } else {
      onNavigate(defaultTab);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Prominent Live Announcement Banner */}
      {announcements && announcements.length > 0 && (() => {
        const latest = announcements[0];
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 border border-amber-500/30 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-transparent relative overflow-hidden group"
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
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/20">
                      Live Broadcast
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {latest.author} • {new Date(latest.createdAt).toLocaleDateString()} at {new Date(latest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {latest.clinicFilter && latest.clinicFilter !== 'all' && (
                      <span className="text-xs font-mono px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
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
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer"
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
          className="lg:col-span-2 p-6 rounded-2xl bg-indigo-600 flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp className="w-48 h-48 text-white" />
          </div>
          
          <div className="relative z-10 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 text-white">
                 {isTL ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-white/60 text-xs font-black uppercase tracking-[0.2em]">Operational Overview</p>
                <h2 className="text-2xl font-black text-white tracking-tight">Salam, {(currentUser?.name || '').split(' ')[0]} 👋</h2>
                <p className="text-sm text-indigo-200 mt-1">{currentUser?.name}</p>
                
                {currentUser?.role === 'agent' && (currentUser?.teamLeader || agentMeta?.[currentUser.name]?.tlName) && (
                  <div className="flex items-center gap-2 mt-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs text-indigo-300 font-medium">
                      Direct Manager: {currentUser?.teamLeader || agentMeta?.[currentUser.name]?.tlName}
                    </span>
                  </div>
                )}
                
                {currentUser?.role === 'tl' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-medium">Team Leader</span>
                  </div>
                )}

                {currentUser?.role === 'agent' && normalizeAgentLob(currentUser?.lob, currentUser?.role) && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {normalizeAgentLob(currentUser.lob, currentUser.role) === 'Call Center' ? '📞 Call Center' : '💬 Chat'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-indigo-100/80 text-sm max-w-md leading-relaxed mt-4">
              {isTL 
                ? "Your dashboard is fully interactive. Click any of the categories below to inspect real-time cases, active agents, elapsed time, and leave design responses."
                : "Your system has been synced with real-time cases. Click card summaries to inspect details, attachments, and chat replies."}
            </p>
          </div>

          <div className="relative z-10 flex gap-3 mt-6">
            <button 
              onClick={() => onNavigate('roster')}
              className="px-5 py-2 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
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
          className="p-6 rounded-[32px] bg-[#181a20] border-none flex flex-col justify-between group hover:bg-[#1f222a] transition-all cursor-pointer text-left"
          onClick={() => onNavigate('roster')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest">
              Active
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Upcoming Rotation</p>
            <h3 className="text-2xl font-black text-white px-0.5">{myNextShift?.shiftLabel || 'Off Duty'}</h3>
            <p className="text-slate-500 text-sm mt-1 font-medium">{myNextShift?.date || 'No scheduled date'}</p>
          </div>
        </motion.div>

        {/* Queue/Activities Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-[32px] bg-[#181a20] border-none flex flex-col justify-between group hover:bg-[#1f222a] transition-all cursor-pointer text-left relative overflow-hidden"
          onClick={() => handleCardTrigger('queue', isAgent ? 'cases' : 'client-comms')}
        >
          <div className="absolute top-0 right-0 p-16 bg-amber-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            {(pendingRequestsCount > 0 || activeCasesCount > 0) && (
              <div className="relative">
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping opacity-75" />
                <div className="relative w-2.5 h-2.5 bg-amber-500 rounded-full" />
              </div>
            )}
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Queue Status</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-white">{(!isNaN(pendingRequestsCount) ? pendingRequestsCount : 0) + (!isNaN(activeCasesCount) ? activeCasesCount : 0)}</h3>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-widest group-hover:text-amber-300">Inspect</span>
            </div>
            <p className="text-slate-500 text-sm mt-2 flex items-center gap-1.5 font-medium group-hover:text-amber-400 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> {pendingRequestsCount} Pending Requests
            </p>
          </div>
        </motion.div>

        {/* QA Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-[32px] bg-[#181a20] border-none flex flex-col justify-between group hover:bg-[#1f222a] transition-all cursor-pointer text-left relative overflow-hidden"
          onClick={() => handleCardTrigger('qa', 'qa-scorecard')}
        >
          <div className="absolute top-0 right-0 p-16 bg-green-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-green-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">QA Performance</p>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-3xl font-black ${avgQaScore && avgQaScore < 70 ? 'text-red-400' : 'text-green-400'}`}>
                {avgQaScore !== null && !isNaN(avgQaScore) ? `${avgQaScore}%` : 'N/A'}
              </h3>
              <span className="text-xs text-green-400 font-bold uppercase tracking-widest group-hover:text-green-300">Inspect</span>
            </div>
            <p className="text-slate-500 text-sm mt-2 flex items-center gap-1.5 font-medium group-hover:text-green-400 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> {myQaScores.length} Evaluations
            </p>
          </div>
        </motion.div>

        {/* Inquiries Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-[32px] bg-[#181a20] border-none flex flex-col justify-between group hover:bg-[#1f222a] transition-all cursor-pointer text-left relative overflow-hidden"
          onClick={() => handleCardTrigger('inquiry', 'inquiries')}
        >
          <div className="absolute top-0 right-0 p-16 bg-pink-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-pink-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Clinic Inquiries</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-pink-400">{inquiriesCount}</h3>
              <span className="text-xs text-pink-400 font-bold uppercase tracking-widest group-hover:text-pink-300">Inspect</span>
            </div>
            <p className="text-slate-500 text-sm mt-2 flex items-center gap-1.5 font-medium group-hover:text-pink-400 transition-colors">
              Click to view and chat <ArrowRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </motion.div>

        {/* Fintech Requests Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-[32px] bg-[#181a20] border-none flex flex-col justify-between group hover:bg-[#1f222a] transition-all cursor-pointer text-left relative overflow-hidden"
          onClick={() => handleCardTrigger('fintech', 'tabby-tamara')}
        >
          <div className="absolute top-0 right-0 p-16 bg-cyan-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Tabby / Tamara Desk</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-cyan-400">{ttRequestsCount}</h3>
              <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest group-hover:text-cyan-300">Inspect</span>
            </div>
            <p className="text-slate-500 text-sm mt-2 flex items-center gap-1.5 font-medium group-hover:text-cyan-400 transition-colors">
              Click to view or update links <ArrowRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </motion.div>
      </div>

      {/* Weekly Performance Heatmap (Visible to TLs and Admins) */}
      {(currentUser?.role === 'tl' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
        <div className="mt-4">
          <WeeklyPerformanceHeatmap
            inquiries={inquiries}
            tabbyTamaraRequests={tabbyTamaraRequests}
            tabbyTamaraComplaints={tabbyTamaraComplaints}
            clientComms={clientComms}
          />
        </div>
      )}
    </div>
  );
};
