import React, { useState, useMemo } from 'react';
import { SchedulingRequest, SwapRequest, AnnualRequest } from '../types';
import { Download, Calendar, Filter, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SchedulingReportsProps {
  requests: SchedulingRequest[];
}

type ReportType = 'swaps' | 'annual_leave';
type TimePeriod = 'day' | 'week' | 'month' | 'year';

export function SchedulingReports({ requests }: SchedulingReportsProps) {
  const [reportType, setReportType] = useState<ReportType>('swaps');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Helper date functions
  const filterByDateRange = (itemDate: string) => {
    if (!itemDate) return false;
    const date = new Date(itemDate);
    const target = new Date(selectedDate);
    
    // Normalize target date to start of day
    target.setHours(0, 0, 0, 0);
    const dateNormalized = new Date(date);
    dateNormalized.setHours(0, 0, 0, 0);
    
    if (timePeriod === 'day') {
      return dateNormalized.getTime() === target.getTime();
    } else if (timePeriod === 'week') {
      const startOfWeek = new Date(target);
      startOfWeek.setDate(target.getDate() - target.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return date >= startOfWeek && date <= endOfWeek;
    } else if (timePeriod === 'month') {
      return date.getMonth() === target.getMonth() && date.getFullYear() === target.getFullYear();
    } else if (timePeriod === 'year') {
      return date.getFullYear() === target.getFullYear();
    }
    return true;
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const typeMatches = reportType === 'swaps' ? req.type === 'swap' : req.type === 'annual';
      
      const targetDate = req.type === 'swap' ? req.date : req.startDate;
      const dateMatches = filterByDateRange(targetDate || req.createdAt);

      return typeMatches && dateMatches;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, reportType, timePeriod, selectedDate]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const dataToExport = filteredRequests.map(req => {
      if (req.type === 'swap') {
        const swapReq = req as SwapRequest;
        return {
          ID: swapReq.id,
          'Agent Name': swapReq.agentName,
          Date: swapReq.date,
          'Original Shift': swapReq.shift,
          'Swap With Agent': swapReq.swapWithAgent,
          'Swap With Shift': swapReq.swapWithShift,
          Status: swapReq.status.replace(/_/g, ' '),
          'Requested At': new Date(swapReq.createdAt).toLocaleString(),
          'Action By': swapReq.actionBy || '',
          'Action At': swapReq.actionAt ? new Date(swapReq.actionAt).toLocaleString() : '',
          Notes: swapReq.notes || ''
        };
      } else {
        const annualReq = req as AnnualRequest;
        return {
          ID: annualReq.id,
          'Agent Name': annualReq.agentName,
          'Start Date': annualReq.startDate,
          'End Date': annualReq.endDate,
          Status: annualReq.status.replace(/_/g, ' '),
          'Requested At': new Date(annualReq.createdAt).toLocaleString(),
          'Action By': annualReq.actionBy || '',
          'Action At': annualReq.actionAt ? new Date(annualReq.actionAt).toLocaleString() : '',
          Notes: annualReq.notes || ''
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, worksheet, reportType === 'swaps' ? 'Shift Swaps' : 'Annual Leaves');
    XLSX.writeFile(wb, `Scheduling_Report_${reportType}_${timePeriod}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> Approved</span>;
      case 'declined': return <span className="bg-rose-500/20 text-rose-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-max"><XCircle className="w-3 h-3"/> Declined</span>;
      case 'declined_by_partner': return <span className="bg-rose-500/20 text-rose-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-max"><XCircle className="w-3 h-3"/> Partner Declined</span>;
      case 'pending_partner': return <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Wait Partner</span>;
      default: return <span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Wait TL</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-700/20 backdrop-blur-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-black text-white font-display flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-400" />
            Scheduling Reports
          </h2>
          <p className="text-sm text-slate-400 mt-1">Generate reports on shift swaps and annual leaves.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportToExcel}
            disabled={filteredRequests.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-700/20 backdrop-blur-sm self-start">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-4 h-4" /> Report Type
            </label>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setReportType('swaps')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide ${reportType === 'swaps' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              >
                Shift Swaps
              </button>
              <button
                onClick={() => setReportType('annual_leave')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide ${reportType === 'annual_leave' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              >
                Annual Leave
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Time Period
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['day', 'week', 'month', 'year'] as TimePeriod[]).map(pd => (
                <button
                  key={pd}
                  onClick={() => setTimePeriod(pd)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${timePeriod === pd ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'}`}
                >
                  {pd}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base Date focus</label>
            <input 
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-200 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          
          <div className="mt-6 p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-2">Query Summary</p>
            <p className="text-sm text-slate-300">Found <strong className="text-white bg-indigo-500/20 px-2 flex-inline items-center py-0.5 rounded-md mx-1 shadow-sm">{filteredRequests.length}</strong> matching records for the selected {timePeriod}.</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900/50 rounded-3xl border border-slate-700/20 backdrop-blur-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-950/80 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Agent Name</th>
                  {reportType === 'swaps' ? (
                    <>
                      <th className="px-6 py-5">Shift Date</th>
                      <th className="px-6 py-5">Swap Details</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-5">Start Date</th>
                      <th className="px-6 py-5">End Date</th>
                    </>
                  )}
                  <th className="px-6 py-5">Requested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-6 py-4 font-bold text-white">{req.agentName}</td>
                    {req.type === 'swap' ? (
                      <>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{req.date}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          <div className="flex flex-col gap-1">
                            <span>Has: <strong className="text-slate-200">{req.shift}</strong></span>
                            <span>With: <strong className="text-slate-200">{req.swapWithAgent}</strong> <span className="text-slate-500">({req.swapWithShift})</span></span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{req.startDate}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{req.endDate}</td>
                      </>
                    )}
                    <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">
                      {new Date(req.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                      })}
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3 opacity-50">
                        <FileText className="w-10 h-10 text-slate-500" />
                        <p className="font-bold text-sm tracking-wide">No records found matching criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
