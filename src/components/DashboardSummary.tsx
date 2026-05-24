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
  AlertCircle
} from 'lucide-react';

interface DashboardSummaryProps {
  currentUser: { name: string; role: string };
  myNextShift: any;
  pendingRequestsCount: number;
  activeCasesCount: number;
  onNavigate: (tab: string) => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ 
  currentUser, 
  myNextShift, 
  pendingRequestsCount, 
  activeCasesCount,
  onNavigate 
}) => {
  const isAgent = currentUser.role === 'agent';
  const isTL = currentUser.role === 'tl';

  return (
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
    </div>
  );
};
