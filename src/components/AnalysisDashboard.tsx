import React, { useState } from 'react';
import { BarChart2, PieChart, Activity, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface AnalysisDashboardProps {
  schedules: any[];
}

export function AnalysisDashboard({ schedules }: AnalysisDashboardProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!schedules || schedules.length === 0) {
      toast.error('No schedules available to analyze. Please upload or add schedules first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: schedules.slice(0, 100) }) // Send sample to avoid huge payloads
      });
      
      if (!res.ok) {
        if (res.status === 401) {
            throw new Error('API key validation failed. Please configure Gemini API key.');
        }
        throw new Error('Analysis failed');
      }

      const data = await res.json();
      setAnalysis(data.analysis || data.message || 'Analysis complete, but no insights were returned.');
      toast.success('Schedule analysis complete!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to analyze schedule');
      setAnalysis(`Error analyzing schedule: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simple stats calculation for the dashboard UI
  const totalShifts = schedules.length;
  const uniqueAgents = new Set(schedules.map(s => s.agentName || s.name)).size;
  const upcomingShifts = schedules.filter(s => {
    const shiftDate = new Date(s.date);
    return shiftDate >= new Date();
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <BarChart2 className="w-16 h-16 text-indigo-400" />
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Shifts</p>
          <div className="text-3xl font-black text-white">{totalShifts}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Activity className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Unique Agents</p>
          <div className="text-3xl font-black text-white">{uniqueAgents}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <TrendingUp className="w-16 h-16 text-amber-400" />
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Upcoming Shifts</p>
          <div className="text-3xl font-black text-white">{upcomingShifts}</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-center items-start group">
          <div className="absolute top-0 right-0 p-4 opacity-20">
             <Sparkles className="w-16 h-16 text-white animate-pulse" />
          </div>
          <h3 className="text-white font-bold mb-2 relative z-10">AI Insights</h3>
          <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || totalShifts === 0}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-lg backdrop-blur-sm transition-all cursor-pointer relative z-10 flex items-center gap-2"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <>Generate Report</>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Area */}
      {analysis && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-6 py-4 flex items-center gap-3">
             <Sparkles className="w-5 h-5 text-indigo-400" />
             <h3 className="font-bold text-white tracking-wide">AI Schedule Analysis</h3>
          </div>
          <div className="p-6">
             <div className="prose prose-invert prose-indigo max-w-none text-sm whitespace-pre-wrap leading-relaxed text-slate-300">
                {analysis}
             </div>
          </div>
        </div>
      )}

      {/* Placeholder Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg min-h-[300px] flex flex-col items-center justify-center text-slate-500">
           <PieChart className="w-12 h-12 mb-3 opacity-20" />
           <p className="font-medium">Coverage Distribution</p>
           <p className="text-xs mt-1 opacity-60">Visualizations available upon full schedule upload.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg min-h-[300px] flex flex-col items-center justify-center text-slate-500">
           <BarChart2 className="w-12 h-12 mb-3 opacity-20" />
           <p className="font-medium">Shift Volume Patterns</p>
           <p className="text-xs mt-1 opacity-60">Visualizations available upon full schedule upload.</p>
        </div>
      </div>
    </div>
  );
}
