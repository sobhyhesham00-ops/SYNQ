import React, { useMemo } from "react";
import { 
  PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from "recharts";
import { Activity, PieChart, FileText, TrendingUp } from "lucide-react";
import { SchedulingRequest, TimeLog, Inquiry, TabbyTamaraRequest, TabbyTamaraComplaint } from "../types";

interface SystemAnalyticsTabProps {
  timeLogs: TimeLog[];
  requests: SchedulingRequest[];
  inquiries: Inquiry[];
  ttRequests: TabbyTamaraRequest[];
  ttComplaints: TabbyTamaraComplaint[];
}

export const SystemAnalyticsTab: React.FC<SystemAnalyticsTabProps> = ({
  timeLogs,
  requests,
  inquiries,
  ttRequests,
  ttComplaints,
}) => {
  const attendanceData = useMemo(() => {
    return [
      { name: "Working", value: timeLogs.filter((t) => t.status === "working").length, color: "#6366f1" },
      { name: "Breaks/Rest", value: timeLogs.filter((t) => t.status === "break" || t.status === "restroom").length, color: "#f59e0b" },
      { name: "Lunch", value: timeLogs.filter((t) => t.status === "lunch").length, color: "#ec4899" },
      { name: "Offline", value: timeLogs.filter((t) => t.status === "clocked_out").length, color: "#64748b" }
    ];
  }, [timeLogs]);

  const requestsData = useMemo(() => {
    return [
      { name: "Shift Swaps", value: requests.filter(r => r.type === "swap").length, color: "#3b82f6" },
      { name: "Annual Leaves", value: requests.filter(r => r.type === "annual").length, color: "#8b5cf6" }
    ];
  }, [requests]);

  const inquiriesData = useMemo(() => {
    const statuses = ["submitted", "sent", "answered"];
    return statuses.map(st => ({
      name: st === "submitted" ? "Pending TL" : st === "sent" ? "Under Review" : "Answered",
      value: inquiries.filter(i => i.status === st).length,
      color: st === "submitted" ? "#f59e0b" : st === "sent" ? "#3b82f6" : "#10b981"
    }));
  }, [inquiries]);

  const complaintsTtData = useMemo(() => {
    return [
      { name: "Completed TT", value: ttRequests.filter(r => r.status === "confirmed").length, color: "#10b981" },
      { name: "Pending TT", value: ttRequests.filter(r => r.status !== "confirmed" && r.status !== "rejected").length, color: "#f59e0b" },
      { name: "Closed Complaints", value: ttComplaints.filter(c => c.status === "closed").length, color: "#0ea5e9" },
      { name: "Pending Complaints", value: ttComplaints.filter(c => c.status !== "closed").length, color: "#ef4444" }
    ];
  }, [ttRequests, ttComplaints]);

  // Aggregate daily counts for area chart: inquiries + TT + complaints created per day
  const dailyTrendsData = useMemo(() => {
    const countsByDate: Record<string, { date: string, inquiries: number, tt: number, complaints: number }> = {};
    const processDate = (iso: string, key: 'inquiries' | 'tt' | 'complaints') => {
      if(!iso) return;
      const d = iso.split('T')[0];
      if(!countsByDate[d]) countsByDate[d] = { date: d, inquiries: 0, tt: 0, complaints: 0 };
      countsByDate[d][key] += 1;
    };
    
    inquiries.forEach(i => processDate(i.createdAt, 'inquiries'));
    ttRequests.forEach(r => processDate(r.createdAt, 'tt'));
    ttComplaints.forEach(c => processDate(c.createdAt, 'complaints'));

    return Object.values(countsByDate).sort((a,b) => a.date.localeCompare(b.date));
  }, [inquiries, ttRequests, ttComplaints]);

  return (
    <div className="space-y-6 animate-fade-in mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Attendance Interactive Chart */}
        <div className="bg-white/5 border border-white/8 p-5 rounded-xl flex flex-col h-80">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Live Attendance
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <RechartsPieChart>
              <Pie
                data={attendanceData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {attendanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Requests & Swaps Interactive Chart */}
        <div className="bg-white/5 border border-white/8 p-5 rounded-xl flex flex-col h-80">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            Roster Requests
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <RechartsPieChart>
              <Pie
                data={requestsData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {requestsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* General Inquiries Chart */}
        <div className="bg-white/5 border border-white/8 p-5 rounded-xl flex flex-col h-80">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            General Inquiries Status
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={inquiriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9', fontSize: 12 }}
                cursor={{fill: '#334155', opacity: 0.4}}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {inquiriesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabby/Tamara & Complaints Chart */}
        <div className="bg-white/5 border border-white/8 p-5 rounded-xl flex flex-col h-80">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Complaints / Payments
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={complaintsTtData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9', fontSize: 12 }}
                cursor={{fill: '#334155', opacity: 0.4}}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {complaintsTtData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aggregate Daily Creation Trend */}
      <div className="bg-white/5 border border-white/8 p-5 rounded-xl h-96">
        <h3 className="text-sm font-bold text-slate-100 mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          General Inquiries, Tabby/Tamara, And Complaints Creation Volume (Daily Trends)
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={dailyTrendsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInquiries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
              itemStyle={{ color: '#f1f5f9', fontSize: 12 }}
            />
            <Legend verticalAlign="top" height={36} />
            <Area type="monotone" dataKey="inquiries" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInquiries)" name="General Inquiries" />
            <Area type="monotone" dataKey="tt" stroke="#10b981" fillOpacity={1} fill="url(#colorTt)" name="Tabby/Tamara Requests" />
            <Area type="monotone" dataKey="complaints" stroke="#f43f5e" fillOpacity={1} fill="url(#colorComplaints)" name="Complaints" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

