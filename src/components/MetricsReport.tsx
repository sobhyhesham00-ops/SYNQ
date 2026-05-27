import React, { useState, useMemo } from 'react';
import { Download, Search, Users, Activity, Target, TrendingUp, Calendar as CalIcon, Filter, Layers, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, User, CircleDot, RefreshCw, BarChart3, HelpCircle, Wallet, MessageSquare, History, Award, Heart, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import {
  User as UserType,
  Inquiry,
  TabbyTamaraRequest,
  TabbyTamaraComplaint,
  ClientCommunicationRequest,
  CaseRecord,
  TimeLog,
  INITIAL_AGENTS
} from '../types';
import * as XLSX from 'xlsx';

interface MetricsReportProps {
  currentUser: UserType;
  inquiries: Inquiry[];
  tabbyTamaraRequests: TabbyTamaraRequest[];
  tabbyTamaraComplaints: TabbyTamaraComplaint[];
  clientComms: ClientCommunicationRequest[];
  cases: CaseRecord[];
  timeLogs: TimeLog[];
}

type DateRange = 'today' | 'week' | 'month' | 'custom';
type SectionType = 'all' | 'inquiries' | 'fintech' | 'complaints' | 'comms' | 'cases';

export function MetricsReport({
  currentUser,
  inquiries,
  tabbyTamaraRequests,
  tabbyTamaraComplaints,
  clientComms,
  cases,
  timeLogs
}: MetricsReportProps) {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>(currentUser.role === 'agent' ? currentUser.name : 'all');
  const [activeAnalysisSection, setActiveAnalysisSection] = useState<SectionType>('all');

  // Helper date functions
  const filterByDateRange = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateRange === 'today') {
      return date >= startOfDay;
    } else if (dateRange === 'week') {
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return date >= startOfWeek;
    } else if (dateRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= startOfMonth;
    } else if (dateRange === 'custom') {
      const start = customStart ? new Date(customStart) : new Date(0);
      const end = customEnd ? new Date(customEnd) : new Date();
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    }
    return true;
  };

  const isAgentInvolved = (item: any, arrName: string, nameToCheck: string) => {
    if (nameToCheck === 'all') return true;
    switch (arrName) {
      case 'inquiries':
      case 'cases':
      case 'tabbyRequests':
      case 'tabbyComplaints':
      case 'timeLogs':
        return item.agentName === nameToCheck;
      case 'clientComms':
        return item.openedBy === nameToCheck || item.handledBy === nameToCheck;
      default:
        return false;
    }
  };

  // Compile stats
  const filteredInquiries = useMemo(() => inquiries.filter(i => filterByDateRange(i.createdAt) && isAgentInvolved(i, 'inquiries', selectedAgent)), [inquiries, dateRange, customStart, customEnd, selectedAgent]);
  const filteredTTRequests = useMemo(() => tabbyTamaraRequests.filter(i => filterByDateRange(i.createdAt) && isAgentInvolved(i, 'tabbyRequests', selectedAgent)), [tabbyTamaraRequests, dateRange, customStart, customEnd, selectedAgent]);
  const filteredTTComplaints = useMemo(() => tabbyTamaraComplaints.filter(i => filterByDateRange(i.createdAt) && isAgentInvolved(i, 'tabbyComplaints', selectedAgent)), [tabbyTamaraComplaints, dateRange, customStart, customEnd, selectedAgent]);
  const filteredComms = useMemo(() => clientComms.filter(i => filterByDateRange(i.createdAt) && isAgentInvolved(i, 'clientComms', selectedAgent)), [clientComms, dateRange, customStart, customEnd, selectedAgent]);
  const filteredCases = useMemo(() => cases.filter(i => filterByDateRange(i.createdAt) && isAgentInvolved(i, 'cases', selectedAgent)), [cases, dateRange, customStart, customEnd, selectedAgent]);

  const totalActions = filteredInquiries.length + filteredTTRequests.length + filteredTTComplaints.length + filteredComms.length + filteredCases.length;

  // Export to Excel helper
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ["Metric", "Count"],
      ["Date Range", dateRange],
      ["Agent Filter", selectedAgent],
      ["Total Actions Logged", totalActions],
      ["General Inquiries", filteredInquiries.length],
      ["Fintech API Requests", filteredTTRequests.length],
      ["Fintech API Complaints", filteredTTComplaints.length],
      ["Client Communication Requests", filteredComms.length],
      ["Cases & Tickets Tracker", filteredCases.length],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

    // Detail sheets
    if (filteredInquiries.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredInquiries), "Inquiries");
    if (filteredTTRequests.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredTTRequests), "Fintech Requests");
    if (filteredTTComplaints.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredTTComplaints), "Fintech Complaints");
    if (filteredComms.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredComms), "Client Comms");
    if (filteredCases.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredCases), "Cases Tracker");

    XLSX.writeFile(wb, `fitbit_performance_report_${selectedAgent}_${dateRange}.xlsx`);
  };

  // 1. Google Health / Fitbit Rings component
  const ConcentricFitbitRings = () => {
    // We render multiple overlapping rings inside a single SVG for that futuristic Fitbit visual look
    const size = 160;
    const strokeWidth = 12;
    const center = size / 2;
    
    const calculateCircleProps = (value: number, max: number, radius: number) => {
      const circumference = 2 * Math.PI * radius;
      const pct = Math.min(value / (max || 1), 1);
      const offset = circumference - pct * circumference;
      return { circumference, offset };
    };

    // Limits
    const goldFactor = currentUser.role === 'tl' && selectedAgent === 'all' ? 400 : 70;
    const inqProps = calculateCircleProps(filteredInquiries.length, goldFactor, 65);
    const fintechProps = calculateCircleProps(filteredTTRequests.length + filteredTTComplaints.length, goldFactor / 2, 50);
    const commProps = calculateCircleProps(filteredComms.length, goldFactor / 2, 35);
    const caseProps = calculateCircleProps(filteredCases.length, goldFactor / 2, 20);

    return (
      <div className="relative flex items-center justify-center w-48 h-48 bg-slate-900/50 rounded-full border border-slate-800 shadow-inner">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circles */}
          <circle cx={center} cy={center} r="65" fill="none" className="stroke-slate-850" strokeWidth={strokeWidth} strokeOpacity="0.2" />
          <circle cx={center} cy={center} r="50" fill="none" className="stroke-slate-850" strokeWidth={strokeWidth} strokeOpacity="0.2" />
          <circle cx={center} cy={center} r="35" fill="none" className="stroke-slate-850" strokeWidth={strokeWidth} strokeOpacity="0.2" />
          <circle cx={center} cy={center} r="20" fill="none" className="stroke-slate-850" strokeWidth={strokeWidth} strokeOpacity="0.2" />

          {/* Active Rings with Neon Glows (Fitbit Active Zone color palette) */}
          {/* General Inquiries - Teal */}
          <circle 
            cx={center} cy={center} r="65" fill="none" 
            className="stroke-[#00E5FF] transition-all duration-1000 ease-out" 
            strokeWidth={strokeWidth} strokeLinecap="round" 
            strokeDasharray={inqProps.circumference} strokeDashoffset={inqProps.offset} 
          />
          {/* Fintech Req & Complaints - Gold/Amber */}
          <circle 
            cx={center} cy={center} r="50" fill="none" 
            className="stroke-[#FFA726] transition-all duration-1000 ease-out" 
            strokeWidth={strokeWidth} strokeLinecap="round" 
            strokeDasharray={fintechProps.circumference} strokeDashoffset={fintechProps.offset} 
          />
          {/* Comms - Pink Purple */}
          <circle 
            cx={center} cy={center} r="35" fill="none" 
            className="stroke-[#E040FB] transition-all duration-1000 ease-out" 
            strokeWidth={strokeWidth} strokeLinecap="round" 
            strokeDasharray={commProps.circumference} strokeDashoffset={commProps.offset} 
          />
          {/* Cases - Heart Coral */}
          <circle 
            cx={center} cy={center} r="20" fill="none" 
            className="stroke-[#FF5252] transition-all duration-1000 ease-out" 
            strokeWidth={strokeWidth} strokeLinecap="round" 
            strokeDasharray={caseProps.circumference} strokeDashoffset={caseProps.offset} 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <Flame className="w-7 h-7 text-[#FF5252] animate-pulse" />
          <span className="text-2xl font-black font-mono tracking-tight text-white mt-1">{totalActions}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
        </div>
      </div>
    );
  };

  // 2. Metrics group by Day Matrices
  const dailyMatrix = useMemo(() => {
    const matrixMap: Record<string, {
      date: string;
      inquiries: number;
      fintech: number;
      complaints: number;
      comms: number;
      cases: number;
      total: number;
    }> = {};

    const formatDateKey = (isoStr: string) => {
      if (!isoStr) return '';
      return isoStr.split('T')[0];
    };

    filteredInquiries.forEach(i => {
      const d = formatDateKey(i.createdAt);
      if (!d) return;
      if (!matrixMap[d]) matrixMap[d] = { date: d, inquiries: 0, fintech: 0, complaints: 0, comms: 0, cases: 0, total: 0 };
      matrixMap[d].inquiries++;
      matrixMap[d].total++;
    });

    filteredTTRequests.forEach(i => {
      const d = formatDateKey(i.createdAt);
      if (!d) return;
      if (!matrixMap[d]) matrixMap[d] = { date: d, inquiries: 0, fintech: 0, complaints: 0, comms: 0, cases: 0, total: 0 };
      matrixMap[d].fintech++;
      matrixMap[d].total++;
    });

    filteredTTComplaints.forEach(i => {
      const d = formatDateKey(i.createdAt);
      if (!d) return;
      if (!matrixMap[d]) matrixMap[d] = { date: d, inquiries: 0, fintech: 0, complaints: 0, comms: 0, cases: 0, total: 0 };
      matrixMap[d].complaints++;
      matrixMap[d].total++;
    });

    filteredComms.forEach(i => {
      const d = formatDateKey(i.createdAt);
      if (!d) return;
      if (!matrixMap[d]) matrixMap[d] = { date: d, inquiries: 0, fintech: 0, complaints: 0, comms: 0, cases: 0, total: 0 };
      matrixMap[d].comms++;
      matrixMap[d].total++;
    });

    filteredCases.forEach(i => {
      const d = formatDateKey(i.createdAt);
      if (!d) return;
      if (!matrixMap[d]) matrixMap[d] = { date: d, inquiries: 0, fintech: 0, complaints: 0, comms: 0, cases: 0, total: 0 };
      matrixMap[d].cases++;
      matrixMap[d].total++;
    });

    return Object.values(matrixMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredInquiries, filteredTTRequests, filteredTTComplaints, filteredComms, filteredCases]);

  // 3. Top inquiries Keyword / Text Power Analysis
  const calculatedTopInquiries = useMemo(() => {
    const counts: Record<string, number> = {};
    const texts = filteredInquiries.map(i => i.text || '');
    
    // Core keyword trends for general inquiries
    const customMatchWords = [
      { key: 'REFUND / PAYMENT', match: ['refund', 'money', 'payment', 'pay', 'charge', 'return', 'checkout'] },
      { key: 'BOOKING & APPT', match: ['book', 'booking', 'appointment', 'appt', 'date', 'reschedule', 'session'] },
      { key: 'ACCOUNT / PROFILE', match: ['profile', 'login', 'account', 'password', 'sign', 'user', 'access'] },
      { key: 'TABBY / TAMARA STATUS', match: ['tabby', 'tamara', 'fintech', 'api', 'split', 'install', 'installment'] },
      { key: 'FINANCE / PRICE', match: ['price', 'vat', 'tax', 'cost', 'fee', 'invoice', 'receipt'] },
      { key: 'MEDICINE & CLINIC', match: ['medicine', 'med', 'clinic', 'doctor', 'treatment', 'drug', 'prescription'] },
      { key: 'COMPLAINTS & ISSUES', match: ['complaint', 'bad', 'angry', 'issue', 'problem', 'delay', 'wait'] },
      { key: 'GENERAL ADVICE', match: ['how to', 'info', 'help', 'details', 'know', 'question'] }
    ];

    texts.forEach(t => {
      const lower = t.toLowerCase();
      let matched = false;
      customMatchWords.forEach(wordGroup => {
        if (wordGroup.match.some(keyword => lower.includes(keyword))) {
          counts[wordGroup.key] = (counts[wordGroup.key] || 0) + 1;
          matched = true;
        }
      });
      if (!matched && t.trim().length > 0) {
        counts['UNCATEGORIZED QUESTIONS'] = (counts['UNCATEGORIZED QUESTIONS'] || 0) + 1;
      }
    });

    const totalMatches = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalMatches) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredInquiries]);

  // 4. Inquiries Status Rates
  const inquiriesAnalysis = useMemo(() => {
    const total = filteredInquiries.length || 1;
    const answered = filteredInquiries.filter(i => i.status === 'answered').length;
    const pending = filteredInquiries.filter(i => i.status === 'pending').length;
    const rate = Math.round((answered / total) * 100);
    return { answered, pending, rate };
  }, [filteredInquiries]);

  // 5. Case Status Rates
  const casesAnalysis = useMemo(() => {
    const total = filteredCases.length || 1;
    const closed = filteredCases.filter(c => c.ticketStatus?.toLowerCase() === 'closed').length;
    const rest = filteredCases.length - closed;
    const rate = Math.round((closed / total) * 100);
    return { closed, rest, rate };
  }, [filteredCases]);

  // 6. Average Fintech Values
  const fintechAnalysis = useMemo(() => {
    const total = filteredTTRequests.length || 1;
    const prices = filteredTTRequests.map(r => Number(r.priceWithoutTax || 0)).filter(p => !isNaN(p));
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    return { avgPrice, maxPrice };
  }, [filteredTTRequests]);

  // 7. Top Active Agents rankings
  const agentRanking = useMemo(() => {
    const list: Record<string, number> = {};
    const countItem = (agent?: string) => {
      if (!agent) return;
      const clean = agent.trim();
      list[clean] = (list[clean] || 0) + 1;
    };
    
    filteredInquiries.forEach(i => countItem(i.agentName));
    filteredTTRequests.forEach(i => countItem(i.agentName));
    filteredTTComplaints.forEach(i => countItem(i.agentName));
    filteredComms.forEach(i => countItem(i.openedBy || i.handledBy));
    filteredCases.forEach(i => countItem(i.agentName));

    return Object.entries(list)
      .map(([name, actions]) => ({ name, actions }))
      .sort((a, b) => b.actions - a.actions)
      .slice(0, 5);
  }, [filteredInquiries, filteredTTRequests, filteredTTComplaints, filteredComms, filteredCases]);


  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-16 animate-fade-in font-sans text-slate-100 dark bg-slate-950 p-4 sm:p-8 rounded-[2.5rem] border border-slate-900 shadow-2xl relative overflow-hidden">
      
      {/* Visual background ambient flares like Google Fit app */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Primary Header with Fitbit Aesthetic */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-900 z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-teal-950 border border-teal-800 flex items-center justify-center shadow-lg transform rotate-3">
            <Flame className="w-7 h-7 text-[#00E5FF] filter drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-teal-400 bg-teal-950 border border-teal-900 px-2.5 py-0.5 rounded-full tracking-widest uppercase">
                Fitbit Metrics Active
              </span>
            </div>
            <h2 className="text-3xl font-black text-white font-display tracking-tight mt-1 flex items-center gap-2">
              {currentUser.role === 'tl' ? 'Floor Analytics Dashboard' : 'My Daily Fitness Ring'}
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {(['today', 'week', 'month', 'custom'] as const).map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  dateRange === r 
                    ? 'bg-teal-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {currentUser.role === 'tl' && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <select
                value={selectedAgent}
                onChange={e => setSelectedAgent(e.target.value)}
                className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-slate-200 cursor-pointer outline-none"
              >
                <option value="all">All Agents</option>
                {INITIAL_AGENTS.map(a => (
                  <option key={a} value={a} className="bg-slate-950">{a}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-4 py-1.5 rounded-2xl font-bold transition-colors text-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
            Export XLS
          </button>
        </div>
      </div>

      {dateRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-2xl animate-fade-in text-xs z-10 relative">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Start:</span>
            <input 
              type="date" 
              value={customStart} 
              onChange={e => setCustomStart(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-medium text-white text-xs outline-none focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">End:</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-medium text-white text-xs outline-none focus:border-teal-500"
            />
          </div>
        </div>
      )}

      {/* FIRST SECTION: Fitbit Active Rings and Stats Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* The Fitbit Circular Goal Card */}
        <div className="bg-slate-900/60 p-6 rounded-[2rem] border border-slate-900 flex flex-col items-center justify-center min-h-[280px]">
          <h3 className="w-full text-sm font-bold text-slate-400 text-left mb-4 uppercase tracking-wider flex items-center justify-between">
            <span>Active Goal Rings</span>
            <Target className="w-4 h-4 text-pink-500" />
          </h3>
          <ConcentricFitbitRings />
          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400 block font-medium">Combined Floor Engagement Index</span>
            <span className="text-xs text-[#00E5FF] font-black tracking-wide uppercase mt-0.5 block">
              {totalActions >= 50 ? '🔥 Streak Active (Goal Met!)' : '🏃‍♂️ Keep Processing Tasks'}
            </span>
          </div>
        </div>

        {/* Fitbit Quick Dashboard Cards grid (Teal, Amber, Violet, Rose) */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-900 flex flex-col justify-between hover:border-slate-850 transition-all group">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-teal-950/50 border border-teal-800 flex items-center justify-center">
                <Search className="w-4.5 h-4.5 text-[#00E5FF]" />
              </div>
              <span className="text-[10px] font-bold text-teal-400">Teal Zone</span>
            </div>
            <div className="mt-6">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Inquiries</span>
              <span className="text-2xl font-black font-mono text-white mt-1 block">{filteredInquiries.length}</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-[#00E5FF] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((filteredInquiries.length / 50) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-900 flex flex-col justify-between hover:border-slate-850 transition-all group">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-950/50 border border-amber-850 flex items-center justify-center">
                <Wallet className="w-4.5 h-4.5 text-[#FFA726]" />
              </div>
              <span className="text-[10px] font-bold text-amber-400">Amber Zone</span>
            </div>
            <div className="mt-6">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Fintech Req</span>
              <span className="text-2xl font-black font-mono text-white mt-1 block">{filteredTTRequests.length}</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-[#FFA726] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((filteredTTRequests.length / 30) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-900 flex flex-col justify-between hover:border-slate-850 transition-all group">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-950/50 border border-purple-850 flex items-center justify-center">
                <MessageSquare className="w-4.5 h-4.5 text-[#E040FB]" />
              </div>
              <span className="text-[10px] font-bold text-purple-400">Violet Zone</span>
            </div>
            <div className="mt-6">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Client Comms</span>
              <span className="text-2xl font-black font-mono text-white mt-1 block">{filteredComms.length}</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-[#E040FB] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((filteredComms.length / 30) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-900 flex flex-col justify-between hover:border-slate-850 transition-all group">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-rose-950/50 border border-rose-850 flex items-center justify-center">
                <History className="w-4.5 h-4.5 text-[#FF5252]" />
              </div>
              <span className="text-[10px] font-bold text-rose-400">Coral Zone</span>
            </div>
            <div className="mt-6">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Cases logged</span>
              <span className="text-2xl font-black font-mono text-white mt-1 block">{filteredCases.length}</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-[#FF5252] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((filteredCases.length / 35) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MATRIX SECTION: Section Per Day Matrix Layout */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-[2rem] p-6 lg:p-8 relative z-10 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Daily Operation Logs</span>
            <h3 className="text-xl font-black text-white font-display mt-0.5">Section Per Day Metric Matrix</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-2xl">
            Showing Active Counts by Calendar Day
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-950/50">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-850 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-4 px-5">Calendar Date</th>
                <th className="py-4 px-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-[#00E5FF]">
                    <span className="w-2 h-2 rounded-full bg-[#00E5FF]"></span>
                    General Inquiries
                  </span>
                </th>
                <th className="py-4 px-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-[#FFA726]">
                    <span className="w-2 h-2 rounded-full bg-[#FFA726]"></span>
                    Fintech Req
                  </span>
                </th>
                <th className="py-4 px-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    Fintech Complaints
                  </span>
                </th>
                <th className="py-4 px-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-[#E040FB]">
                    <span className="w-2 h-2 rounded-full bg-[#E040FB]"></span>
                    Client Comms
                  </span>
                </th>
                <th className="py-4 px-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-[#FF5252]">
                    <span className="w-2 h-2 rounded-full bg-[#FF5252]"></span>
                    Cases & Tickets
                  </span>
                </th>
                <th className="py-4 px-5 text-right font-black">Daily Volume</th>
              </tr>
            </thead>
            <tbody>
              {dailyMatrix.map((row, index) => (
                <tr key={index} className="border-b border-slate-900/70 hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-5 font-bold text-white flex items-center gap-2">
                    <CalIcon className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(row.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${row.inquiries > 0 ? 'bg-teal-950/80 text-[#00E5FF] border border-teal-900' : 'text-slate-600 bg-transparent'}`}>
                      {row.inquiries}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${row.fintech > 0 ? 'bg-amber-950/80 text-[#FFA726] border border-amber-900' : 'text-slate-600 bg-transparent'}`}>
                      {row.fintech}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${row.complaints > 0 ? 'bg-red-950/80 text-red-400 border border-red-900' : 'text-slate-600 bg-transparent'}`}>
                      {row.complaints}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${row.comms > 0 ? 'bg-purple-950/80 text-[#E040FB] border border-purple-900' : 'text-slate-600 bg-transparent'}`}>
                      {row.comms}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${row.cases > 0 ? 'bg-rose-950/80 text-[#FF5252] border border-rose-900' : 'text-slate-600 bg-transparent'}`}>
                      {row.cases}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right font-black font-mono text-teal-400 text-sm">
                    {row.total}
                  </td>
                </tr>
              ))}
              {dailyMatrix.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-bold">
                    No item logged in the selected calendar period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ANALYTICS SECTION: Category Keyword Analysis & Section Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Top Inquiries Analysis Frame with Fitbit-Style Energy Bars */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-[2rem] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Customer Trends</span>
                <h3 className="text-xl font-black text-white font-display mt-0.5">Top Inquiries Power Analysis</h3>
              </div>
              <BarChart3 className="w-5 h-5 text-[#00E5FF]" />
            </div>
            
            <p className="text-xs text-slate-400 mb-6 font-medium">
              We scanned the text contents of general customer inquiries to outline the highest recurring topics and question categories.
            </p>

            <div className="space-y-4">
              {calculatedTopInquiries.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-200 tracking-wide font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                      {item.name}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {item.count} counts <span className="text-teal-400">({item.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-905">
                    <div 
                      className="bg-gradient-to-r from-[#00E5FF] to-teal-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {calculatedTopInquiries.length === 0 && (
                <div className="text-center py-12 text-slate-500 font-bold text-xs">
                  No topics registered for general inquiries in this database.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Section Analysis Core Modules (Inquiries, Fintech, Complaints, Comms, Cases summaries) */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-[2rem] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Deep Intelligence</span>
                <h3 className="text-xl font-black text-white font-display mt-0.5">System Core Performance</h3>
              </div>
              <Award className="w-5 h-5 text-amber-500 animate-bounce" />
            </div>

            <p className="text-xs text-slate-400 mb-6 font-medium">
              Real-time calculations of completion and success indexes across all work sections. Select tabs to examine.
            </p>

            {/* Matrix Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(['all', 'inquiries', 'fintech', 'complaints', 'cases'] as const).map(sec => (
                <button
                  key={sec}
                  onClick={() => setActiveAnalysisSection(sec as SectionType)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    activeAnalysisSection === sec
                      ? 'bg-purple-900/60 text-purple-200 border-purple-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-slate-200'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {/* Dynamic Analysis Display based on tab */}
            <div className="space-y-4 font-mono text-xs">
              
              {(activeAnalysisSection === 'all' || activeAnalysisSection === 'inquiries') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-2">
                  <div className="font-bold text-[#00E5FF] text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CircleDot className="w-3.5 h-3.5" /> General Inquiries Health
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Filtered:</span>
                    <span className="text-white font-bold">{filteredInquiries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resolved Answered:</span>
                    <span className="text-white font-bold">{inquiriesAnalysis.answered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unresolved Pending:</span>
                    <span className="text-white font-bold">{inquiriesAnalysis.pending}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                    <span className="text-slate-400">Resolution Rate:</span>
                    <span className="text-teal-400 font-bold">{inquiriesAnalysis.rate}%</span>
                  </div>
                </div>
              )}

              {(activeAnalysisSection === 'all' || activeAnalysisSection === 'fintech') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-2">
                  <div className="font-bold text-[#FFA726] text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Fintech Activity Health
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total api links:</span>
                    <span className="text-white font-bold">{filteredTTRequests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Average Cart Price:</span>
                    <span className="text-white font-bold">{fintechAnalysis.avgPrice} EUR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Cart Price:</span>
                    <span className="text-white font-bold">{fintechAnalysis.maxPrice} EUR</span>
                  </div>
                </div>
              )}

              {(activeAnalysisSection === 'all' || activeAnalysisSection === 'complaints') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-2">
                  <div className="font-bold text-red-400 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Complaints Risk Index
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Complaints Logged:</span>
                    <span className="text-white font-bold">{filteredTTComplaints.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Escalated Priority:</span>
                    <span className="text-white font-bold">
                      {filteredTTComplaints.filter(c => c.orderStatus?.toLowerCase().includes('escalat') || c.complaintDetails?.toLowerCase().includes('bad')).length}
                    </span>
                  </div>
                </div>
              )}

              {(activeAnalysisSection === 'all' || activeAnalysisSection === 'cases') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-2">
                  <div className="font-bold text-[#FF5252] text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> CRM Case Management
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">My Cases:</span>
                    <span className="text-white font-bold">{filteredCases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed Tickets:</span>
                    <span className="text-white font-bold">{casesAnalysis.closed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Open Tickets:</span>
                    <span className="text-white font-bold">{casesAnalysis.rest}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                    <span className="text-slate-400">Fulfillment Ratio:</span>
                    <span className="text-rose-400 font-bold">{casesAnalysis.rate}%</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* DETAILED SECTION: Top Active Agents and Full Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

        {/* Top Active Agents Column */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-[2rem] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white font-display">Top Active Operators</h3>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {agentRanking.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black text-[#00E5FF]">
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium font-mono">{item.actions} engagements</span>
                    </div>
                  </div>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              ))}
              {agentRanking.length === 0 && (
                <div className="text-center py-8 text-slate-500 font-bold text-xs">
                  No active operator engagements registered.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Engagement Stream */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 p-6 rounded-[2rem] flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white font-display">Live Operations Engagement Stream</h3>
              <CircleDot className="w-4 h-4 text-emerald-500 animate-ping" />
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {[
                ...filteredInquiries.map(i => ({ type: 'Inquiry', date: i.createdAt, desc: i.text || 'No text', status: i.status })),
                ...filteredTTRequests.map(i => ({ type: 'Fintech Request', date: i.createdAt, desc: `Price: ${i.priceWithoutTax || 0}`, status: i.status })),
                ...filteredTTComplaints.map(i => ({ type: 'Complaint', date: i.createdAt, desc: i.complaintDetails || 'Complaint logged', status: 'escalated' })),
                ...filteredComms.map(i => ({ type: 'Client Comms', date: i.createdAt, desc: i.notes || 'Comms request', status: i.status })),
                ...filteredCases.map(i => ({ type: 'CRM Ticket', date: i.createdAt, desc: i.inquiry || 'Ticket processed', status: i.ticketStatus || 'Closed' })),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((act, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      act.type === 'Inquiry' ? 'bg-[#00E5FF]' :
                      act.type === 'Fintech Request' ? 'bg-[#FFA726]' :
                      act.type === 'Complaint' ? 'bg-red-400' :
                      act.type === 'Client Comms' ? 'bg-[#E040FB]' :
                      'bg-[#FF5252]'
                    }`}></span>
                    <div>
                      <span className="font-bold text-slate-100 block">{act.type}</span>
                      <span className="text-[10px] text-slate-500 truncate block max-w-[200px] sm:max-w-md">{act.desc}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold font-mono">
                    {new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
              {totalActions === 0 && (
                <div className="text-center py-12 text-slate-500 font-bold text-xs">
                  No engagement tasks mapped in current window.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
