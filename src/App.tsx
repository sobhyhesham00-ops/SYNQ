import { ScheduleUpload } from './components/ScheduleUpload';
import * as mammoth from 'mammoth';
import React, { useState, useEffect, FormEvent, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot as firestoreOnSnapshot, collection, setDoc, updateDoc, deleteDoc, query, getDocs, writeBatch, disableNetwork, where, orderBy } from 'firebase/firestore';
import { db, initAuth, googleSignIn, getAccessToken, logout } from './firebase';


// Intercept removed
const onSnapshot = firestoreOnSnapshot;
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  LogOut,
  Clock,
  ClipboardList,
  Shield,
  FileText,
  UserCheck,
  User as UserIcon,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Info,
  ChevronRight,
  UserPlus,
  Upload,
  Coffee,
  Utensils,
  Printer,
  Search,
  MessageSquare,
  MessageCircle,
  HelpCircle,
  Send,
  ImageIcon,
  Link,
  Trash2,
  Paperclip,
  ExternalLink,
  Bell,
  Activity,
  PieChart,
  BarChart2,
  GitPullRequest,
  LayoutDashboard,
  Wallet,
  PhoneCall,
  History,
  ShieldCheck,
  FileSpreadsheet,
  File,
  FileImage,
  FileAudio,
  FileVideo,
  FileCode,
  BookOpen,
  FileArchive,
  Copy,
  Lock,
  Sparkles,
  Sun,
  Cloudy,
  Cloud,
  Phone,
  Mail,
  Sliders,
  X,
  ShoppingBag,
  Book,
  Tag,
  Eye,
  EyeOff,
  Calculator,
  Edit,
  Pencil
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { AIChatWidget } from './AIChatWidget';
import { ErrorBoundary } from './ErrorBoundary';
import { MessagingSystem } from './components/MessagingSystem';
import { DataVault } from './components/DataVault';
import { IntegrationsManager } from './components/IntegrationsManager';
import { SuperAdminControl } from './components/SuperAdminControl';
import { ScreenshotUpload } from './components/ScreenshotUpload';
import { MultiAttachmentUpload } from './components/MultiAttachmentUpload';
import { AttachmentsDisplay } from './components/AttachmentsDisplay';
import { DashboardSummary } from './components/DashboardSummary';
import { QAScorecards } from './components/QAScorecards';
import { PatientSearchHub } from './components/PatientSearchHub';
import { AnnouncementsTab } from './components/AnnouncementsTab';
import { OrdersTab } from './components/OrdersTab';
import { ArticleManager } from './components/ArticleManager';
import { RequestReplyThread } from './components/RequestReplyThread';
import * as XLSX from 'xlsx';
import {
  isTLName,
  isQAName,
  capitalizeName,
  getStorageItem,
  setStorageItem,
  validateSwapRequest,
  validateAnnualRequest,
  getInitialRequests,
  generateCSV,
  generateTextReport,
  formatDateNice,
  getInitialSchedules,
  parseScheduleCSV,
  evaluateKpiFormula,
  parseAgentDirectoryCSV,
  generateScheduleTemplateFile,
  getAgentLOB,
  getAgentTL,
  getAgentMeta,
  generateInquiriesCSV,
  generateTimeLogsCSV,
  formatAgentName,
  generateFintechRequestsCSV,
  generateFintechComplaintsCSV,
  generateClientCommsCSV,
  generateCasesCSV,
  generateSchedulesCSV,
  getLocalISOString,
  getLocalTimeZone,
  normalizeName,
  getUsernameFromFullName,
  findAgentByUsername,
  compressImage
} from './utils';
import {
  SchedulingRequest,
  SwapRequest,
  AnnualRequest,
  TEAM_LEADERS,
  INITIAL_AGENTS,
  SHIFTS,
  User,
  Role,
  ScheduledShift,
  TimeLog,
  ActivityRecord,
  AGENT_LOBS,
  TodoItem, Inquiry,
  TabbyTamaraRequest,
  TabbyTamaraComplaint,
  ClientCommunicationRequest,
  CaseRecord,
  AgentDirectoryRow,
  SystemNotification,
  TlFeedback,
  FeedbackReply,
  QAScore,
  Announcement,
  Order
} from './types';

const STORAGE_KEYS = {
  schedules: 'synq_schedules',
  knowledgeBase: 'synq_knowledge_base'
};

function readStoredJson<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

const parseBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-indigo-300">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderMarkdownText = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-left text-sm text-slate-100 leading-relaxed font-sans mt-3">
      {lines.map((line, idx) => {
        // Heading 3
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-bold text-slate-100 mt-4 border-l-2 border-indigo-500 pl-2">{line.replace('### ', '')}</h4>;
        }
        // Heading 2
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-black text-transparent bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text mt-5">{line.replace('## ', '')}</h3>;
        }
        // Heading 1
        if (line.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-black text-slate-100 mt-6">{line.replace('# ', '')}</h2>;
        }
        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const stripped = line.replace(/^\s*[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 ml-4 my-1.5" style={{ minWidth: 0 }}>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0 animate-pulse" />
              <p className="text-slate-200 text-xs flex-1">
                {parseBoldText(stripped)}
              </p>
            </div>
          );
        }
        // General text
        if (line.trim().length > 0) {
          return <p key={idx} className="text-slate-300 text-xs my-1">{parseBoldText(line)}</p>;
        }
        return <div key={idx} className="h-1" />;
      })}
    </div>
  );
};

async function fetchGoogleSheetCSV(sheetId: string, gid: string = '0'): Promise<string> {
  const urlsToTry = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&gid=${gid}`
  ];
  let lastError: Error | null = null;

  // 1. Try directly first
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0 && !text.includes('<!DOCTYPE html>')) {
          return text;
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  // 2. If direct fetches fail, try via CORS proxy
  for (const url of urlsToTry) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0 && !text.includes('<!DOCTYPE html>')) {
          return text;
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error("Access Denied or Sheet not found. Please make sure the Google Sheet share settings are set to 'Anyone with the link can view'.");
}

const getClinicBadgeColor = (clinic: string) => {
  if (!clinic) return 'bg-white/5 text-slate-300 border-white/10';
  const lp = clinic.toLowerCase();
  if (lp.includes('dermadent')) return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  if (lp.includes('onetouch')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (lp.includes('welltouch')) return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
  if (lp.includes('newedge')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  return 'bg-white/5 text-slate-300 border-white/10';
};

const CoolLogo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className}`}
    >
      <style>{`
        @keyframes logo-slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes logo-counter-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes logo-neon-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 2px rgba(0, 245, 255, 0.6)) drop-shadow(0 0 6px rgba(0, 102, 255, 0.4));
            opacity: 0.9;
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.95)) drop-shadow(0 0 18px rgba(255, 0, 60, 0.8));
            opacity: 1;
          }
        }
        @keyframes logo-scale-breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes logo-shimmer-sweep {
          0% {
            transform: translate(-100px, -100px);
          }
          30% {
            transform: translate(100px, 100px);
          }
          100% {
            transform: translate(100px, 100px);
          }
        }
        .logo-spin-outer {
          transform-origin: 50px 50px;
          animation: logo-slow-spin 12s linear infinite;
        }
        .logo-spin-inner {
          transform-origin: 50px 50px;
          animation: logo-counter-spin 18s linear infinite;
        }
        .logo-core {
          transform-origin: 50px 50px;
          animation: logo-neon-pulse 3s ease-in-out infinite, logo-scale-breathe 4s ease-in-out infinite;
        }
        .logo-shimmer {
          animation: logo-shimmer-sweep 3.5s infinite linear;
        }
      `}</style>

      {/* Orbiting Ring - Dash Outer */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        stroke="url(#logo-cyan-blue)" 
        strokeWidth="2" 
        strokeDasharray="15 30 5 10 30 10" 
        strokeLinecap="round"
        className="logo-spin-outer"
      />

      {/* Orbiting Ring - Dash Inner */}
      <circle 
        cx="50" 
        cy="50" 
        r="39" 
        stroke="url(#logo-red-blue)" 
        strokeWidth="1.2" 
        strokeDasharray="6 12 18 12" 
        strokeLinecap="round"
        opacity="0.75"
        className="logo-spin-inner"
      />

      {/* Core Sharp Shield and Logo S Shape */}
      <g className="logo-core" clipPath="url(#logo-shield-clip-outer)">
        {/* Sharp Shield Background */}
        <polygon 
          points="50,16 78,30 78,70 50,84 22,70 22,30" 
          fill="#0a0a0f" 
          stroke="url(#logo-cyan-blue)" 
          strokeWidth="2.5" 
        />

        {/* Sharp Red Glow Edging Decorating the Sides */}
        <polyline 
          points="22,35 22,30 50,16 78,30 78,35" 
          stroke="#ff003c" 
          strokeWidth="3.5" 
          strokeLinecap="round"
          opacity="0.8"
        />
        <polyline 
          points="22,65 22,70 50,84 78,70 78,65" 
          stroke="#ff003c" 
          strokeWidth="3.5" 
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Interlocking Sharp "S" cuts */}
        {/* Upper Facet */}
        <path 
          d="M 32,34 H 68 L 58,46 H 44 L 52,53 H 32 Z" 
          fill="url(#logo-cyan-blue)" 
        />
        {/* Lower Facet */}
        <path 
          d="M 68,66 H 32 L 42,54 H 56 L 48,47 H 68 Z" 
          fill="url(#logo-red-blue)" 
        />

        {/* Neon Center Dot */}
        <polygon 
          points="50,47 54,50 50,53 46,50" 
          fill="#00f5ff" 
          filter="url(#logo-glow)" 
        />

        {/* Shimmer Shine Sweep Layer */}
        <g clipPath="url(#logo-shield-clip-inner)">
          <rect 
            x="-100" 
            y="-100" 
            width="300" 
            height="300" 
            fill="url(#logo-shimmer-grad)" 
            className="logo-shimmer" 
            style={{ mixBlendMode: 'overlay' }}
          />
        </g>
      </g>

      <defs>
        {/* Shimmer Linear Gradient */}
        <linearGradient id="logo-shimmer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
          <stop offset="35%" stopColor="rgba(255, 255, 255, 0)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.85)" />
          <stop offset="65%" stopColor="rgba(255, 255, 255, 0)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </linearGradient>

        {/* Cyan to Electric Blue Gradient */}
        <linearGradient id="logo-cyan-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f5ff" />
          <stop offset="100%" stopColor="#0066ff" />
        </linearGradient>

        {/* Accent Red to Electric Blue Gradient */}
        <linearGradient id="logo-red-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff003c" />
          <stop offset="100%" stopColor="#0066ff" />
        </linearGradient>

        {/* Simple inline neon filter */}
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Shield outline clips to contain shimmer */}
        <clipPath id="logo-shield-clip-outer">
          <rect x="0" y="0" width="100" height="100" />
        </clipPath>
        <clipPath id="logo-shield-clip-inner">
          <polygon points="50,18 76,31 76,69 50,82 24,69 24,31" />
        </clipPath>
      </defs>
    </svg>
  );
};

const MOTIVATIONAL_QUOTES = [
  "Consistency is the key to unlocking shift efficiency and delivering elite patient care.",
  "Every inquiry you resolve correctly is a direct step towards seamless clinic synchronization.",
  "Energy and persistence conquer all things. Let's make today exceptionally productive!",
  "Your dedication keeps our clinic network running seamlessly. Thank you for your amazing energy!",
  "Synchronization means working together with precision and empathy. Let's crush today's metrics!",
  "Great customer service is not a transaction, it's a connection. Synchronize your focus today!",
  "Make today another masterpiece of collaboration and high compliance!",
  "The only way to do great work is to love what you do and coordinate beautifully."
];

const getGreetingAndQuote = (userName: string, currentTime: Date) => {
  const hr = currentTime.getHours();
  let greet = "Good Morning";
  if (hr >= 12 && hr < 17) greet = "Good Afternoon";
  else if (hr >= 17) greet = "Good Evening";
  
  // Pick deterministic quote based on name length + day of month
  const quoteIndex = (userName.length + currentTime.getDate()) % MOTIVATIONAL_QUOTES.length;
  const quote = MOTIVATIONAL_QUOTES[quoteIndex];
  
  return { greet, quote };
};

const CURRENT_APP_VERSION = 3; // Increment this to trigger auto-reload across all clients

const ActiveTimer = ({ startTime }: { startTime: string }) => {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!startTime) return;
    const update = () => {
      const ms = Date.now() - new Date(startTime).getTime();
      if (ms < 0) { setElapsed('0m 0s'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setElapsed(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return <span className="font-mono tabular-nums">{elapsed}</span>;
};

export default function App() {
  // Current local time context of the user's PC (synced and showing in the main page)
  const [systemTime, setSystemTime] = useState<Date>(new Date());
  const [isAppKilled, setIsAppKilled] = useState<boolean>(false);
  const [killSwitchPassword, setKillSwitchPassword] = useState<string>('');
  const [showKillSwitchPassword, setShowKillSwitchPassword] = useState<boolean>(false);
  const [killSwitchCar, setKillSwitchCar] = useState<string>('');

  // Live clock state for real-time timers (updates once a second)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Edit within 5 minutes State & helpers
  const [editingItem, setEditingItem] = useState<{
    type: 'inquiry' | 'scheduling_request' | 'tt_request' | 'tt_complaint' | 'client_comm' | 'case';
    id: string;
    data: any;
  } | null>(null);

  const isWithinFiveMinutes = (createdAt: string | number | Date) => {
    if (!createdAt) return false;
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return false;
    const diffMs = Date.now() - createdTime;
    return diffMs >= 0 && diffMs < 5 * 60 * 1000;
  };

  const getRemainingEditTimeStr = (createdAt: string | number | Date) => {
    if (!createdAt) return '';
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return '';
    const diffMs = (5 * 60 * 1000) - (Date.now() - createdTime);
    if (diffMs <= 0) return 'Expired';
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s left`;
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const { type, id, data } = editingItem;

    if (!isWithinFiveMinutes(data.createdAt)) {
      toast.error("This entry can't be edited anymore because the 5-minute time limit has expired.");
      setEditingItem(null);
      return;
    }

    try {
      if (type === 'inquiry') {
        const docRef = doc(db, 'inquiries', id);
        await setDoc(docRef, data, { merge: true });
        toast.success("Inquiry updated successfully!");
      } else if (type === 'scheduling_request') {
        const docRef = doc(db, 'scheduling_requests', id);
        await setDoc(docRef, data, { merge: true });
        toast.success("Scheduling request updated successfully!");
      } else if (type === 'tt_request') {
        const docRef = doc(db, 'tt_requests', id);
        await setDoc(docRef, data, { merge: true });
        toast.success("Installment request updated successfully!");
      } else if (type === 'tt_complaint') {
        const docRef = doc(db, 'tt_complaints', id);
        await setDoc(docRef, data, { merge: true });
        toast.success("Installment complaint updated successfully!");
      } else if (type === 'client_comm') {
        const docRef = doc(db, 'client_comms', id);
        await setDoc(docRef, data, { merge: true });
        toast.success("Communication request updated successfully!");
      } else if (type === 'case') {
        const docRef = doc(db, 'cases', id);
        await setDoc(docRef, data, { merge: true });
        toast.success("Case record updated successfully!");
      }
      setEditingItem(null);
    } catch (error) {
      console.error("Error editing item:", error);
      toast.error("Failed to update item.");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setSystemTime(now);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const cached = localStorage.getItem('sched_ramadan_weather_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
            setRamadanTemp(parsed.temp);
            setRamadanWeatherCode(parsed.code);
            return;
          }
        }

        const res = await fetch('/api/weather?lat=30.30&lng=31.75');
        const data = await res.json();
        if (data && data.current_weather) {
          const temp = data.current_weather.temperature;
          const code = data.current_weather.weathercode;
          setRamadanTemp(temp);
          setRamadanWeatherCode(code);
          localStorage.setItem('sched_ramadan_weather_cache', JSON.stringify({
            timestamp: Date.now(),
            temp,
            code
          }));
        }
      } catch (e) {
        // Silently fall back to default weather values to prevent console spam
        const hr = new Date().getHours();
        let fallbackTemp = 28;
        if (hr >= 11 && hr <= 16) fallbackTemp = 32;
        else if (hr >= 17 && hr <= 20) fallbackTemp = 29;
        else if (hr >= 21 || hr <= 5) fallbackTemp = 23;
        else fallbackTemp = 25;
        setRamadanTemp(fallbackTemp);
        setRamadanWeatherCode(0);
      }
    };

    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setNeedsGoogleAuth(false);
      },
      () => setNeedsGoogleAuth(true)
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingInGoogle(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleToken(result.accessToken);
        setGoogleUser(result.user);
        setNeedsGoogleAuth(false);
        toast.success("Successfully logged in with Google!");
      }
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request') {
        toast.error("Sign-in popup was closed before completion. Please try again.");
      } else {
        toast.error('Google login failed.');
      }
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGoogleToken(null);
    setGoogleUser(null);
    setNeedsGoogleAuth(true);
    toast.success("Logged out from Google.");
  };

  // Standard standalone offline compliant sync listener for multiple tabs and real-time Firestore
  useEffect(() => {
    // 0. Auto-unlock explicitly incorrect admins to fix legacy locking bugs
    try {
      const getCreds = localStorage.getItem('sched_locked_accounts');
      if (getCreds) {
        let arr = JSON.parse(getCreds) as string[];
        const filtered = arr.filter(name => !name.includes('amira.hassan') && !name.includes('hesham.sobhy') && !name.includes('hesso.sobhy'));
        if (filtered.length !== arr.length) {
          localStorage.setItem('sched_locked_accounts', JSON.stringify(filtered));
          setDoc(doc(db, "system", "sched_locked_accounts"), { data: filtered }).catch(e => console.error(e));
        }
      }
    } catch(e) {}

    // 1. Local storage event listener (for legacy/offline tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sched_inquiries' && e.newValue) setInquiries(JSON.parse(e.newValue));
      if (e.key === 'sched_tabby_tamara' && e.newValue) setTabbyTamaraRequests(JSON.parse(e.newValue));
      if (e.key === 'sched_tt_complaints' && e.newValue) setTabbyTamaraComplaints(JSON.parse(e.newValue));
      if (e.key === 'sched_requests' && e.newValue) setRequests(JSON.parse(e.newValue));
      if (e.key === 'sched_time_logs' && e.newValue) setTimeLogs(JSON.parse(e.newValue));
      if (e.key === 'sched_support_assignments' && e.newValue) setSupportAssignments(JSON.parse(e.newValue));
      if (e.key === 'sched_announcements' && e.newValue) setAnnouncements(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorage);

    // 2. Real-time Firestore Sync via Collections!
    const unsubInquiries = onSnapshot(collection(db, "inquiries"), snap => {
      const arr = snap.docs.map(d => d.data() as Inquiry);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setInquiries(arr);
      localStorage.setItem('sched_inquiries', JSON.stringify(arr));
    });

    const unsubQa = onSnapshot(collection(db, "qa_scores"), snap => {
      const arr = snap.docs.map(d => d.data() as QAScore);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setQaScores(arr);
      localStorage.setItem('sched_qa_scores', JSON.stringify(arr));
    });

    const unsubQATemplate = onSnapshot(doc(db, "system", "sched_qa_template"), snap => {
      if (snap.exists()) {
        const data = snap.data().data;
        setQaTemplate(data);
        localStorage.setItem('sched_qa_template', JSON.stringify(data));
      }
    });
    const unsubTT = onSnapshot(collection(db, "tt_requests"), snap => {
      const arr = snap.docs.map(d => d.data() as TabbyTamaraRequest);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTabbyTamaraRequests(arr);
      localStorage.setItem('sched_tabby_tamara', JSON.stringify(arr));
    });
    const unsubComp = onSnapshot(collection(db, "tt_complaints"), snap => {
      const arr = snap.docs.map(d => d.data() as TabbyTamaraComplaint);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTabbyTamaraComplaints(arr);
      localStorage.setItem('sched_tt_complaints', JSON.stringify(arr));
    });
    const unsubComms = onSnapshot(collection(db, "client_comms"), snap => {
      const arr = snap.docs.map(d => d.data() as ClientCommunicationRequest);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setClientComms(arr);
      localStorage.setItem('sched_client_comms', JSON.stringify(arr));
    });
    const unsubReq = onSnapshot(collection(db, "scheduling_requests"), snap => {
      const arr = snap.docs.map(d => d.data() as SchedulingRequest);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRequests(arr);
      localStorage.setItem('sched_requests', JSON.stringify(arr));
    });
    const unsubTime = onSnapshot(collection(db, "timelogs"), snap => {
      console.log('Got timelogs snapshot, docs =', snap.size);
      const arr = snap.docs.map(d => d.data() as TimeLog);
      arr.sort((a, b) => {
        const d1 = a.date ? new Date(a.date).getTime() : 0;
        const d2 = b.date ? new Date(b.date).getTime() : 0;
        const dateDiff = (isNaN(d2) ? 0 : d2) - (isNaN(d1) ? 0 : d1);
        if (dateDiff !== 0) return dateDiff;
        const tsA = parseInt((a.id || '').split('_')[1] || '0', 10);
        const tsB = parseInt((b.id || '').split('_')[1] || '0', 10);
        if (!isNaN(tsA) && !isNaN(tsB)) {
          return tsB - tsA;
        }
        return (b.id || '').localeCompare(a.id || '');
      });
      setTimeLogs(arr);
      localStorage.setItem('sched_time_logs', JSON.stringify(arr));
    }, error => { if (error && error.code === 'resource-exhausted') return; 
      console.error('TimeLogs Sync Error:', error);
      toast.error('Sync error on timelogs. They may not appear updated.');
    });
    const unsubSched = () => {};
    let isAnnouncementsInitialized = false;
    const unsubAnnouncements = onSnapshot(collection(db, "announcements"), snap => {
      console.log('Got announcement snapshot, document size:', snap.size);
      const arr = snap.docs.map(d => d.data() as Announcement);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      const latest = arr[0];
      if (latest && currentUserRef.current) {
// I am keeping the original logic below ...
        if (!isAnnouncementsInitialized) {
          isAnnouncementsInitialized = true;
          localStorage.setItem('sched_last_notified_announcement_id', latest.id);
        } else {
          const lastNotifiedId = localStorage.getItem('sched_last_notified_announcement_id');
          if (lastNotifiedId !== latest.id) {
            localStorage.setItem('sched_last_notified_announcement_id', latest.id);
            toast.custom((t) => (
              <div className="bg-slate-900/95 border border-amber-500/40 text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-2 max-w-sm border-l-4 border-l-amber-500 backdrop-blur-md animate-fade-in text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
                    <Bell className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-amber-400">📢 New Broadcast Posted!</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">By {latest.author || "System"}</p>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed italic">"{latest.message}"</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setActiveTab('tl-announcements');
                      toast.dismiss(t);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all shrink-0"
                  >
                    Read Now
                  </button>
                  <button 
                    onClick={() => toast.dismiss(t)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-slate-900/40/15 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ), { duration: 15000 });
          }
        }
      }

      setAnnouncements(arr);
      localStorage.setItem('sched_announcements', JSON.stringify(arr));
    }, error => { if (error && error.code === 'resource-exhausted') return; 
      console.error('Error in announcements snapshot listener:', error);
      toast.error('Announcement sync issue. Please refresh if updates do not appear.');
    });
    const unsubAppStatus = onSnapshot(doc(db, "system", "app_status"), snap => {
      if (snap.exists() && snap.data().isKilled === true) {
        setIsAppKilled(true);
      } else {
        setIsAppKilled(false);
      }
    });

    const unsubSupp = onSnapshot(doc(db, "system", "sched_support_assignments"), snap => {
      if (snap.exists()) {
        const data = snap.data().data;
        setSupportAssignments(data);
        localStorage.setItem('sched_support_assignments', JSON.stringify(data));
      }
    });
    const unsubCases = onSnapshot(collection(db, "cases"), snap => {
      const arr = snap.docs.map(d => d.data() as CaseRecord);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setCases(arr);
      localStorage.setItem('sched_cases', JSON.stringify(arr));
    });
    const unsubOrders = () => {};
    const unsubAgents = onSnapshot(doc(db, "system", "sched_agents_list"), snap => {
      // Intentionally empty or minimal - we prefer the dynamic list from unsubUsers/directory
    });
    const unsubMeta = onSnapshot(doc(db, "system", "sched_agent_meta"), snap => {
      if (snap.exists()) {
        const data = snap.data().data as Record<string, { roleType: string; tlName: string }>;
        setAgentMeta(data);
        localStorage.setItem('sched_agent_meta', JSON.stringify(data));
      }
    });
    const unsubDir = onSnapshot(doc(db, "system", "sched_agent_directory"), snap => {
      if (snap.exists()) {
        const data = snap.data().data as AgentDirectoryRow[];
        setAgentDirectory(data);
        localStorage.setItem('sched_agent_directory', JSON.stringify(data));
      }
    });
    const unsubDirHeaders = onSnapshot(doc(db, "system", "sched_agent_directory_headers"), snap => {
      if (snap.exists()) {
        const data = snap.data().data as string[];
        setDirectoryHeaders(data);
        localStorage.setItem('sched_agent_directory_headers', JSON.stringify(data));
      }
    });

    const unsubRosterPub = onSnapshot(doc(db, "system", "sched_roster_published"), snap => {
      if (snap.exists()) {
        const data = snap.data().data as boolean;
        setIsRosterPublished(data);
        localStorage.setItem('sched_roster_published', JSON.stringify(data));
      }
    });

    const unsubCredentials = onSnapshot(doc(db, "system", "sched_credentials"), snap => {
      if (snap.exists()) {
        const data = snap.data().data || {};
        setCredentials(data);
        localStorage.setItem('sched_credentials', JSON.stringify(data));
      }
    });

    const unsubLockedAccounts = onSnapshot(doc(db, "system", "sched_locked_accounts"), snap => {
      if (snap.exists()) {
        const data = snap.data().data || [];
        setLockedAccounts(data);
        localStorage.setItem('sched_locked_accounts', JSON.stringify(data));
      }
    });

    const unsubFailedAttempts = onSnapshot(doc(db, "system", "sched_failed_attempts"), snap => {
      if (snap.exists()) {
        const data = snap.data().data || {};
        setFailedAttempts(data);
        localStorage.setItem('sched_failed_attempts', JSON.stringify(data));
      }
    });

    const unsubNotifs = () => {};

    const unsubFeedbacks = onSnapshot(collection(db, "tl_feedbacks"), snap => {
      const arr = snap.docs.map(d => d.data() as TlFeedback);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTlFeedbacks(arr);
      localStorage.setItem('sched_tl_feedbacks', JSON.stringify(arr));
    });

    const unsubAppVersion = onSnapshot(doc(db, "system", "app_version"), (snap) => {
      if (snap.exists()) {
        const remoteVersion = snap.data().version || 0;
        if (CURRENT_APP_VERSION > remoteVersion) {
            setDoc(doc(db, "system", "app_version"), { version: CURRENT_APP_VERSION }, { merge: true }).catch(console.error);
        } else if (remoteVersion > CURRENT_APP_VERSION) {
            // Safeguard against infinite reload loops
            const key = `reloaded_for_version_${remoteVersion}`;
            if (!sessionStorage.getItem(key)) {
                sessionStorage.setItem(key, "true");
                toast.loading("A new system update was published! Refreshing to apply...");
                setTimeout(() => {
                    if ('caches' in window) {
                       caches.keys().then((names) => {
                           for (let name of names) caches.delete(name);
                       }).catch(e => console.error("Cache flush on reload error:", e));
                    }
                    window.location.reload();
                }, 3000);
            } else {
                console.warn(`Already attempted reload for version ${remoteVersion}, but local bundle version is still ${CURRENT_APP_VERSION}. Suppressing loop to let user open the app.`);
            }
        }
      } else {
        setDoc(doc(db, "system", "app_version"), { version: CURRENT_APP_VERSION }).catch(console.error);
      }
    });

    const unsubTodos = () => {};

    const unsubUsers = onSnapshot(collection(db, "users"), snap => {
      const dbUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setRegisteredUsers(dbUsers);

      // Optionally update currentUser if their document was updated
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        const liveUserInfo = dbUsers.find(u => u && u.name && prevUser && prevUser.name && u?.name?.toLowerCase() === prevUser.name.toLowerCase());
        if (liveUserInfo) {
           return { ...prevUser, ...liveUserInfo };
        }
        return prevUser;
      });
    });

    return () => {
      unsubTodos();
      unsubUsers();
      unsubAppVersion();

      window.removeEventListener('storage', handleStorage);
      unsubInquiries();
      unsubQa();
      unsubQATemplate();
      unsubTT();
      unsubComp();
      unsubComms();
      unsubReq();
      unsubTime();
      unsubSched();
      unsubAnnouncements();
      unsubOrders();
      unsubAppStatus();
      unsubSupp();
      unsubCases();
      unsubAgents();
      unsubMeta();
      unsubDir();
      unsubDirHeaders();
      unsubRosterPub();
      unsubNotifs();
      unsubFeedbacks();
      unsubCredentials();
      unsubLockedAccounts();
      unsubFailedAttempts();
    };
  }, []);

  const getElapsedTimerString = (confirmedAtISO: string, contactedAtISO?: string) => {
    const startTime = new Date(confirmedAtISO).getTime();
    const endTime = contactedAtISO ? new Date(contactedAtISO).getTime() : currentTime.getTime();
    const diffMs = Math.max(0, endTime - startTime);
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Google Workspace States
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true || 
           document.referrer.includes('android-app://');
  });

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [googleSheetId, setGoogleSheetId] = useState<string>(() => getStorageItem<string>('sched_google_sheet_id', ''));
  const [googleSheetGid, setGoogleSheetGid] = useState<string>(() => getStorageItem<string>('sched_google_sheet_gid', '0'));

  // Theme support
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved !== 'light';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
    }
    localStorage.setItem('theme_mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = getStorageItem<User | null>('sched_current_user', null);
    if (saved) {
      // Auto-logout the old full name sessions. New username must contain a dot and no spaces.
      const isNewFormat = saved.name.includes('.') && !saved.name.includes(' ');
      if (!isNewFormat) {
        localStorage.removeItem('sched_current_user');
        return null;
      }
    }
    return saved;
  });

  const currentUserRef = React.useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
    if (currentUser) {
      setStorageItem('sched_current_user', currentUser);
    } else {
      localStorage.removeItem('sched_current_user');
    }
  }, [currentUser]);

  // Real-time Firestore Sync with [currentUser] dependency for Schedules, Notifications, Orders, and Todos as requested
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    // 1. Schedules Real-time Sync
    const unsubSched = onSnapshot(
      collection(db, "schedules"),
      (snapshot) => {
        const data = snapshot.docs.map(d => d.data() as ScheduledShift);
        setSchedules(data);
      },
      (error) => {
        console.error("Schedules Real-time Sync Error:", error);
      }
    );

    // 2. Notifications Real-time Sync
    const qNotifs = query(collection(db, "notifications"), where("userId", "==", currentUser.id));
    let isNotifsInitialized = false;
    const unsubNotifs = onSnapshot(
      qNotifs,
      (snapshot) => {
        const arr = snapshot.docs.map(d => d.data() as SystemNotification);
        arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        const latest = arr[0];
        if (latest) {
          if (!isNotifsInitialized) {
            isNotifsInitialized = true;
            localStorage.setItem('sched_last_notified_notif_id', latest.id);
          } else {
            const lastNotifiedNotifId = localStorage.getItem('sched_last_notified_notif_id') || '';
            if (latest.id !== lastNotifiedNotifId) {
              localStorage.setItem('sched_last_notified_notif_id', latest.id);
              
              const isAnnouncementNotification = latest.title.toLowerCase().includes('announcement') || latest.title.toLowerCase().includes('broadcast');

              if (!isAnnouncementNotification) {
                triggerNotificationAlert();
                toast.info(
                  <div className="flex flex-col gap-1 text-left">
                    <span className="font-bold text-sm text-indigo-400">🔔 {latest.title}</span>
                    <span className="text-xs text-slate-200 line-clamp-2">{latest.message}</span>
                  </div>,
                  { duration: 8000 }
                );
              }
            }
          }
        }

        setNotifications(arr);
      },
      (error) => {
        console.error("Notifications Real-time Sync Error:", error);
      }
    );

    // 3. Orders/Requests Real-time Sync
    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const data = snapshot.docs.map(d => d.data() as Order);
        setOrders(data);
      },
      (error) => {
        console.error("Orders Real-time Sync Error:", error);
      }
    );

    // 4. Todos Real-time Alignment Sync
    const unsubTodos = onSnapshot(
      collection(db, "todos"),
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTodos(data);
      },
      (error) => {
        console.error("Todos Real-time Sync Error:", error);
      }
    );

    return () => {
      unsubSched();
      unsubNotifs();
      unsubOrders();
      unsubTodos();
    };
  }, [currentUser]);

  const isMasterAdmin = currentUser ? (
    currentUser?.name?.toLowerCase() === 'hesham sobhy' || 
    currentUser?.name?.toLowerCase() === 'h.sobhy' || 
    currentUser?.name?.toLowerCase() === 'hesso' || 
    currentUser?.name?.toLowerCase() === 'amira' || 
    currentUser?.name?.toLowerCase() === 'amira hassan' ||
    currentUser?.name?.toLowerCase() === 'a.hassan'
  ) : false;
  const isSheetsAdmin = isMasterAdmin;
  
  const [credentials, setCredentials] = useState<{ [name: string]: string }>(() => {
    // Standard mock credentials - empty initially (user sets their password on first try)
    return getStorageItem<{ [name: string]: string }>('sched_credentials', {});
  });

  const [lockedAccounts, setLockedAccounts] = useState<string[]>(() => {
    return getStorageItem<string[]>('sched_locked_accounts', []);
  });

  const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>(() => {
    return getStorageItem<Record<string, number>>('sched_failed_attempts', {});
  });

  // Time logging database (Clock In / Clock Out, break, lunch, restroom)
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => {
    return getStorageItem<TimeLog[]>('sched_time_logs', []);
  });

  // State to minimize the overtime modal popup
  const [isOvertimeAlertMinimized, setIsOvertimeAlertMinimized] = useState<boolean>(false);
  const [lastActivityAlertId, setLastActivityAlertId] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sched_sound_enabled') !== 'false';
  });
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    localStorage.setItem('sched_sound_enabled', soundEnabled ? 'true' : 'false');
  }, [soundEnabled]);

  const triggerNotificationAlert = () => {
    if (soundEnabledRef.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.log('Audio playback failed', e);
      }
    }
    
    // Jump animation for icons globally
    document.body.classList.add('global-ring');
    setTimeout(() => {
      document.body.classList.remove('global-ring');
    }, 1500);
  };

  // Support state
  const [supportAssignments, setSupportAssignments] = useState<Record<string, { assignedBy: string; assignedAt: string }>>(() => {
    return getStorageItem<Record<string, { assignedBy: string; assignedAt: string }>>('sched_support_assignments', {});
  });
  const [targetSupportAgent, setTargetSupportAgent] = useState('');

  const supportAssignmentsRef = React.useRef(supportAssignments);
  useEffect(() => {
    supportAssignmentsRef.current = supportAssignments;
  }, [supportAssignments]);

  const isSuperAdmin = currentUser ? (
    currentUser?.name?.toLowerCase() === 'hesham sobhy' || 
    currentUser?.name?.toLowerCase() === 'h.sobhy' || 
    currentUser?.name?.toLowerCase() === 'hesso' || 
    currentUser?.name?.toLowerCase() === 'amira' || 
    currentUser?.name?.toLowerCase() === 'amira hassan' ||
    currentUser?.name?.toLowerCase() === 'a.hassan' ||
    currentUser?.name?.toLowerCase() === 'shymaa hassan' ||
    currentUser?.name?.toLowerCase() === 'shaymaa hassan' ||
    currentUser?.name?.toLowerCase() === 's.hassan'
  ) : false;

  const isTLOreSupport = currentUser ? (currentUser.role === 'tl' || currentUser.role === 'qa' || !!supportAssignments[currentUser.name] || isTLName(currentUser.name)) : false;

  // Monitor active activity to automatically pop up when they start a new active break or lunch or when it exceeds
  useEffect(() => {
    if (!currentUser) return;
    const active = timeLogs.find(log => 
      log.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && 
      log.status !== 'clocked_out'
    );
    if (active && (active.status === 'break' || active.status === 'lunch')) {
      const currentAct = active.activities.find(a => !a.endTime && a.type === active.status);
      if (currentAct) {
        if (currentAct.id !== lastActivityAlertId) {
          setLastActivityAlertId(currentAct.id);
          setIsOvertimeAlertMinimized(false);
        }
      }
    } else {
      setLastActivityAlertId(null);
    }
  }, [timeLogs, currentUser, lastActivityAlertId]);

  // Requests database
  const [requests, setRequests] = useState<SchedulingRequest[]>(() => {
    return getStorageItem<SchedulingRequest[]>('sched_requests', []);
  });

  // Known Agent Names (can grow if user adds/registers new custom names)
  const [agentsList, setAgentsList] = useState<string[]>(INITIAL_AGENTS);
  const [selectedPendingRequests, setSelectedPendingRequests] = useState<Set<string>>(new Set());
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

  // Moved agentDirectory up to fix usage before declaration
  const [agentDirectory, setAgentDirectory] = useState<AgentDirectoryRow[]>(() => {
    return getStorageItem<AgentDirectoryRow[]>('sched_agent_directory', []);
  });

  // Sync agentsList whenever registeredUsers or agentDirectory changes
  useEffect(() => {
    const uniqueNames = new Set<string>();
    
    // 1. Initial agents fallback
    INITIAL_AGENTS.forEach(a => uniqueNames.add(capitalizeName(a)));
    
    // 2. Registered users from Firestore
    registeredUsers.forEach(u => {
      if (u && u.name) {
        uniqueNames.add(capitalizeName(u.name));
      }
    });
    
    // 3. Agent directory from spreadsheet uploads
    agentDirectory.forEach(d => {
      if (d && d.agentName) {
        uniqueNames.add(capitalizeName(d.agentName));
      }
    });
    
    const sortedList = Array.from(uniqueNames).sort();
    setAgentsList(sortedList);
    setStorageItem('sched_agents_list', sortedList);
  }, [registeredUsers, agentDirectory]);

  const [agentMeta, setAgentMeta] = useState<Record<string, { roleType: string; tlName: string }>>(() => {
    return getStorageItem<Record<string, { roleType: string; tlName: string }>>('sched_agent_meta', {});
  });

  const [isRosterPublished, setIsRosterPublished] = useState<boolean>(() => {
    return getStorageItem<boolean>('sched_roster_published', false);
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info("Installation prompt is not ready. Look for the install option in your browser search bar or menu!");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Install Choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Agent Personal Dashboard states (Daily, Weekly, Monthly)
  const [agentDashboardTab, setAgentDashboardTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dashboardViewMode, setDashboardViewMode] = useState<'team' | 'personal'>(() => {
    // Team Leaders / Support default to 'team' view, standard Agents always default to 'personal'
    return currentUser && (currentUser.role === 'tl' || !!supportAssignments[currentUser.name]) ? 'team' : 'personal';
  });
  const [dashboardSearchTeam, setDashboardSearchTeam] = useState<string>('');
  const [rtmSearch, setRtmSearch] = useState<string>('');
  const [rtmSelectedAgent, setRtmSelectedAgent] = useState<string | null>(null);
  const [todos, setTodos] = useState<any[]>([]);
  const [todoFilter, setTodoFilter] = useState<'All' | 'Work' | 'Personal' | 'Urgent'>('All');

  const addSystemNotification = (
    title: string,
    message: string,
    type: SystemNotification['type'],
    targetAgent: string,
    stableId?: string
  ) => {
    const newNotif: SystemNotification = {
      id: stableId || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      type,
      targetAgent,
      createdAt: new Date().toISOString(),
      seenByUsers: [],
      userId: currentUser?.id || "all"
    };
    // Sync to state which forwards to firestore
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      return updated;
    });
    
    // Auto-sync real-time to firestore
    setDoc(doc(db, "notifications", newNotif.id), newNotif).catch(e => console.error("Notif sync error:", e));
  };

  const handleMentionsInText = (text: string, contextTitle: string, sourceAuthorName: string) => {
    if (!text) return;
    const allNames = Array.from(new Set([
      ...TEAM_LEADERS,
      ...INITIAL_AGENTS,
      ...(agentsList || [])
    ]));

    const notifiedSet = new Set<string>();

    allNames.forEach(name => {
      if (!name) return;
      const mentionToken = `@${name.toLowerCase()}`;
      if (text.toLowerCase().includes(mentionToken) && name.toLowerCase() !== sourceAuthorName.toLowerCase()) {
        if (!notifiedSet.has(name)) {
          notifiedSet.add(name);
          addSystemNotification(
            `💬 Mentioned by ${sourceAuthorName}`,
            `You were mentioned in ${contextTitle}: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`,
            'general',
            name
          );
          toast.success(`Notified @${name} of your mention!`);
        }
      }
    });
  };

  const addTlFeedback = (tlName: string, notes: string, attachment?: string, attachmentName?: string) => {
    if (!tlName) {
      toast.error("Please select a Team Leader.");
      return;
    }
    if (!notes.trim()) {
      toast.error("Please enter feedback notes.");
      return;
    }

    const newFeedback: TlFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tlName,
      directorName: 'Amira Hassan',
      notes,
      attachment,
      attachmentName,
      createdAt: new Date().toISOString(),
      replies: [],
      status: 'pending_reply'
    };

    setTlFeedbacks(prev => {
      const updated = [newFeedback, ...prev];
      setStorageItem('sched_tl_feedbacks', updated);
      
      // Sync to Firestore
      setDoc(doc(db, "tl_feedbacks", newFeedback.id), newFeedback).catch(e => console.error("Feedback Write Error:", e));
      
      return updated;
    });

    addSystemNotification(
      '👑 Director Feedback Received',
      `Amira Hassan left feedback for you: "${notes.substring(0, 60)}${notes.length > 60 ? '...' : ''}"`,
      'feedback',
      tlName
    );

    handleMentionsInText(notes, 'Amira Hassan Feedback', 'Amira Hassan');
    toast.success(`Feedback sent to ${tlName}!`);
    
    // Clear inputs
    setFeedbackNotes('');
    setFeedbackAttachment('');
    setFeedbackAttachmentName('');
  };

  const replyToTlFeedback = (feedbackId: string, text: string, attachment?: string, attachmentName?: string) => {
    if (!text.trim()) {
      toast.error("Please write a reply message.");
      return;
    }

    setTlFeedbacks(prev => {
      const updated = prev.map(f => {
        if (f.id === feedbackId) {
          const newReply: FeedbackReply = {
            id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            senderName: currentUser.name,
            text,
            attachment,
            attachmentName,
            createdAt: new Date().toISOString()
          };
          const isDirector = currentUser?.name?.toLowerCase() === 'amira hassan';
          const newStatus = isDirector ? 'pending_reply' : 'replied';

          const updatedFeedback = {
            ...f,
            replies: [...f.replies, newReply],
            status: newStatus as any
          };
          
          // Sync to Firestore
          setDoc(doc(db, "tl_feedbacks", f.id), updatedFeedback).catch(e => console.error("Feedback Reply Error:", e));
          
          return updatedFeedback;
        }
        return f;
      });
      setStorageItem('sched_tl_feedbacks', updated);
      return updated;
    });

    const fObj = tlFeedbacks.find(f => f.id === feedbackId);
    if (fObj) {
      const isDirector = currentUser?.name?.toLowerCase() === 'amira hassan';
      const targetUser = isDirector ? fObj.tlName : 'Amira Hassan';
      const senderName = currentUser.name;

      addSystemNotification(
        isDirector ? '👑 Director Feedback Updates' : '✉️ Reply to Director Feedback',
        `${senderName} replied to feedback: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
        'feedback',
        targetUser
      );

      handleMentionsInText(text, 'Feedback Thread Reply', senderName);
      toast.success("Reply submitted!");
      
      // Clear specific reply state
      setFeedbackReplies(prev => ({ ...prev, [feedbackId]: '' }));
      setFeedbackReplyAttachments(prev => ({ ...prev, [feedbackId]: '' }));
      setFeedbackReplyAttachmentNames(prev => ({ ...prev, [feedbackId]: '' }));
    }
  };

  const visibleNotifs = notifications.filter(notif => {
    if (!currentUser) return false;
    if (notif.clearedByUsers && notif.clearedByUsers.includes(currentUser.name)) return false;
    if (notif.targetAgent === 'all') return true;
    if (isTLOreSupport && notif.targetAgent === 'tl') return true;
    return notif.targetAgent.toLowerCase() === currentUser?.name?.toLowerCase();
  });

  const unreadCount = visibleNotifs.filter(notif => {
    return !notif.seenByUsers || !notif.seenByUsers.includes(currentUser?.name || '');
  }).length;

  const handleMarkAllNotifsAsRead = () => {
    if (!currentUser) return;
    const updated = notifications.map(n => {
      const isVisible = n.targetAgent === 'all' || 
                        (isTLOreSupport && n.targetAgent === 'tl') ||
                        n.targetAgent.toLowerCase() === currentUser?.name?.toLowerCase();
      if (isVisible) {
        const seenSet = new Set(n.seenByUsers || []);
        seenSet.add(currentUser.name);
        const updatedNotif = { ...n, seenByUsers: Array.from(seenSet) };
        // Sync to Firestore
        updateDoc(doc(db, "notifications", n.id), { seenByUsers: updatedNotif.seenByUsers }).catch(e => console.error("Mark All Read Error:", e));
        return updatedNotif;
      }
      return n;
    });
    setNotifications(updated);
    toast.success("All notifications marked as read!");
  };

  const handleMarkSingleNotifAsRead = (id: string) => {
    if (!currentUser) return;
    const updated = notifications.map(n => {
      if (n.id === id) {
        const seenSet = new Set(n.seenByUsers || []);
        seenSet.add(currentUser.name);
        const updatedNotif = { ...n, seenByUsers: Array.from(seenSet) };
        // Sync to Firestore
        updateDoc(doc(db, "notifications", n.id), { seenByUsers: updatedNotif.seenByUsers }).catch(e => console.error("Mark Single Read Error:", e));
        return updatedNotif;
      }
      return n;
    });
    setNotifications(updated);
  };

  useEffect(() => {
    if (currentUser) {
      const derivedRole = (isQAName(currentUser.name) ? 'qa' : isTLName(currentUser.name) ? 'tl' : 'agent') as Role;
      if (currentUser.role !== derivedRole) {
        const updated: User = { ...currentUser, role: derivedRole };
        setCurrentUser(updated);
        setStorageItem('sched_current_user', updated);
      }
    }
  }, [currentUser, agentsList]);

  // AI Schedule Analyzer States
  const [isAnalyzingSchedule, setIsAnalyzingSchedule] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [scheduleAnalysisResult, setScheduleAnalysisResult] = useState<string | null>(null);
  const [scheduleAnalysisError, setScheduleAnalysisError] = useState<string | null>(null);

  // Operations Live Queue & Log State
  const [queueStats, setQueueStats] = useState(() => {
    return getStorageItem('sched_queue_stats', { activeCalls: 3, waitingTasks: 2, holdTime: 14, processedToday: 42 });
  });
  const [liveOpsLogs, setLiveOpsLogs] = useState<string[]>(() => {
    return getStorageItem('sched_live_ops_logs', [
      `[Operational] CRM integration sync checked & active`,
      `[Operational] SLA levels optimal (All queues matching goals)`,
      `[Operational] Live system clock synchronized`
    ]);
  });


  // Knowledge Base database and states
  const [knowledgeBaseDocuments, setKnowledgeBaseDocuments] = useState<any[]>(() =>
    readStoredJson<any[]>(STORAGE_KEYS.knowledgeBase, [])
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.knowledgeBase, JSON.stringify(knowledgeBaseDocuments));
    } catch (e) {
      toast.error('Local database storage is full. Please delete some documents to free up space.');
    }
  }, [knowledgeBaseDocuments]);
  
  // Knowledge Base States and Helpers
  const [selectedKbDocId, setSelectedKbDocId] = useState<string | null>(null);
  const [searchQueryKb, setSearchQueryKb] = useState<string>('');
  const [isAnsweringKb, setIsAnsweringKb] = useState<boolean>(false);
  const [kbAiAnswer, setKbAiAnswer] = useState<string>('');

  const handleKbAiQuery = async () => {
    if (!searchQueryKb.trim()) {
      toast.error('Please enter a query to ask the AI.');
      return;
    }
    setIsAnsweringKb(true);
    setKbAiAnswer('');
    try {
      let context = '';
      if (knowledgeBaseDocuments.length > 0) {
        context = knowledgeBaseDocuments.map(d => `Document: ${d.name}\nContent:\n${d.content}`).join('\n\n');
        if (context.length > 7000) {
          context = context.substring(0, 7000) + '... (truncated)';
        }
      }
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: searchQueryKb, knowledgeContext: context }),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch AI response');
      }
      const data = await res.json();
      setKbAiAnswer(data.reply);
      toast.success('AI grounding analysis completed!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to get AI response. Check your API configuration.');
    } finally {
      setIsAnsweringKb(false);
    }
  };

  const handleKbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    // Generous limit of 4MB for high performance in browser-based Storage
    if (file.size > 4 * 1024 * 1024) {
      toast.error('File size exceeds the 4MB limit for direct browser upload. Consider uploading smaller documents.');
      return;
    }

    // Special Route: PDF Text Extraction Ingestion
    if (extension === 'pdf') {
      const pdfReader = new FileReader();
      pdfReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            throw new Error('PDF file is empty.');
          }

          toast.loading('Ingesting and extracting text from PDF...', { id: 'pdf-load' });
          
          let extractedText = '';
          try {
            // Load PDF.js dynamically from high-speed reliable Cloudflare CDN
            if (!(window as any).pdfjsLib) {
              await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load PDF extraction engine.'));
                document.head.appendChild(script);
              });
            }

            const pdfjsLib = (window as any).pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += `--- Page ${i} ---
${pageText}

`;
            }
            extractedText = fullText.trim() || 'No searchable text content found in PDF.';
            toast.success(`Extracted ${pdf.numPages} pages from PDF!`, { id: 'pdf-load' });
          } catch (pdfErr: any) {
            console.error(pdfErr);
            toast.error('Local PDF parsing failed. Uploading as reference binary file.', { id: 'pdf-load' });
            
            // Fallback: save as standard binary data URL
            const binaryReader = new FileReader();
            binaryReader.onload = (binEv) => {
              const dataUrl = binEv.target?.result as string;
              const newDoc = {
                id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: file.name,
                type: 'PDF',
                mimeType: 'application/pdf',
                uploadedAt: new Date().toISOString(),
                content: dataUrl,
                size: file.size,
                isBinary: true
              };
              setKnowledgeBaseDocuments(prev => [newDoc, ...prev]);
              setSelectedKbDocId(newDoc.id);
            };
            binaryReader.readAsDataURL(file);
            return;
          }

          const newDoc = {
            id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'PDF',
            mimeType: 'application/pdf',
            uploadedAt: new Date().toISOString(),
            content: extractedText,
            size: file.size,
            isBinary: false // Successfully extracted to structured text!
          };

          setKnowledgeBaseDocuments(prev => [newDoc, ...prev]);
          setSelectedKbDocId(newDoc.id);
          toast.success(`"${file.name}" indexed successfully!`);
        } catch (err: any) {
          toast.error('Failed to parse PDF file: ' + err.message, { id: 'pdf-load' });
        }
      };
      pdfReader.onerror = () => {
        toast.error('Failed to read the selected PDF file.');
      };
      pdfReader.readAsArrayBuffer(file);
      return;
    }

    // Determine if file is text or binary
    if (extension === 'docx') {
      const docxReader = new FileReader();
      docxReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (!arrayBuffer) throw new Error('DOCX file is empty.');
          toast.loading('Extracting text from Word document...', { id: 'docx-load' });
          const result = await mammoth.extractRawText({ arrayBuffer });
          const extractedText = result.value || 'No readable text content found in document.';
          if (result.messages && result.messages.length > 0) console.warn(result.messages);
          const newDoc = {
            id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'DOCX',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            uploadedAt: new Date().toISOString(),
            content: extractedText,
            size: file.size,
            isBinary: false
          };
          setKnowledgeBaseDocuments(prev => [newDoc, ...prev]);
          setSelectedKbDocId(newDoc.id);
          toast.success(`"${file.name}" indexed successfully!`, { id: 'docx-load' });
        } catch (err: any) {
          toast.error('Failed to parse Word Document: ' + err.message, { id: 'docx-load' });
        }
      };
      docxReader.onerror = () => toast.error('Failed to read the selected DOCX file.');
      docxReader.readAsArrayBuffer(file);
      return;
    }

    const textExtensions = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'svg', 'yaml', 'yml', 'ini', 'log'];
    const isText = file.type.startsWith('text/') || 
                   textExtensions.includes(extension) || 
                   file.type === 'application/json' ||
                   file.type === 'application/javascript';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        if (!fileContent) {
          throw new Error('File is empty.');
        }

        const newDoc = {
          id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: extension.toUpperCase() || 'FILE',
          mimeType: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          content: fileContent,
          size: file.size,
          isBinary: !isText
        };

        setKnowledgeBaseDocuments(prev => [newDoc, ...prev]);
        setSelectedKbDocId(newDoc.id);
        toast.success(`"${file.name}" uploaded successfully!`);
      } catch (err: any) {
        toast.error('Failed to parse file: ' + err.message);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read the selected file.');
    };

    if (isText) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteKbDoc = (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this document from the knowledge base?')) return;
    setKnowledgeBaseDocuments(prev => prev.filter(d => d.id !== id));
    if (selectedKbDocId === id) setSelectedKbDocId(null);
    toast.success('Document deleted successfully.');
  };

  const filteredKbDocs = useMemo(() => {
    if (!searchQueryKb.trim()) return knowledgeBaseDocuments;
    const q = searchQueryKb.toLowerCase();
    return knowledgeBaseDocuments.filter(d => 
      String(d.name || '').toLowerCase().includes(q) || 
      (!d.isBinary && d.content && String(d.content).toLowerCase().includes(q))
    );
  }, [knowledgeBaseDocuments, searchQueryKb]);

  const currentKbDoc = useMemo(() => {
    if (!selectedKbDocId) {
      return filteredKbDocs[0] || null;
    }
    return filteredKbDocs.find(d => d.id === selectedKbDocId) || filteredKbDocs[0] || null;
  }, [filteredKbDocs, selectedKbDocId]);
  const [isSchedulesCleared, setIsSchedulesCleared] = useState<boolean>(() => {
    return localStorage.getItem('schedules_cleared_v1') === 'true';
  });

  const [firestoreSchedules, setFirestoreSchedules] = useState<ScheduledShift[]>([]);


  const clock = systemTime;
  const schedules = useMemo(() => {
    if (isSchedulesCleared) {
      return [];
    }
    if (firestoreSchedules.length > 0) {
      return firestoreSchedules;
    }
    return getInitialSchedules(clock, INITIAL_AGENTS);
  }, [firestoreSchedules, clock, isSchedulesCleared]);

  const setSchedules = (val: ScheduledShift[] | ((prev: ScheduledShift[]) => ScheduledShift[])) => {
    if (typeof val === 'function') {
      setFirestoreSchedules(prev => {
        const fallback = prev.length > 0 ? prev : getInitialSchedules(clock, INITIAL_AGENTS);
        const res = val(fallback);
        if (res.length > 0) {
          localStorage.removeItem('schedules_cleared_v1');
          setIsSchedulesCleared(false);
        } else {
          localStorage.setItem('schedules_cleared_v1', 'true');
          setIsSchedulesCleared(true);
        }
        return res;
      });
    } else {
      setFirestoreSchedules(val);
      if (val.length > 0) {
        localStorage.removeItem('schedules_cleared_v1');
        setIsSchedulesCleared(false);
      } else {
        localStorage.setItem('schedules_cleared_v1', 'true');
        setIsSchedulesCleared(true);
      }
    }
  };

  // Inquiries database (persists in localStorage)
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    return getStorageItem<Inquiry[]>('sched_inquiries', []);
  });

  const [qaScores, setQaScores] = useState<QAScore[]>(() => {
    return getStorageItem<QAScore[]>('sched_qa_scores', []);
  });

  const [qaTemplate, setQaTemplate] = useState<any[]>(() => {
    return getStorageItem<any[]>('sched_qa_template', [
      { id: 'q1', text: 'Greeting & Opening', maxScore: 10 },
      { id: 'q2', text: 'Empathy & Tone', maxScore: 20 },
      { id: 'q3', text: 'Accuracy of Information', maxScore: 40 },
      { id: 'q4', text: 'Resolution & Tool Usage', maxScore: 20 },
      { id: 'q5', text: 'Closing & Recap', maxScore: 10 }
    ]);
  });

  // Tabby & Tamara requests database
  const [tabbyTamaraRequests, setTabbyTamaraRequests] = useState<TabbyTamaraRequest[]>(() => {
    return getStorageItem<TabbyTamaraRequest[]>('sched_tabby_tamara', []);
  });

  // Tabby & Tamara complaints database
  const [tabbyTamaraComplaints, setTabbyTamaraComplaints] = useState<TabbyTamaraComplaint[]>(() => {
    return getStorageItem<TabbyTamaraComplaint[]>('sched_tt_complaints', []);
  });

  const [clientComms, setClientComms] = useState<ClientCommunicationRequest[]>(() => {
    return getStorageItem<ClientCommunicationRequest[]>('sched_client_comms', []);
  });

  const [cases, setCases] = useState<CaseRecord[]>(() => {
    return getStorageItem<CaseRecord[]>('sched_cases', []);
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    return getStorageItem<Announcement[]>('sched_announcements', []);
  });

  const [orders, setOrders] = useState<Order[]>([]);

  const latestAnnouncementIdRef = useRef<string | null>(null);

  // Tab selection inside Tabby & Tamara Desk
  const [ttSubTab, setTtSubTab] = useState<'requests' | 'complaints'>('requests');

  // Amira Hassan's TL Feedback States
  const [tlFeedbacks, setTlFeedbacks] = useState<TlFeedback[]>(() => {
    return getStorageItem<TlFeedback[]>('sched_tl_feedbacks', []);
  });
  const [selectedTlForFeedback, setSelectedTlForFeedback] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackAttachment, setFeedbackAttachment] = useState('');
  const [feedbackAttachmentName, setFeedbackAttachmentName] = useState('');
  const [feedbackFilterTl, setFeedbackFilterTl] = useState('all');
  const [feedbackReplies, setFeedbackReplies] = useState<Record<string, string>>({});
  const [feedbackReplyAttachments, setFeedbackReplyAttachments] = useState<Record<string, string>>({});
  const [feedbackReplyAttachmentNames, setFeedbackReplyAttachmentNames] = useState<Record<string, string>>({});

  // 10th of Ramadan Weather States
  const [ramadanTemp, setRamadanTemp] = useState<number | null>(null);
  const [ramadanWeatherCode, setRamadanWeatherCode] = useState<number>(0);

  // Tabby/Tamara form inputs
  const [ttPatientName, setTtPatientName] = useState('');
  const [ttFileNumber, setTtFileNumber] = useState('');
  const [ttIsOldCustomer, setTtIsOldCustomer] = useState(true);
  const [ttIdNumber, setTtIdNumber] = useState('');
  const [ttPriceWithoutTax, setTtPriceWithoutTax] = useState('');
  const [ttPhoneNumber, setTtPhoneNumber] = useState('');
  const [ttNotes, setTtNotes] = useState('');
  const [ttPlatform, setTtPlatform] = useState<'tabby' | 'tamara'>('tabby');
  const [ttClinicName, setTtClinicName] = useState('');

  // Tabby/Tamara Complaint form inputs
  const [tcPatientName, setTcPatientName] = useState('');
  const [tcFileNumber, setTcFileNumber] = useState('');
  const [tcIsOldCustomer, setTcIsOldCustomer] = useState(true);
  const [tcIdNumber, setTcIdNumber] = useState('');
  const [tcImageUrl, setTcImageUrl] = useState('');
  const [tcPhoneNumber, setTcPhoneNumber] = useState('');
  const [tcComplaintDetails, setTcComplaintDetails] = useState('');
  const [tcClinicName, setTcClinicName] = useState('');

  // Client Communication Requests form inputs
  const [ccClinicName, setCcClinicName] = useState('');
  const [ccPhoneNumber, setCcPhoneNumber] = useState('');
  const [ccLanguage, setCcLanguage] = useState<'Arabic' | 'English'>('Arabic');
  const [ccNotes, setCcNotes] = useState('');
  const [activeCcHandlingId, setActiveCcHandlingId] = useState<string | null>(null);
  const [ccHandlingNotes, setCcHandlingNotes] = useState('');

  // Cases input
  const [casePatientName, setCasePatientName] = useState('');
  const [casePhoneNumber, setCasePhoneNumber] = useState('');
  const [caseInquiry, setCaseInquiry] = useState('');
  const [caseLeadSource, setCaseLeadSource] = useState('');
  const [caseBloggerName, setCaseBloggerName] = useState('');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState('all');
  const [caseBranch, setCaseBranch] = useState('');
  const [casePatientType, setCasePatientType] = useState('New');
  const [caseService, setCaseService] = useState('');
  const [caseTicketType, setCaseTicketType] = useState('Inquiry');
  const [caseTicketStatus, setCaseTicketStatus] = useState('Closed');
  const [caseCallType, setCaseCallType] = useState('');
  const [caseDateFilter, setCaseDateFilter] = useState(() => getLocalISOString());
  const [caseAgentFilter, setCaseAgentFilter] = useState('all');

  // TL Complaint handling input
  const [activeComplaintHandlingId, setActiveComplaintHandlingId] = useState<string | null>(null);
  const [tlComplaintComment, setTlComplaintComment] = useState('');

  // TL Fintech handling input
  const [activeFintechHandlingId, setActiveFintechHandlingId] = useState<string | null>(null);
  const [tlFintechPaymentLink, setTlFintechPaymentLink] = useState('');
  const [tlFintechNotes, setTlFintechNotes] = useState('');
  const [tlFintechLinks, setTlFintechLinks] = useState('');

  // Form submission and confirmation states
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [submissionConfirmation, setSubmissionConfirmation] = useState<{
    title: string;
    message: string;
    type: 'inquiry' | 'fintech_request' | 'fintech_complaint' | 'client_comm' | 'case' | 'swap_request' | 'annual_leave';
    referenceId?: string;
  } | null>(null);

  // Inquiry submission inputs
  const [inquiryText, setInquiryText] = useState('');
  const [inquiryPhotos, setInquiryPhotos] = useState<string[]>([]);
  const [inquiryLinks, setInquiryLinks] = useState<string[]>([]);
  const [tempLinkInput, setTempLinkInput] = useState('');
  const [tempPhotoUrlInput, setTempPhotoUrlInput] = useState('');
  const [inquiryClinicName, setInquiryClinicName] = useState('');
  const [inquiryPhoneNumber, setInquiryPhoneNumber] = useState('');
  const [inquiryLanguageDir, setInquiryLanguageDir] = useState<'auto' | 'ltr' | 'rtl'>('auto');

  // Selected Inquiry for answering
  const [answeringInquiryId, setAnsweringInquiryId] = useState<string | null>(null);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  
  // Inquiries Search and Filter states
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  
  // KPI Calculator States
  const [kpiMaxBonus, setKpiMaxBonus] = useState<number>(3000);
  const [kpiAgentTarget, setKpiAgentTarget] = useState<string>('');
  const [kpiMetrics, setKpiMetrics] = useState<{ id: string; name: string; target: number; actual: number; weight: number; type: 'higher' | 'lower'; formula?: string }[]>([
    { id: '1', name: 'Quality Score (%)', target: 90, actual: 95, weight: 40, type: 'higher', formula: '(actual / target) * 100' },
    { id: '2', name: 'AHT (Seconds)', target: 300, actual: 280, weight: 30, type: 'lower', formula: '(target / actual) * 100' },
    { id: '3', name: 'Adherence (%)', target: 95, actual: 98, weight: 30, type: 'higher', formula: '(actual / target) * 100' }
  ]);
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('');
  const [logAgentFilter, setLogAgentFilter] = useState('all');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Unified Screenshot Upload State
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);
  const [activePhotos, setActivePhotos] = useState<string[]>([]);
  const [activeLinks, setActiveLinks] = useState<string[]>([]);

  const handleScreenshotPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const raw = event.target?.result as string;
            const compressed = await compressImage(raw);
            setActiveScreenshot(compressed);
            toast.success('Screenshot captured and optimized!');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleScreenshotFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const raw = event.target?.result as string;
        const compressed = await compressImage(raw);
        setActiveScreenshot(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  // State to track active dashboard summary interactive model overlays
  const [activeDashboardModal, setActiveDashboardModal] = useState<'queue' | 'qa' | 'inquiry' | 'fintech' | null>(null);

  // Tabby/Tamara search and filter states
  const [ttSearchQuery, setTtSearchQuery] = useState('');
  const [ttFilterStatus, setTtFilterStatus] = useState<'all' | 'not_confirmed' | 'confirmed' | 'contacted'>('all');
  const [ttFilterProvider, setTtFilterProvider] = useState<'all' | 'tabby' | 'tamara' | 'one_time_payment'>('all');
  const [tcFilterClinic, setTcFilterClinic] = useState<string>('all');

  // Login Form States
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Menu / Tab States
  // For TL: 'dashboard' | 'overview' | 'all-requests' | 'report' | 'schedules' | 'time-logs'
  // For Agent: 'dashboard' | 'clocking' | 'apply' | 'my-requests' | 'schedules'
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedDashboardDate, setSelectedDashboardDate] = useState<string>(() => getLocalISOString());
  const [dashboardChartMetric, setDashboardChartMetric] = useState<'all' | 'inquiries' | 'fintech' | 'presence'>('all');

  // Initialize correct active tab based on role
  useEffect(() => {
    if (currentUser) {
      setActiveTab('dashboard');
    }
  }, [currentUser]);

  // Request Form States
  const [swapDate, setSwapDate] = useState('');
  const [swapShift, setSwapShift] = useState(SHIFTS[0].label);
  const [swapTargetAgent, setSwapTargetAgent] = useState('');
  const [swapTargetShift, setSwapTargetShift] = useState(SHIFTS[1].label);
  const [swapNotes, setSwapNotes] = useState('');
  const [swapScreenshot, setSwapScreenshot] = useState<string | null>(null);
  const [swapPhotos, setSwapPhotos] = useState<string[]>([]);
  const [swapLinks, setSwapLinks] = useState<string[]>([]);

  // P2P Trade Form States
  const [p2pSelectedDate, setP2pSelectedDate] = useState('');
  const [p2pTargetAgent, setP2pTargetAgent] = useState('');
  const [p2pTargetShift, setP2pTargetShift] = useState(SHIFTS[1].label);
  const [p2pNotes, setP2pNotes] = useState('');
  const [p2pScreenshot, setP2pScreenshot] = useState<string | null>(null);
  const [p2pPhotos, setP2pPhotos] = useState<string[]>([]);
  const [p2pLinks, setP2pLinks] = useState<string[]>([]);

  // Manual Roster Submission Form States
  const [manualRosterAgent, setManualRosterAgent] = useState('');
  const [manualRosterDate, setManualRosterDate] = useState('');
  const [manualRosterShift, setManualRosterShift] = useState('07:00 - 16:00');
  const [manualRosterNotes, setManualRosterNotes] = useState('');
  const [selectedShiftForActivities, setSelectedShiftForActivities] = useState<ScheduledShift | null>(null);

  const [annualStart, setAnnualStart] = useState('');
  const [annualEnd, setAnnualEnd] = useState('');
  const [annualNotes, setAnnualNotes] = useState('');
  const [annualScreenshot, setAnnualScreenshot] = useState<string | null>(null);
  const [annualPhotos, setAnnualPhotos] = useState<string[]>([]);
  const [annualLinks, setAnnualLinks] = useState<string[]>([]);

  // Report Period Selection State
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Schedules View & Upload states
  const [scheduleViewMode, setScheduleViewMode] = useState<'month' | 'fortnight' | 'week'>('fortnight');
  const [scheduleFilterAgent, setScheduleFilterAgent] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'scheduling' | 'tabby' | 'complaints' | 'comms' | 'cases' | 'inquiries'>('all');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [rosterUploadSuccess, setRosterUploadSuccess] = useState<string | null>(null);
  const [rosterUploadErrors, setRosterUploadErrors] = useState<string[]>([]);
  const [tempSchedules, setTempSchedules] = useState<ScheduledShift[]>([]);
  const [tempNewAgents, setTempNewAgents] = useState<string[]>([]);
  const [tempParsedMeta, setTempParsedMeta] = useState<Record<string, { tlName?: string }>>({});
  const [schedulePageOffset, setSchedulePageOffset] = useState<number>(0);
  const [heatmapMorningTarget, setHeatmapMorningTarget] = useState<number>(() => getStorageItem('heatmap_morning_target', 3));
  const [heatmapAfternoonTarget, setHeatmapAfternoonTarget] = useState<number>(() => getStorageItem('heatmap_afternoon_target', 2));
  const [heatmapNightTarget, setHeatmapNightTarget] = useState<number>(() => getStorageItem('heatmap_night_target', 1));
  const [heatmapConfigureOpen, setHeatmapConfigureOpen] = useState<boolean>(false);

  const [directoryHeaders, setDirectoryHeaders] = useState<string[]>(() => {
    return getStorageItem<string[]>('sched_agent_directory_headers', []);
  });

  // Auto-align schedule page to show today's date context
  useEffect(() => {
    // Priority: If we just uploaded tempSchedules, focus on that context
    const sourceData = tempSchedules.length > 0 ? tempSchedules : schedules;
    const list = Array.from(new Set(sourceData.map(p => p.date))).sort() as string[];
    
    const resolvedDates = list.length > 0 ? list : Array.from({ length: 30 }, (_, i) => {
      const d = new Date(systemTime);
      d.setDate(d.getDate() - 5 + i);
      return getLocalISOString(d);
    });

    if (resolvedDates.length > 0) {
      const todayISO = getLocalISOString();
      const systemTimeISO = getLocalISOString(systemTime);

      let targetDateStr = systemTimeISO;
      
      // If we have tempSchedules, jump to its earliest date
      if (tempSchedules.length > 0 && list.length > 0) {
        targetDateStr = list[0];
      } else if (resolvedDates.includes(todayISO)) {
        targetDateStr = todayISO;
      } else if (!resolvedDates.includes(systemTimeISO)) {
        const sortedWithTarget = [...resolvedDates].sort((a, b) => {
          return Math.abs(new Date(a).getTime() - systemTime.getTime()) - 
                 Math.abs(new Date(b).getTime() - systemTime.getTime());
        });
        targetDateStr = sortedWithTarget[0];
      }

      const targetIdx = resolvedDates.indexOf(targetDateStr);
      if (targetIdx !== -1) {
        let displayDaysCount = 14;
        if (scheduleViewMode === 'week') displayDaysCount = 7;
        if (scheduleViewMode === 'month') displayDaysCount = 31;

        const idealOffset = Math.max(0, Math.min(targetIdx, resolvedDates.length - displayDaysCount));
        setSchedulePageOffset(idealOffset);
      }
    }
  }, [schedules.length, tempSchedules.length, scheduleViewMode, systemTime]);

  

  // Interactive Live Validations
  const [swapWarning, setSwapWarning] = useState<string | null>(null);
  const [annualWarning, setAnnualWarning] = useState<string | null>(null);

  // Trigger swap validation when raw inputs change
  useEffect(() => {
    if (swapDate) {
      const result = validateSwapRequest(swapDate, swapShift, systemTime);
      if (!result.isValid) {
        setSwapWarning(result.message || 'Violation detected');
      } else {
        setSwapWarning(null);
      }
    } else {
      setSwapWarning(null);
    }
  }, [swapDate, swapShift, systemTime]);

  // Trigger annual validation when raw inputs change
  useEffect(() => {
    if (annualStart) {
      const result = validateAnnualRequest(annualStart, systemTime);
      if (!result.isValid) {
        setAnnualWarning(result.message || 'Violation detected');
      } else {
        setAnnualWarning(null);
      }
    } else {
      setAnnualWarning(null);
    }
  }, [annualStart, systemTime]);

  // Handle Login Check
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedInput = loginName.trim().replace(/\s+/g, '');
    if (!trimmedInput) {
      setLoginError('Please enter your username.');
      return;
    }

    // New format must contain a dot and no spaces:
    const isNewFormat = trimmedInput.includes('.') && !trimmedInput.includes(' ');
    if (!isNewFormat) {
      setLoginError("Invalid format! Please enter your username in the 'first_letter.last_name' format (e.g., h.sobhy).");
      return;
    }

    if (!loginPassword) {
      setLoginError('Please enter a password.');
      return;
    }

    const formattedUsername = trimmedInput.toLowerCase();
    const matchedFullName = findAgentByUsername(formattedUsername, agentsList);
    
    // Check for flexible Admin names to NEVER lock them out
    const isAdminUser = 
      formattedUsername === 'h.sobhy' || 
      formattedUsername === 'hesso' || 
      formattedUsername === 'a.hassan' || 
      formattedUsername.includes('amira') ||
      formattedUsername.includes('hesham') ||
      (matchedFullName && matchedFullName.toLowerCase() === 'hesham sobhy') || 
      (matchedFullName && matchedFullName.toLowerCase() === 'amira hassan');

    if (!matchedFullName && !isAdminUser) {
       setLoginError("User not found in the official system directory. Ensure you use exact format (e.g., a.hassan) or ask your TL to add you.");
       return;
    }

    const correspondingFullName = matchedFullName || formattedUsername;

    if (!isAdminUser && (lockedAccounts.includes(formattedUsername) || lockedAccounts.includes(correspondingFullName))) {
      setLoginError('This account is locked. Only Hesham Sobhy or Amira Hassan can reset it.');
      return;
    }

    // Checking password - support both formattedUsername and correspondingFullName for backward compatibility
    const hasStoredPassword = (formattedUsername in credentials) || (correspondingFullName in credentials);

    if (!hasStoredPassword) {
      // First-time user registration flow
      setIsRegistering(true);
      return;
    }

    const correctPassword = credentials[formattedUsername] !== undefined 
      ? credentials[formattedUsername] 
      : credentials[correspondingFullName];

    if (correctPassword !== loginPassword) {
      const currentAttempts = (failedAttempts[formattedUsername] || 0) + 1;
      const updatedAttempts = { ...failedAttempts, [formattedUsername]: currentAttempts };
      setFailedAttempts(updatedAttempts);
      setStorageItem('sched_failed_attempts', updatedAttempts);
      setDoc(doc(db, "system", "sched_failed_attempts"), { data: updatedAttempts }).catch(console.error);

      if (currentAttempts >= 3) {
        if (isAdminUser) {
          // Admins don't get locked out, just reset their failed attempts to 0 or allow infinite retries without locking
          const resetAttempts = { ...failedAttempts, [formattedUsername]: 0 };
          setFailedAttempts(resetAttempts);
          setStorageItem('sched_failed_attempts', resetAttempts);
          setDoc(doc(db, "system", "sched_failed_attempts"), { data: resetAttempts }).catch(console.error);
          setLoginError('Incorrect password. Admin accounts are exempt from locking, please try again.');
        } else {
          const updatedLocked = [...lockedAccounts, formattedUsername];
          setLockedAccounts(updatedLocked);
          setStorageItem('sched_locked_accounts', updatedLocked);
          setDoc(doc(db, "system", "sched_locked_accounts"), { data: updatedLocked }).catch(console.error);
          setLoginError('This account is now locked because of too many wrong password attempts. Please contact Hesham Sobhy or Amira Hassan to reset it.');
        }
      } else {
        setLoginError(`Incorrect password. You have ${3 - currentAttempts} attempts left.`);
      }
      return;
    }

    // Success login
    let needsLockUpdate = false;
    let updatedLocked = [...lockedAccounts];
    if (updatedLocked.includes(formattedUsername)) {
      updatedLocked = updatedLocked.filter(a => a !== formattedUsername);
      needsLockUpdate = true;
    }
    if (updatedLocked.includes(correspondingFullName)) {
      updatedLocked = updatedLocked.filter(a => a !== correspondingFullName);
      needsLockUpdate = true;
    }
    if (needsLockUpdate) {
      setLockedAccounts(updatedLocked);
      setStorageItem('sched_locked_accounts', updatedLocked);
      setDoc(doc(db, "system", "sched_locked_accounts"), { data: updatedLocked }).catch(console.error);
    }

    if (failedAttempts[formattedUsername]) {
      const updatedAttempts = { ...failedAttempts };
      delete updatedAttempts[formattedUsername];
      setFailedAttempts(updatedAttempts);
      setStorageItem('sched_failed_attempts', updatedAttempts);
      setDoc(doc(db, "system", "sched_failed_attempts"), { data: updatedAttempts }).catch(console.error);
    }

    const userRole = isQAName(correspondingFullName) ? 'qa' : isTLName(correspondingFullName) ? 'tl' : 'agent';
    const authenticatedUser: User = {
      id: `usr_${Date.now()}`,
      name: correspondingFullName,
      role: userRole
    };

    setCurrentUser(authenticatedUser);
    setStorageItem('sched_current_user', authenticatedUser);

    setDoc(doc(db, "users", correspondingFullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()), authenticatedUser).catch(console.error);

    // If agent is new or not in the cached list, add using corresponding fullName or username
    if (userRole === 'agent' && !agentsList.some(a => a?.toLowerCase() === formattedUsername || a?.toLowerCase() === correspondingFullName.toLowerCase() || getUsernameFromFullName(a) === formattedUsername)) {
      const updatedList = [...agentsList, correspondingFullName];
      setAgentsList(updatedList);
      setStorageItem('sched_agents_list', updatedList);
    }

    if (userRole === 'agent') {
      const todayStr = getLocalISOString();
      const active = timeLogs.find(l => {
        const ln = l.agentName?.toLowerCase();
        return (ln === formattedUsername || ln === correspondingFullName.toLowerCase()) && l.date === todayStr && !l.clockOut;
      });
      if (!active) {
        const newLog: TimeLog = {
          id: `clock_${Date.now()}`,
          agentName: correspondingFullName,
          date: todayStr,
          clockIn: new Date().toISOString(),
          activities: [],
          status: 'working'
        };
        const updated = [newLog, ...timeLogs];
        setTimeLogs(updated);
        setStorageItem('sched_time_logs', updated);
        // Sync to Firestore
        setDoc(doc(db, "timelogs", newLog.id), newLog).catch(e => console.error("Login Clock In Error:", e));
      }
    }

    // Reset login fields
    setLoginName('');
    setLoginPassword('');
    setIsRegistering(false);
  };

  // Complete Password Creation for first usage
  const handleRegisterConfirm = () => {
    const trimmedInput = loginName.trim().toLowerCase().replace(/\s+/g, '');
    const matchedFullName = findAgentByUsername(trimmedInput, agentsList);
    const finalName = trimmedInput;
    const correspondingFullName = matchedFullName || finalName;

    if (!finalName || !loginPassword) {
      setLoginError('Mandatory login info missing.');
      return;
    }

    const updatedCreds = { 
      ...credentials, 
      [finalName]: loginPassword,
      [correspondingFullName]: loginPassword
    };
    setCredentials(updatedCreds);
    setStorageItem('sched_credentials', updatedCreds);
    setDoc(doc(db, "system", "sched_credentials"), { data: updatedCreds }).catch(console.error);

    if (failedAttempts[finalName]) {
      const updatedAttempts = { ...failedAttempts };
      delete updatedAttempts[finalName];
      setFailedAttempts(updatedAttempts);
      setStorageItem('sched_failed_attempts', updatedAttempts);
      setDoc(doc(db, "system", "sched_failed_attempts"), { data: updatedAttempts }).catch(console.error);
    }

    const userRole = isQAName(correspondingFullName) ? 'qa' : isTLName(correspondingFullName) ? 'tl' : 'agent';
    const authenticatedUser: User = {
      id: `usr_${Date.now()}`,
      name: correspondingFullName,
      role: userRole
    };

    setCurrentUser(authenticatedUser);
    setStorageItem('sched_current_user', authenticatedUser);
    
    // Explicitly write user to Firestore for real-time presence across devices
    setDoc(doc(db, "users", correspondingFullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()), authenticatedUser).catch(e => console.error("User doc sync error:", e));

    if (userRole === 'agent' && !agentsList.some(a => a?.toLowerCase() === finalName || a?.toLowerCase() === correspondingFullName.toLowerCase() || getUsernameFromFullName(a) === finalName)) {
      const updatedList = [...agentsList, correspondingFullName];
      setAgentsList(updatedList);
      setStorageItem('sched_agents_list', updatedList);
    }

    if (userRole === 'agent') {
      const todayStr = getLocalISOString();
      const active = timeLogs.find(l => {
        const ln = l.agentName?.toLowerCase();
        return (ln === finalName || ln === correspondingFullName.toLowerCase()) && l.date === todayStr && !l.clockOut;
      });
      if (!active) {
        const newLog: TimeLog = {
          id: `clock_${Date.now()}`,
          agentName: correspondingFullName,
          date: todayStr,
          clockIn: new Date().toISOString(),
          activities: [],
          status: 'working'
        };
        const updated = [newLog, ...timeLogs];
        setTimeLogs(updated);
        setStorageItem('sched_time_logs', updated);
        // Sync to Firestore
        setDoc(doc(db, "timelogs", newLog.id), newLog).catch(e => console.error("Registration Clock In Error:", e));
      }
    }

    setLoginName('');
    setLoginPassword('');
    setIsRegistering(false);
    setLoginError('');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('sched_current_user');
  };

  // Activity / Inactivity tracking (Auto Sign out after 1 hour of no use)
  const [lastUserInteraction, setLastUserInteraction] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!currentUser) return;
    
    const handleInteraction = () => {
      setLastUserInteraction(Date.now());
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('scroll', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const diffMs = Date.now() - lastUserInteraction;
      if (diffMs >= 3600000) { // 1 hour inactivity
        handleSignOut();
        toast.error("You have been signed out due to 1 hour of inactivity. Please sign in again.");
      }
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [currentUser, lastUserInteraction]);

  // Real-time compliance overstay alerts background checks (break, lunch, restroom > 10m) & absent alerts
  const [notifiedOverstays, setNotifiedOverstays] = useState<Record<string, boolean>>(() => {
    return getStorageItem<Record<string, boolean>>('sched_notified_overstays', {});
  });
  const [notifiedAbsences, setNotifiedAbsences] = useState<Record<string, boolean>>(() => {
    return getStorageItem<Record<string, boolean>>('sched_notified_absences', {});
  });

  useEffect(() => {
    if (!currentUser) return;
    
    let overstaysUpdated = false;
    const newNotifiedOverstays = { ...notifiedOverstays };
    
    // Check for exceeding break / lunch / restroom / meeting / one_on_one / personal
    agentsList.forEach(agent => {
      const elapsed = getActiveActivityElapsed(agent);
      if (elapsed && elapsed.exceeded) {
        const notifKey = `${elapsed.id}_${elapsed.type}`;
        if (!newNotifiedOverstays[notifKey]) {
          // Register as notified
          newNotifiedOverstays[notifKey] = true;
          overstaysUpdated = true;

          const labelMap: Record<string, string> = {
            break: 'Break',
            lunch: 'Lunch',
            restroom: 'Restroom Break',
            meeting: 'Team Meeting',
            one_on_one: '1:1 Session',
            personal: 'Personal Break'
          };
          const readableType = labelMap[elapsed.type] || elapsed.type;

          // 1. Notify the agent
          addSystemNotification(
            `⚠️ Activity Warning: Exceeding ${readableType}`,
            `You have been on ${readableType} for ${!isNaN(Math.floor(elapsed.duration)) ? Math.floor(elapsed.duration) : 0} minutes, exceeding the standard limit of ${elapsed.limit} minutes. Please resume working.`,
            "compliance",
            agent,
            `overstay_agent_${notifKey}`
          );

          const assignedTL = getAgentTL(agent);
          const targetNotifUser = assignedTL !== 'Unassigned' ? assignedTL : 'tl';
          addSystemNotification(
            `🚨 Alert: ${formatAgentName(agent)} overstaying ${readableType}`,
            `Agent ${formatAgentName(agent)} has exceeded the standard ${elapsed.limit} minutes limit for ${readableType}. Current duration: ${!isNaN(Math.floor(elapsed.duration)) ? Math.floor(elapsed.duration) : 0} minutes.`,
            "compliance",
            targetNotifUser,
            `overstay_tl_${notifKey}`
          );
        }
      }
    });
    
    if (overstaysUpdated) {
      setNotifiedOverstays(newNotifiedOverstays);
      localStorage.setItem('sched_notified_overstays', JSON.stringify(newNotifiedOverstays));
    }

    // Check for shifts absences
    const todayStr = getLocalISOString();
    const todaySchedules = schedules.filter(s => s.date === todayStr);
    
    let absencesUpdated = false;
    const newNotifiedAbsences = { ...notifiedAbsences };

    todaySchedules.forEach(sched => {
      const agent = sched.agentName;
      const shiftLabel = sched.shiftLabel; // e.g., "07:00 - 16:00" or "22:00 - 07:00"
      
      const notifKey = `${todayStr}_${agent}_${shiftLabel}`;
      if (!newNotifiedAbsences[notifKey]) {
        // Extract start hour
        const startHourStr = shiftLabel.split('-')[0].trim(); // "07:00"
        const parts = startHourStr.split(':');
        if (parts.length < 2) return;
        const startHour = parseInt(parts[0], 10);
        const startMinute = parseInt(parts[1], 10);

        // Build shift start Date object today
        const shiftStart = new Date();
        shiftStart.setHours(startHour, startMinute, 0, 0);

        // 30 minutes threshold (e.g. 1800000ms delay)
        const lateThresholdMs = 30 * 60 * 1000;
        const nowMs = currentTime.getTime();

        // Check if now is past shiftStart + 30 minutes
        if (nowMs > (shiftStart.getTime() + lateThresholdMs)) {
          // Is agent logged in today (do they have a clock-in log for today?)
          const hasClockInToday = timeLogs.some(log => 
            log.agentName?.toLowerCase() === agent.toLowerCase() && 
            log.date === todayStr && 
            !!log.clockIn
          );

          if (!hasClockInToday) {
            // Register as notified
            newNotifiedAbsences[notifKey] = true;
            absencesUpdated = true;

            const assignedTL = getAgentTL(agent);
            const targetNotifUser = assignedTL !== 'Unassigned' ? assignedTL : 'tl';
            addSystemNotification(
              `❌ Absence Warning: ${formatAgentName(agent)} did not clock in`,
              `Agent ${formatAgentName(agent)} was scheduled for shift ${shiftLabel} today starting at ${startHourStr}, but has failed to clock in within 30 minutes of shift commencement.`,
              "absence",
              targetNotifUser,
              `absence_tl_${notifKey}`
            );
          }
        }
      }
    });
    
    if (absencesUpdated) {
      setNotifiedAbsences(newNotifiedAbsences);
      localStorage.setItem('sched_notified_absences', JSON.stringify(newNotifiedAbsences));
    }

  }, [currentTime, timeLogs, schedules, agentsList, currentUser, notifiedOverstays, notifiedAbsences]);

  const handleAssignSupport = () => {
    if (!targetSupportAgent || !currentUser) return;
    const newAssignments = {
      ...supportAssignments,
      [targetSupportAgent]: {
        assignedBy: currentUser.name,
        assignedAt: new Date().toISOString()
      }
    };
    setSupportAssignments(newAssignments);
    setStorageItem('sched_support_assignments', newAssignments);
    setTargetSupportAgent('');
  };

  const handleRevokeSupport = (name: string) => {
    const newAssignments = { ...supportAssignments };
    delete newAssignments[name];
    setSupportAssignments(newAssignments);
    setStorageItem('sched_support_assignments', newAssignments);
  };

  // Create Swap Request
  const handleCreateSwap = async (e: FormEvent) => {
    e.preventDefault();

    if (!swapDate || !swapTargetAgent) {
      toast.error('Must select a swap date and partner agent.');
      return;
    }
    if (isFormSubmitting) return;

    const name = currentUser?.name || 'Unknown Agent';

    // Restrict swaps between agents of different LOBs
    const myLOB = getAgentLOB(name);
    const targetLOB = getAgentLOB(swapTargetAgent);
    if (myLOB !== targetLOB) {
      toast.error(`Cannot request swap: Swap requests are strictly permitted only between agents of the same LOB.

Your LOB: ${myLOB}
${swapTargetAgent}'s LOB: ${targetLOB}`);
      return;
    }

    const validation = validateSwapRequest(swapDate, swapShift, systemTime);

    // Swap cannot be less than 24 hours of the shift. We give Warning and block.
    if (!validation.isValid) {
      toast.error(`Cannot submit request: ${validation.message}`);
      return;
    }

    setIsFormSubmitting(true);
    try {
      const newRequest: SwapRequest = {
        id: `swap_${Date.now()}`,
        agentName: name,
        type: 'swap',
        date: swapDate,
        shift: swapShift,
        swapWithAgent: swapTargetAgent,
        swapWithShift: swapTargetShift,
        status: 'pending_partner',
        createdAt: new Date().toISOString(),
        notes: swapNotes,
        screenshot: swapScreenshot ? swapScreenshot : undefined, photos: swapPhotos, links: swapLinks
      };

      setRequests(prev => {
        const updated = [newRequest, ...prev];
        setStorageItem('sched_requests', updated);
        return updated;
      });

      // Sync to Firestore
      await setDoc(doc(db, "scheduling_requests", newRequest.id), newRequest);

      addSystemNotification(
        `🔄 New Swap Request: ${formatAgentName(name)}`,
        `${formatAgentName(name)} requested a shift swap with ${formatAgentName(swapTargetAgent)} for ${swapDate}.`,
        'schedule',
        'tl'
      );

      // Reset form
      setSwapDate('');
      setSwapNotes('');
      setSwapScreenshot(null); setSwapPhotos([]); setSwapLinks([]);
      setSwapShift(SHIFTS[0].label);
      setSwapTargetAgent('');
      setSwapTargetShift(SHIFTS[1].label);

      setSubmissionConfirmation({
        title: "Swap Filed Successfully! 🔄",
        message: `Your shift swap application has been submitted to your partner agent (${swapTargetAgent}). Once approved by them, Team Leaders will review for final approval. Double-Submission check holds.`,
        type: 'swap_request',
        referenceId: newRequest.id
      });
      setActiveTab('my-requests');
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while creating swap request. Please try again.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Create Annual Leave Request
  const handleCreateAnnual = async (e: FormEvent) => {
    e.preventDefault();

    if (!annualStart || !annualEnd) {
      toast.error('Must select start and end dates.');
      return;
    }
    if (isFormSubmitting) return;

    if (new Date(annualStart) > new Date(annualEnd)) {
      toast.error('Start date must be before or equal to the end date.');
      return;
    }

    const name = currentUser?.name || 'Unknown Agent';
    const validation = validateAnnualRequest(annualStart, systemTime);

    // Check if it's less than 14 days. If so, block.
    if (!validation.isValid) {
      toast.error(`Cannot submit request: ${validation.message}`);
      return;
    }

    setIsFormSubmitting(true);
    try {
      const newRequest: AnnualRequest = {
        id: `ann_${Date.now()}`,
        agentName: name,
        type: 'annual',
        startDate: annualStart,
        endDate: annualEnd,
        status: 'pending',
        createdAt: new Date().toISOString(),
        notes: annualNotes,
        screenshot: annualScreenshot ? annualScreenshot : undefined, photos: annualPhotos, links: annualLinks
      };

      setRequests(prev => {
        const updated = [newRequest, ...prev];
        setStorageItem('sched_requests', updated);
        return updated;
      });

      // Sync to Firestore
      await setDoc(doc(db, "scheduling_requests", newRequest.id), newRequest);

      addSystemNotification(
        `✈️ New Annual Leave: ${formatAgentName(name)}`,
        `${formatAgentName(name)} requested an annual leave from ${annualStart} to ${annualEnd}.`,
        'schedule',
        'tl'
      );

      // Reset form
      setAnnualStart('');
      setAnnualEnd('');
      setAnnualNotes('');
      setAnnualScreenshot(null); setAnnualPhotos([]); setAnnualLinks([]);

      setSubmissionConfirmation({
        title: "Annual Leave Filed! ✈️",
        message: `Your annual leave request from ${annualStart} to ${annualEnd} has been submitted to the Team Leader for approval. Double-Submission guard is active.`,
        type: 'annual_leave',
        referenceId: newRequest.id
      });
      setActiveTab('my-requests');
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while filing annual leave. Please try again.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Partner Decision (Agree / Decline Swap Request)
  const handlePartnerDecision = (requestId: string, agree: boolean) => {
    if (!currentUser) return;

    const updated = requests.map(req => {
      if (req.id === requestId && req.type === 'swap') {
        const swapReq = req as SwapRequest;
        if (swapReq.swapWithAgent.toLowerCase() === currentUser?.name?.toLowerCase() && swapReq.status === 'pending_partner') {
          const updatedReq = {
            ...swapReq,
            status: agree ? 'pending' : 'declined_by_partner',
            partnerActionAt: new Date().toISOString()
          } as SwapRequest;
          // Sync to Firestore
          setDoc(doc(db, "scheduling_requests", req.id), updatedReq).catch(e => console.error("Partner Decision Error:", e));
          return updatedReq;
        }
      }
      return req;
    });

    setRequests(updated);
    setStorageItem('sched_requests', updated);

    if (agree) {
      toast.error('You have agreed to the swap. The request is now forwarded to Team Leaders for final decision.');
    } else {
      toast.error('You have declined the swap request.');
    }
  };

  const handleBulkTLApproval = (requestIds: string[], approve: boolean) => {
    if (!currentUser || currentUser.role !== 'tl') return;

    const idSet = new Set(requestIds);
    const updated = requests.map(req => {
      if (idSet.has(req.id)) {
        let violation = false;
        let vMsg = '';

        if (req.type === 'swap') {
          const v = validateSwapRequest(req.date, req.shift, new Date(req.createdAt));
          if (!v.isValid) {
            violation = true;
            vMsg = v.message || '';
          }
        } else {
          const v = validateAnnualRequest(req.startDate, new Date(req.createdAt));
          if (!v.isValid) {
            violation = true;
            vMsg = v.message || '';
          }
        }

        const updatedReq = {
          ...req,
          status: (approve ? 'approved' : 'declined') as 'approved' | 'declined',
          actionBy: currentUser.name,
          actionAt: new Date().toISOString(),
          ruleViolation: violation,
          violationMessage: violation ? vMsg : undefined
        };
        // Sync to Firestore
        setDoc(doc(db, "scheduling_requests", req.id), updatedReq).catch(e => console.error("TL Approval Error:", e));
        return updatedReq;
      }
      return req;
    });

    setRequests(updated);
    setStorageItem('sched_requests', updated);
    toast.success(`Successfully ${approve ? 'approved' : 'declined'} ${requestIds.length} requests.`);
  };

  // TL Action (Approve / Decline)
  const handleTLApproval = (requestId: string, approve: boolean) => {
    if (!currentUser || currentUser.role !== 'tl') return;

    const updated = requests.map(req => {
      if (req.id === requestId) {
        // Double check validations before making decision
        let violation = false;
        let vMsg = '';

        if (req.type === 'swap') {
          const v = validateSwapRequest(req.date, req.shift, new Date(req.createdAt));
          if (!v.isValid) {
            violation = true;
            vMsg = v.message || '';
          }
        } else {
          const v = validateAnnualRequest(req.startDate, new Date(req.createdAt));
          if (!v.isValid) {
            violation = true;
            vMsg = v.message || '';
          }
        }

        const updatedReq = {
          ...req,
          status: (approve ? 'approved' : 'declined') as 'approved' | 'declined',
          actionBy: currentUser.name,
          actionAt: new Date().toISOString(),
          ruleViolation: violation,
          violationMessage: violation ? vMsg : undefined
        };
        // Sync to Firestore
        setDoc(doc(db, "scheduling_requests", req.id), updatedReq).catch(e => console.error("TL Approval Error:", e));
        return updatedReq;
      }
      return req;
    });

    setRequests(updated);
    setStorageItem('sched_requests', updated);
  };

  // Agent cancelling own pending request
  const handleCancelRequest = (requestId: string) => {
    const confirmation = window.confirm('Are you sure you want to cancel this pending request?');
    if (!confirmation) return;

    const updated = requests.filter(req => !(req.id === requestId && req.agentName === currentUser?.name && (req.status === 'pending' || req.status === 'pending_partner')));
    setRequests(updated);
    setStorageItem('sched_requests', updated);
    
    // Sync to Firestore
    deleteDoc(doc(db, "scheduling_requests", requestId)).catch(e => console.error("Request Cancel Error:", e));
  };

  // Download Report Helpers
  const downloadReportTxt = (period: 'day' | 'week' | 'month' | 'year') => {
    const content = generateTextReport(requests, period, systemTime);
    const filename = `Scheduling_Report_${period}_${getLocalISOString()}.txt`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFullCSV = () => {
    const content = generateCSV(requests);
    const filename = `Scheduling_DB_Export_${getLocalISOString()}.csv`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadInquiriesReport = () => {
    const content = generateInquiriesCSV(inquiries);
    const filename = `Inquiries_Report_${getLocalISOString()}.csv`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  

  const handleDownloadFintechRequestsReport = () => {
    const content = generateFintechRequestsCSV(tabbyTamaraRequests);
    const filename = `Fintech_Transactions_Report_${getLocalISOString()}.csv`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFintechComplaintsReport = () => {
    const content = generateFintechComplaintsCSV(tabbyTamaraComplaints);
    const filename = `Fintech_Complaints_Report_${getLocalISOString()}.csv`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadClientCommsReport = () => {
    const content = generateClientCommsCSV(clientComms);
    const filename = `Client_Communications_Report_${getLocalISOString()}.csv`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCasesReport = () => {
    const content = generateCasesCSV(cases);
    const filename = `Patient_Cases_Report_${getLocalISOString()}.csv`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadRtmLiveMetricsDigest = () => {
    let digest = `RTM Live Attendance Digest - ${new Date().toLocaleString()}
`;
    digest += "=================================================\\n\\n";
    
    const working: string[] = [];
    const breaks: string[] = [];
    const lunches: string[] = [];
    const restrooms: string[] = [];
    const meetings: string[] = [];
    const oneOnOne: string[] = [];
    const offlines: string[] = [];
    
    agentsList.forEach(aName => {
        const log = timeLogs.find(l => l.agentName?.toLowerCase() === aName.toLowerCase() && !l.clockOut);
        if(!log) {
            offlines.push(aName);
        } else {
            if(log.status === 'working') working.push(aName);
            else if(log.status === 'break') breaks.push(aName);
            else if(log.status === 'lunch') lunches.push(aName);
            else if(log.status === 'restroom') restrooms.push(aName);
            else if(log.status === 'meeting') meetings.push(aName);
            else if(log.status === 'one_on_one') oneOnOne.push(aName);
            else if((log.status as string) === 'offline') offlines.push(aName);
            else working.push(aName);
        }
    });

    digest += `Active Staff Count: ${agentsList.length - offlines.length}
`;
    digest += "-------------------------------------------------\n";

    digest += `Working: ${working.join(', ') || 'None'}
`;
    digest += `On Break: ${breaks.join(', ') || 'None'}
`;
    digest += `On Lunch: ${lunches.join(', ') || 'None'}
`;
    digest += `Restroom: ${restrooms.join(', ') || 'None'}
`;
    digest += `Meeting: ${meetings.join(', ') || 'None'}
`;
    digest += `1:1 Session: ${oneOnOne.join(', ') || 'None'}
`;
    digest += `Offline: ${offlines.join(', ') || 'None'}
`;

    const blob = new Blob([digest], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RTM_Digest_${getLocalISOString()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSchedulesReport = () => {
    const content = generateSchedulesCSV(schedules);
    const filename = `Master_Schedules_Report_${getLocalISOString()}.csv`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download schedule CSV template
  const downloadScheduleTemplate = () => {
    const content = generateScheduleTemplateFile();
    const filename = `Agent_Schedule_Template.csv`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleScheduleFile(file);
    }
  };

  const handleScheduleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleScheduleFile(e.target.files[0]);
    }
  };

  const handleScheduleFile = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    setTempSchedules([]);
    setTempNewAgents([]);

    const reader = new FileReader();
    const isJson = file.name.endsWith('.json');
    
    if (isJson) {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const validShifts = parsed.filter(item => item && (item.agentName || item.AgentName) && (item.date || item.Date));
            if (validShifts.length > 0) {
              const formatted: ScheduledShift[] = validShifts.map(s => ({
                id: s.id || `sch_json_${Date.now()}_${Math.random()}`,
                agentName: s.agentName || s.AgentName,
                date: s.date || s.Date,
                shiftLabel: s.shiftLabel || s.ShiftLabel || s.shift || s.Shift || '07:00 - 16:00'
              }));
              setUploadSuccess(`Successfully parsed ${formatted.length} shifts. ${isSuperAdmin ? 'Updating system automatically...' : 'Review the draft below.'}`);
              if (isSuperAdmin) {
                commitSchedulesManual(formatted, [], {});
              } else {
                setTempSchedules(formatted);
                setTempNewAgents([]);
                setTempParsedMeta({});
              }
              return;
            }
          }
          throw new Error("Invalid schedule shift array format in JSON.");
        } catch (e: any) {
          setUploadError(`Failed to parse JSON file: ${e.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("No worksheets found in this file.");
          }
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet);
          if (!csvText || !csvText.trim()) {
            throw new Error("Could not extract sheet content.");
          }
          
          const result = parseScheduleCSV(csvText, agentsList);
          if (result.errors.length > 0) {
            setUploadError(`Parsed with warnings/errors: 
${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? `
...and ${result.errors.length - 5} more errors` : ''}`);
          }
          
          if (result.schedules.length === 0) {
            if (result.errors.length === 0) setUploadError('Could not find any schedule entries to parse.');
          } else {
            setUploadSuccess(`Successfully parsed ${result.schedules.length} shifts. ${isSuperAdmin ? 'Updating system automatically...' : 'Review the draft below.'}`);
            if (isSuperAdmin) {
              commitSchedulesManual(result.schedules, result.newAgents, result.parsedMeta);
            } else {
              setTempSchedules(result.schedules);
              setTempNewAgents(result.newAgents);
              setTempParsedMeta(result.parsedMeta);
            }
          }
        } catch (err: any) {
          const textReader = new FileReader();
          textReader.onload = (eText) => {
            try {
              const text = eText.target?.result as string;
              if (text) {
                const result = parseScheduleCSV(text, agentsList);
                if (result.schedules.length > 0) {
                  setUploadSuccess(`Successfully parsed ${result.schedules.length} shifts. ${isSuperAdmin ? 'Updating system automatically...' : 'Review the draft below.'}`);
                  if (isSuperAdmin) {
                    commitSchedulesManual(result.schedules, result.newAgents, result.parsedMeta);
                  } else {
                    setTempSchedules(result.schedules);
                    setTempNewAgents(result.newAgents);
                    setTempParsedMeta(result.parsedMeta);
                  }
                } else {
                  setUploadError(`Failed to parse file: ${err.message || 'Unknown error'}`);
                }
              }
            } catch (fallbackErr: any) {
              setUploadError(`Failed to parse file: ${fallbackErr.message || 'Unknown error'}`);
            }
          };
          textReader.readAsText(file);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const commitSchedules = () => {
    commitSchedulesManual(tempSchedules, tempNewAgents, tempParsedMeta);
  };

  const clearTargetSchedules = async () => {
    const doubleCheck = window.confirm('Are you sure you want to completely erase the current schedule roster?');
    if (doubleCheck) {
      try {
        setSchedules([]);
        
        // Also query and delete all docs under the 'schedules' collection in Firestore
        const snap = await getDocs(collection(db, "schedules"));
        const batch = writeBatch(db);
        snap.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        
        toast.success('Schedules cleared.');
      } catch (err: any) {
        console.error("Purging Firestore schedules failed: ", err);
        toast.error('Failed to clear database schedules.');
      }
    }
  };

  const handleScheduleUpload = (file: File) => {
    setRosterUploadSuccess(null);
    setRosterUploadErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          toast.error("File is empty.");
          return;
        }

        const parsed = parseScheduleCSV(text, agentsList);
        
        if (parsed.schedules.length > 0) {
          setSchedules(parsed.schedules);
          
          const batch = writeBatch(db);
          parsed.schedules.forEach(s => {
            batch.set(doc(db, "schedules", s.id), s);
          });
          batch.commit().catch(e => console.error("Batch schedules sync error:", e));
          
          setRosterUploadSuccess(`${parsed.schedules.length} shifts successfully imported.`);
          toast.success(`${parsed.schedules.length} shifts imported`);

          // Dynamically learn any new agent names and add them to the workspace roster so they can be managed
          if (parsed.newAgents && parsed.newAgents.length > 0) {
            const allKnown = new Set(agentsList);
            parsed.newAgents.forEach(a => {
              if (a && a.trim()) {
                allKnown.add(a.trim());
              }
            });
            const updatedList = Array.from(allKnown);
            setAgentsList(updatedList);
            setStorageItem('sched_agents_list', updatedList);
          }
        } else {
          toast.error("No valid shifts could be parsed.");
        }

        if (parsed.errors && parsed.errors.length > 0) {
          setRosterUploadErrors(parsed.errors);
          toast.error(`Import completed with ${parsed.errors.length} error(s).`);
        }
      } catch (err: any) {
        toast.error(`Error reading file: ${err?.message || 'Unknown error'}`);
        setRosterUploadErrors([`Error: ${err?.message || 'Unknown error'}`]);
      }
    };
    reader.readAsText(file);
  };

  const handleClearUploadedSchedules = () => {
    setRosterUploadSuccess(null);
    setRosterUploadErrors([]);
    toast.success("Uploaded schedule cleared. Demo schedule restored.");
  };

  const handleParsedDirectory = (result: ReturnType<typeof parseAgentDirectoryCSV>) => {
    if (result.errors.length > 0) toast.error(`Warnings: ${result.errors.slice(0, 3).join(', ')}`);
    
    if (result.directory.length > 0) {
       setAgentDirectory(result.directory);
       setDirectoryHeaders(result.headers);
       setStorageItem('sched_agent_directory', result.directory);
       setStorageItem('sched_agent_directory_headers', result.headers);
       
       // Write to Firestore system docs
       setDoc(doc(db, "system", "sched_agent_directory"), { data: result.directory }).catch(console.error);
       setDoc(doc(db, "system", "sched_agent_directory_headers"), { data: result.headers }).catch(console.error);

       const allKnown = new Set(agentsList);
       result.directory.forEach(a => allKnown.add(a.agentName));
       const updatedList = Array.from(allKnown);
       setAgentsList(updatedList);
       setStorageItem('sched_agents_list', updatedList);
       setDoc(doc(db, "system", "sched_agents_list"), { data: updatedList }).catch(console.error);

       const newMeta = { ...getAgentMeta() };
       let hasMetaUpdate = false;
       const tlHeader = result.headers.find(h => {
           const lh = h ? String(h).toLowerCase().trim() : ' ';
           return lh === 'tl' || lh === 'team leader' || lh.includes('manager') || lh.includes('supervisor') || lh.includes('lead') || lh === 'tl name';
       });
       const roleHeader = result.headers.find(h => {
           const lh = h ? String(h).toLowerCase().trim() : ' ';
           return lh === 'role' || lh === 'lob' || lh.includes('account') || lh.includes('designation') || lh.includes('job title') || lh.includes('department') || lh.includes('function') || lh.includes('business');
       });
       
       if (tlHeader || roleHeader) {
           result.directory.forEach(a => {
               let updated = false;
               if (!newMeta[a.agentName]) newMeta[a.agentName] = { roleType: '', tlName: '' };
               if (tlHeader && a.data[tlHeader] !== undefined && a.data[tlHeader] !== null) {
                   const val = String(a.data[tlHeader]).trim();
                   if (val) {
                       newMeta[a.agentName].tlName = val;
                       updated = true;
                   }
               }
               if (roleHeader && a.data[roleHeader] !== undefined && a.data[roleHeader] !== null) {
                   const val = String(a.data[roleHeader]).trim();
                   if (val) {
                       newMeta[a.agentName].roleType = val;
                       updated = true;
                   }
               }
               if (updated) hasMetaUpdate = true;
           });
           if (hasMetaUpdate) {
               setStorageItem('sched_agent_meta', newMeta);
               setDoc(doc(db, "system", "sched_agent_meta"), { data: newMeta }).catch(console.error);
           }
       }

       // Sync individuals into the users collection as real registeredUsers profiles with smart headers
       result.directory.forEach(a => {
           const userDocId = a.agentName ? String(a.agentName).trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
           if (userDocId) {
               const emailVal = (() => {
                   for (const k of Object.keys(a.data)) {
                       const lk = k.toLowerCase().trim().replace(/[\s_-]+/g, '');
                       if (['email', 'mail', 'corpemail', 'corporateemail', 'address'].some(key => lk.includes(key) || key.includes(lk))) {
                           return a.data[k] !== undefined && a.data[k] !== null ? String(a.data[k]).trim() : '';
                       }
                   }
                   return '';
               })();
               const phoneVal = (() => {
                   for (const k of Object.keys(a.data)) {
                       const lk = k.toLowerCase().trim().replace(/[\s_-]+/g, '');
                       if (['phone', 'mobile', 'tel', 'contact', 'number', 'phonenumber'].some(key => lk.includes(key) || key.includes(lk))) {
                           return a.data[k] !== undefined && a.data[k] !== null ? String(a.data[k]).trim() : '';
                       }
                   }
                   return '';
               })();
               const lobVal = (() => {
                   for (const k of Object.keys(a.data)) {
                       const lk = k.toLowerCase().trim().replace(/[\s_-]+/g, '');
                       if (['lob', 'lineofbusiness', 'channel', 'queue', 'department', 'function'].some(key => lk.includes(key) || key.includes(lk))) {
                           return a.data[k] !== undefined && a.data[k] !== null ? String(a.data[k]).trim() : '';
                       }
                   }
                   return '';
               })();
               const lobTeamVal = (() => {
                   for (const k of Object.keys(a.data)) {
                       const lk = k.toLowerCase().trim().replace(/[\s_-]+/g, '');
                       if (['lobteam', 'team', 'group', 'teamname', 'subteam'].some(key => lk.includes(key) || key.includes(lk))) {
                           return a.data[k] !== undefined && a.data[k] !== null ? String(a.data[k]).trim() : '';
                       }
                   }
                   return '';
               })();
               const rawRole = (() => {
                   for (const k of Object.keys(a.data)) {
                       const lk = k.toLowerCase().trim().replace(/[\s_-]+/g, '');
                       if (['role', 'designation', 'jobtitle', 'title', 'position'].some(key => lk.includes(key) || key.includes(lk))) {
                           return a.data[k] !== undefined && a.data[k] !== null ? String(a.data[k]).trim() : '';
                         }
                    }
                    return '';
                })();
               const teamLeaderVal = (() => {
                   for (const k of Object.keys(a.data)) {
                       const lk = k.toLowerCase().trim().replace(/[\s_-]+/g, '');
                       if (['teamleader', 'tl', 'supervisor', 'leader', 'manager', 'lead', 'tlname'].some(key => lk.includes(key) || key.includes(lk))) {
                           return a.data[k] !== undefined && a.data[k] !== null ? String(a.data[k]).trim() : '';
                       }
                   }
                   return '';
               })();

               let roleVal: 'agent' | 'tl' | 'qa' = 'agent';
               const rl = rawRole.toLowerCase();
               if (rl.includes('tl') || rl.includes('leader') || rl.includes('lead') || rl.includes('supervisor') || rl.includes('manager')) {
                   roleVal = 'tl';
               } else if (rl.includes('qa') || rl.includes('quality') || rl.includes('analyst')) {
                   roleVal = 'qa';
               }

               const userProfile = {
                   id: `usr_import_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                   name: a.agentName,
                   role: roleVal,
                   email: emailVal || undefined,
                   phone: phoneVal || undefined,
                   lob: lobVal || undefined,
                   lobTeam: lobTeamVal || undefined,
                   teamLeader: teamLeaderVal || undefined
               };

               setDoc(doc(db, "users", userDocId), userProfile, { merge: true }).catch(err => {
                   console.error("Failed to import user profile:", err);
               });
           }
       });

       toast.success(`Successfully loaded and synchronized ${result.directory.length} directory records!`);
    } else {
       throw new Error("No directory entries parsed.");
    }
  };

  const handleDirectoryFile = (file: File) => {
    const isJson = file.name.endsWith('.json');
    if (isJson) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
           const text = event.target?.result as string;
           const parsed = JSON.parse(text);
           if (Array.isArray(parsed) && parsed.length > 0) {
             const headers = Object.keys(parsed[0]);
             const csvText = [
               headers.join(','),
               ...parsed.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
             ].join('\n');
             
             const result = parseAgentDirectoryCSV(csvText);
             handleParsedDirectory(result);
           } else {
             toast.error('Invalid JSON structure for directory');
           }
        } catch(e: any) {
           toast.error(`JSON Parse Error: ${e.message}`);
        }
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) throw new Error("No worksheets found in this file.");
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        if (!csvText || !csvText.trim()) throw new Error("Could not extract sheet content.");
        
        const result = parseAgentDirectoryCSV(csvText);
        handleParsedDirectory(result);
      } catch (err: any) {
        const textReader = new FileReader();
        textReader.onload = (eText) => {
           try {
             const text = eText.target?.result as string;
             if (text) {
               const result = parseAgentDirectoryCSV(text);
               handleParsedDirectory(result);
             }
           } catch(fallbackErr: any) {
             toast.error(`Could not parse text: ${fallbackErr.message}`);
           }
        };
        textReader.readAsText(file);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleManualRosterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!manualRosterAgent) {
      toast.error('Please select or specify an agent name.');
      return;
    }
    if (!manualRosterDate) {
      toast.error('Please specify a roster shift date.');
      return;
    }
    if (!manualRosterShift) {
      toast.error('Please select an active shift assignment.');
      return;
    }

    const newShift: ScheduledShift = {
      id: `sch_man_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentName: manualRosterAgent,
      date: manualRosterDate,
      shiftLabel: manualRosterShift,
      shiftNotes: manualRosterNotes.trim() || undefined,
    };

    commitSchedulesManual([newShift], [], {});
    setManualRosterNotes('');
    toast.success(`Individual shift for ${manualRosterAgent} successfully submitted and synced!`);
  };

  // Agent Time Clock & Activity Helpers
  const getActiveTimeLog = (agentName: string): TimeLog | undefined => {
    return timeLogs.find((log) => 
      log.agentName?.toLowerCase() === agentName?.toLowerCase() && 
      !['clocked_out', 'day_off', 'casual', 'annual', 'no_show'].includes(log.status)
    );
  };

  const getTodayLog = (agentName: string) => {
    const todayStr = getLocalISOString();
    return timeLogs.find((log) => 
      log.agentName?.toLowerCase() === agentName?.toLowerCase() && 
      log.date === todayStr
    );
  };

  const getAgentTodayStats = (agentName: string) => {
    const todayStr = getLocalISOString();
    const myLogsToday = timeLogs.filter(l => 
      l.agentName?.toLowerCase() === agentName?.toLowerCase() && 
      l.date === todayStr
    );
    
    let totalClockInStr: string | null = null;
    let totalClockOutStr: string | null = null;
    let totalBreakMins = 0;
    let totalLunchMins = 0;
    let totalRestroomMins = 0;
    let restroomCount = 0;
    let totalMeetingMins = 0;
    let totalOneOnOneMins = 0;
    let totalPersonalMins = 0;
 
    if (myLogsToday.length > 0) {
      // Sort to get first clock in and last clock out
      const sorted = [...myLogsToday].sort((a,b) => new Date(a.clockIn || 0).getTime() - new Date(b.clockIn || 0).getTime());
      totalClockInStr = sorted[0].clockIn || null;
      const lastWithOut = [...myLogsToday].reverse().find(l => l.clockOut);
      totalClockOutStr = lastWithOut ? lastWithOut.clockOut || null : null;
 
      myLogsToday.forEach(log => {
        log.activities.forEach(act => {
          let duration = 0;
          if (act.durationMinutes !== undefined) {
            duration = act.durationMinutes;
          } else if (!act.endTime) {
            // running!
            const diffMs = currentTime.getTime() - new Date(act.startTime).getTime();
            duration = diffMs / 1000 / 60;
          }
          
          if (act.type === 'break') totalBreakMins += duration;
          else if (act.type === 'lunch') totalLunchMins += duration;
          else if (act.type === 'restroom') totalRestroomMins += duration;
          else if (act.type === 'meeting') totalMeetingMins += duration;
          else if (act.type === 'one_on_one') totalOneOnOneMins += duration;
          else if (act.type === 'personal') totalPersonalMins += duration;
        });
        
        restroomCount += log.activities.filter(a => a.type === 'restroom').length;
      });
    }
 
    return {
      clockIn: totalClockInStr,
      clockOut: totalClockOutStr,
      breakMins: parseFloat(totalBreakMins.toFixed(2)),
      lunchMins: parseFloat(totalLunchMins.toFixed(2)),
      restroomMins: parseFloat(totalRestroomMins.toFixed(2)),
      restroomCount,
      meetingMins: parseFloat(totalMeetingMins.toFixed(2)),
      oneOnOneMins: parseFloat(totalOneOnOneMins.toFixed(2)),
      personalMins: parseFloat(totalPersonalMins.toFixed(2))
    };
  };

  const getActiveActivityElapsed = (agentName: string) => {
    const active = getActiveTimeLog(agentName);
    if (!active || active.status === 'working' || active.status === 'clocked_out') return null;

    const currentAct = active.activities.find(a => !a.endTime && a.type === active.status);
    if (!currentAct) return null;

    const diffMs = currentTime.getTime() - new Date(currentAct.startTime).getTime();
    const durationMins = diffMs / 1000 / 60;
    
    let limit = 0;
    if (active.status === 'break') limit = 15;
    else if (active.status === 'lunch') limit = 30;
    else if (active.status === 'restroom') limit = 10;
    else if (active.status === 'meeting') limit = 60;
    else if (active.status === 'one_on_one') limit = 30;
    else if (active.status === 'personal') limit = 15;

    return {
      id: currentAct.id,
      type: active.status as 'break' | 'lunch' | 'restroom' | 'meeting' | 'one_on_one' | 'personal',
      limit,
      duration: durationMins,
      exceeded: limit > 0 && durationMins > limit,
      exceededBy: limit > 0 ? Math.max(0, durationMins - limit) : 0
    };
  };

  const handleClockIn = () => {
    if (!currentUser) return;
    const name = currentUser.name;
    const todayStr = getLocalISOString();
    
    const active = getActiveTimeLog(name);
    if (active) {
      toast.error('You are already clocked in!');
      return;
    }

    const newLog: TimeLog = {
      id: `clock_${Date.now()}`,
      agentName: name,
      date: todayStr,
      clockIn: new Date().toISOString(),
      activities: [],
      status: 'working'
    };

    const updated = [newLog, ...timeLogs];
    setTimeLogs(updated);
    setStorageItem('sched_time_logs', updated);
    
    // Sync to Firestore
    setDoc(doc(db, "timelogs", newLog.id), newLog).catch(e => console.error("Clock In Error:", e));
  };

  const handleStartActivity = (type: 'break' | 'lunch' | 'restroom' | 'meeting' | 'one_on_one' | 'personal') => {
    if (!currentUser) return;
    const name = currentUser.name;
    const active = getActiveTimeLog(name);
    if (!active) {
      toast.error('You must clock in first before starting any AUX session!');
      return;
    }

    const previousStatus = active.status;
    if (previousStatus === type) {
      toast.info(`You are already on: ${type}`);
      return;
    }

    const nowStr = new Date().toISOString();
    const newAct: ActivityRecord = {
      id: `act_${Date.now()}`,
      type,
      startTime: nowStr
    };

    const friendlyNameMap: Record<string, string> = {
      break: 'Break',
      lunch: 'Lunch',
      restroom: 'Restroom Break',
      meeting: 'Team Meeting',
      one_on_one: '1:1 Session',
      personal: 'Personal Break',
      working: 'Active Work'
    };

    const updated = timeLogs.map(log => {
      if (log.id === active.id) {
        // If they were on a different AUX, terminate the running one
        let updatedActivities = [...log.activities];
        if (previousStatus !== 'working') {
          updatedActivities = updatedActivities.map(act => {
            if (!act.endTime && act.type === previousStatus) {
              const diffMs = new Date(nowStr).getTime() - new Date(act.startTime).getTime();
              let diffMins = parseFloat((diffMs / 1000 / 60).toFixed(2));
            if (isNaN(diffMins)) diffMins = 0;
              return {
                ...act,
                endTime: nowStr,
                durationMinutes: diffMins
              };
            }
            return act;
          });
        }

        const updatedLog = {
          ...log,
          status: type,
          activities: [...updatedActivities, newAct]
        };
        // Sync to Firestore
        setDoc(doc(db, "timelogs", log.id), updatedLog).catch(e => console.error("AUX Start Error:", e));
        return updatedLog;
      }
      return log;
    });

    setTimeLogs(updated);
    setStorageItem('sched_time_logs', updated);

    // Let TL know about this AUX switch!
    const fromStatusLabel = friendlyNameMap[previousStatus] || previousStatus;
    const toStatusLabel = friendlyNameMap[type] || type;
    addSystemNotification(
      `🔄 Status Switch: ${formatAgentName(name)}`,
      `${formatAgentName(name)} switched AUX status from **${fromStatusLabel}** to **${toStatusLabel}**.`,
      'compliance',
      'tl'
    );
    toast.success(`Switched from ${fromStatusLabel} to ${toStatusLabel}!`);
  };

  const handleEndActivity = () => {
    if (!currentUser) return;
    const name = currentUser.name;
    const active = getActiveTimeLog(name);
    if (!active || active.status === 'working' || active.status === 'clocked_out') {
      toast.error('No active activity to end.');
      return;
    }

    const currentType = active.status;
    const endTimeStr = new Date().toISOString();

    const updated = timeLogs.map(log => {
      if (log.id === active.id) {
        const updatedActivities = log.activities.map(act => {
          if (!act.endTime && act.type === currentType) {
            const diffMs = new Date(endTimeStr).getTime() - new Date(act.startTime).getTime();
            let diffMins = parseFloat((diffMs / 1000 / 60).toFixed(2));
            if (isNaN(diffMins)) diffMins = 0;
            return {
              ...act,
              endTime: endTimeStr,
              durationMinutes: diffMins
            };
          }
          return act;
        });

        const updatedLog = {
          ...log,
          status: 'working' as const,
          activities: updatedActivities
        };
        // Sync to Firestore
        setDoc(doc(db, "timelogs", log.id), updatedLog).catch(e => console.error("AUX End Error:", e));
        return updatedLog;
      }
      return log;
    });

    setTimeLogs(updated);
    setStorageItem('sched_time_logs', updated);

    const friendlyNameMap: Record<string, string> = {
      break: 'Break',
      lunch: 'Lunch',
      restroom: 'Restroom Break',
      meeting: 'Team Meeting',
      one_on_one: '1:1 Session',
      personal: 'Personal Break'
    };
    const actLabel = friendlyNameMap[currentType] || currentType;
    addSystemNotification(
      `🟢 Agent Back Online: ${formatAgentName(name)}`,
      `${formatAgentName(name)} completed their ${actLabel} session and is now **Active Work**.`,
      'compliance',
      'tl'
    );
    toast.success(`Resumed standard work from ${actLabel}!`);
  };

  const handleClockOut = () => {
    if (!currentUser) return;
    const name = currentUser.name;
    const active = getActiveTimeLog(name);
    if (!active) {
      toast.error('You are not currently clocked in!');
      return;
    }

    const confirmSign = window.confirm('Are you sure you want to clock out of your shift?');
    if (!confirmSign) return;

    const endTimeStr = new Date().toISOString();

    const updated = timeLogs.map(log => {
      if (log.id === active.id) {
        const updatedActivities = log.activities.map(act => {
          if (!act.endTime) {
            const diffMs = new Date(endTimeStr).getTime() - new Date(act.startTime).getTime();
            let diffMins = parseFloat((diffMs / 1000 / 60).toFixed(2));
            if (isNaN(diffMins)) diffMins = 0;
            return {
              ...act,
              endTime: endTimeStr,
              durationMinutes: diffMins
            };
          }
          return act;
        });

        return {
          ...log,
          clockOut: endTimeStr,
          status: 'clocked_out' as const,
          activities: updatedActivities
        };
      }
      return log;
    });

    setTimeLogs(updated);
    setStorageItem('sched_time_logs', updated);
  };

  const handleTLOverrideAgentStatus = (agentName: string, newStatus: 'working' | 'break' | 'lunch' | 'restroom' | 'clocked_out' | 'day_off' | 'casual' | 'annual' | 'no_show' | 'meeting' | 'one_on_one' | 'personal') => {
    const todayStr = getLocalISOString();
    const active = getActiveTimeLog(agentName);
    const endTimeStr = new Date().toISOString();

    let updated = [...timeLogs];

    if (active) {
      updated = updated.map((log) => {
        if (log.id === active.id) {
          // If moving to an inactive state, end the shift
          if (['clocked_out', 'day_off', 'casual', 'annual', 'no_show'].includes(newStatus)) {
            const updatedActivities = log.activities.map((act) => {
              if (!act.endTime) {
                const diffMs = new Date(endTimeStr).getTime() - new Date(act.startTime).getTime();
                return { ...act, endTime: endTimeStr, durationMinutes: parseFloat((diffMs / 1000 / 60).toFixed(2)) };
              }
              return act;
            });
            return {
              ...log,
              clockOut: endTimeStr,
              status: newStatus as any,
              activities: updatedActivities,
            };
          } else {
            // If changing to working/break/lunch/restroom
            let updatedActivities = log.activities.map((act) => {
              if (!act.endTime) {
                const diffMs = new Date(endTimeStr).getTime() - new Date(act.startTime).getTime();
                return { ...act, endTime: endTimeStr, durationMinutes: parseFloat((diffMs / 1000 / 60).toFixed(2)) };
              }
              return act;
            });
            
            if (newStatus !== 'working') {
               updatedActivities.push({
                 id: `act_${Date.now()}`,
                 type: newStatus as any,
                 startTime: endTimeStr,
               });
            }

            return {
              ...log,
              status: newStatus as any,
              activities: updatedActivities,
            };
          }
        }
        return log;
      });
    } else {
      // If no active log for today, we either clock them in or mark them absent
      const newLog: TimeLog = {
        id: `override_${Date.now()}`,
        agentName: agentName,
        date: todayStr,
        clockIn: ['working', 'break', 'lunch', 'restroom'].includes(newStatus) ? endTimeStr : undefined,
        activities: ['break', 'lunch', 'restroom'].includes(newStatus) ? [{
          id: `act_${Date.now()}`,
          type: newStatus as any,
          startTime: endTimeStr,
        }] : [],
        status: newStatus as any,
      };
      // remove any empty log for today, just add this fresh one
      updated = [newLog, ...updated];
    }

    setTimeLogs(updated);
    setStorageItem('sched_time_logs', updated);
  };

  // Inquiry Submission and Processing System
  const handleAddPhotoUrl = () => {
    if (!tempPhotoUrlInput.trim()) return;
    setInquiryPhotos([...inquiryPhotos, tempPhotoUrlInput.trim()]);
    setTempPhotoUrlInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setInquiryPhotos(inquiryPhotos.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (!tempLinkInput.trim()) return;
    let url = tempLinkInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    setInquiryLinks([...inquiryLinks, url]);
    setTempLinkInput('');
  };

  const handleRemoveLink = (index: number) => {
    setInquiryLinks(inquiryLinks.filter((_, i) => i !== index));
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInquiryPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitInquiry = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isFormSubmitting) return;
    
    if (!inquiryClinicName) {
      toast.error('Please select a Clinic Name! This is a mandatory field.');
      return;
    }
    
    if (!inquiryText.trim()) {
      toast.error('Please enter your inquiry text!');
      return;
    }

    setIsFormSubmitting(true);
    try {
      const newInquiry: Inquiry = {
        id: `inq_${Date.now()}`,
        agentName: currentUser.name,
        clinicName: inquiryClinicName,
        phoneNumber: inquiryPhoneNumber.trim() || undefined,
        text: inquiryText.trim(),
        photos: inquiryPhotos,
        links: inquiryLinks,
        createdAt: new Date().toISOString(),
        status: 'submitted',
        seenByAgent: false
      };

      setInquiries(prev => {
        const updated = [newInquiry, ...prev];
        setStorageItem('sched_inquiries', updated);
        return updated;
      });

      // Sync to Firestore
      await setDoc(doc(db, "inquiries", newInquiry.id), newInquiry);

      // Reset fields
      setInquiryText('');
      setInquiryClinicName('');
      setInquiryPhoneNumber('');
      setInquiryPhotos([]);
      setInquiryLinks([]);
      setTempLinkInput('');
      setTempPhotoUrlInput('');

      handleMentionsInText(inquiryText.trim(), 'Agent Inquiry Description', currentUser.name);
      addSystemNotification('❓ New Inquiry Submitted', `${currentUser.name} has submitted a new inquiry for clinic: ${inquiryClinicName}.`, 'general', 'tl');

      setSubmissionConfirmation({
        title: "Inquiry Logged Successfully! 🎉",
        message: `Your inquiry has been successfully transmitted to the database. The Team Leaders have been notified and will reply shortly.`,
        type: 'inquiry',
        referenceId: newInquiry.id
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting. Please try again.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleSetInquirySent = (inquiryId: string) => {
    if (!currentUser || currentUser.role !== 'tl') return;

    const updated = inquiries.map(inq => {
      if (inq.id === inquiryId) {
        const updatedInq = {
          ...inq,
          status: 'sent' as const,
          sentBy: currentUser.name,
          sentAt: new Date().toISOString(),
          seenByAgent: false
        };
        // Sync to Firestore
        setDoc(doc(db, "inquiries", inq.id), updatedInq).catch(e => console.error("Inquiry Update Error:", e));
        return updatedInq;
      }
      return inq;
    });

    setInquiries(updated);
    setStorageItem('sched_inquiries', updated);
  };

  const handleSetInquiryAnswered = (inquiryId: string, answerText: string) => {
    if (!currentUser || currentUser.role !== 'tl') return;
    if (!answerText.trim()) {
      toast.error('Please supply an answer text.');
      return;
    }

    let targetAgentName = "";
    let clinicName = "";
    const updated = inquiries.map(inq => {
      if (inq.id === inquiryId) {
        targetAgentName = inq.agentName;
        clinicName = inq.clinicName;
        const updatedInq = {
          ...inq,
          status: 'answered' as const,
          answer: answerText.trim(),
          answeredBy: currentUser.name,
          answeredAt: new Date().toISOString(),
          seenByAgent: false
        };
        // Sync to Firestore
        setDoc(doc(db, "inquiries", inq.id), updatedInq).catch(e => console.error("Inquiry Answer Error:", e));
        return updatedInq;
      }
      return inq;
    });

    setInquiries(updated);
    setStorageItem('sched_inquiries', updated);
    
    if (targetAgentName) {
      addSystemNotification(
        "💬 Inquiry Answered by TL",
        `Your inquiry regarding clinic "${clinicName}" has been answered by ${currentUser.name}: "${answerText.trim()}"`,
        "inquiry",
        targetAgentName
      );
    }
    handleMentionsInText(answerText, 'Inquiry Response', currentUser.name);
    setAnsweringInquiryId(null);
    setCurrentAnswerText('');
    toast.success('Answer response committed successfully! Agent will receive a live notification.');
  };

  const handleReassignInquiry = (inquiryId: string, newAgentName: string) => {
    if (!currentUser || currentUser.role !== 'tl') return;
    if (!newAgentName) return;

    const updated = inquiries.map(inq => {
      if (inq.id === inquiryId) {
        const updatedInq = {
          ...inq,
          agentName: newAgentName,
          seenByAgent: false
        };
        // Sync to Firestore
        setDoc(doc(db, "inquiries", inq.id), updatedInq).catch(e => console.error("Inquiry Reassign Error:", e));
        return updatedInq;
      }
      return inq;
    });

    setInquiries(updated);
    setStorageItem('sched_inquiries', updated);
  };

  const handleUpdateContactedStatus = (inquiryId: string, status: 'not_contacted' | 'contacted' | 'attempted') => {
    const updated = inquiries.map(inq => {
      if (inq.id === inquiryId) {
        const updatedInq = {
          ...inq,
          customerContacted: status
        };
        // Sync to Firestore
        setDoc(doc(db, "inquiries", inq.id), updatedInq).catch(e => console.error("Inquiry Contacted Status Error:", e));
        return updatedInq;
      }
      return inq;
    });
    setInquiries(updated);
    setStorageItem('sched_inquiries', updated);
  };

  const handleMarkInquirySeen = (inquiryId: string) => {
    const updated = inquiries.map(inq => {
      if (inq.id === inquiryId) {
        const updatedInq = { ...inq, seenByAgent: true };
        // Sync to Firestore
        setDoc(doc(db, "inquiries", inq.id), updatedInq).catch(e => console.error("Inquiry Mark Seen Error:", e));
        return updatedInq;
      }
      return inq;
    });
    setInquiries(updated);
    setStorageItem('sched_inquiries', updated);
  };

  const handleDeleteInquiry = (inquiryId: string) => {
    const doubleCheck = window.confirm('Are you sure you want to delete this inquiry record?');
    if (!doubleCheck) return;
    const updated = inquiries.filter(inq => inq.id !== inquiryId);
    setInquiries(updated);
    setStorageItem('sched_inquiries', updated);
    // Sync to Firestore
    deleteDoc(doc(db, "inquiries", inquiryId)).catch(e => console.error("Inquiry Delete Error:", e));
  };

  const handleSubmitTabbyTamara = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isFormSubmitting) return;

    if (!ttPatientName || !ttPriceWithoutTax || !ttPhoneNumber || !ttClinicName) {
      toast.error('Please fill out all mandatory fields (Patient Name, Price, Phone Number, Clinic Name).');
      return;
    }

    if (!ttIsOldCustomer && !ttIdNumber) {
      toast.error('Since the customer is not an old customer, please enter their ID Number.');
      return;
    }

    setIsFormSubmitting(true);
    try {
      const calculatedPrice = ttPriceWithoutTax && !isNaN(Number(ttPriceWithoutTax)) ? (Number(ttPriceWithoutTax) * 1.05).toFixed(2) : '-';
      const autoNote = `[5% added to price. Final: SAR ${calculatedPrice}]`;
      const finalNotes = ttNotes ? `${autoNote}

${ttNotes}` : autoNote;

      const newRequest: any = {
        id: 'tt_' + Math.random().toString(36).substr(2, 9),
        agentName: currentUser.name,
        patientName: ttPatientName,
        fileNumber: ttFileNumber,
        isOldCustomer: ttIsOldCustomer,
        idNumber: !ttIsOldCustomer ? ttIdNumber : null,
        priceWithoutTax: ttPriceWithoutTax,
        phoneNumber: ttPhoneNumber,
        notes: finalNotes,
        createdAt: new Date().toISOString(),
        status: 'not_confirmed',
        customerContacted: 'not_contacted',
        
        
        platform: ttPlatform,
        clinicName: ttClinicName,
        paymentScreenshot: activeScreenshot || null, photos: activePhotos, links: activeLinks
      };
      Object.keys(newRequest).forEach(k => newRequest[k] === undefined && delete newRequest[k]);

      setTabbyTamaraRequests(prev => {
        const updated = [newRequest, ...prev];
        setStorageItem('sched_tabby_tamara', updated);
        return updated;
      });

      // Sync to Firestore
      await setDoc(doc(db, "tt_requests", newRequest.id), newRequest);

      // Clear form
      setTtPatientName('');
      setTtClinicName('');
      setTtFileNumber('');
      setTtIsOldCustomer(true);
      setTtIdNumber('');
      setTtPriceWithoutTax('');
      setTtPhoneNumber('');
      setTtNotes('');
      setActiveScreenshot(null); setActivePhotos([]); setActiveLinks([]);

      addSystemNotification(`💳 New ${ttPlatform.toUpperCase()} Request`, `${currentUser.name} submitted a new request for ${ttPatientName} (${ttPhoneNumber})`, 'general', 'tl');

      setSubmissionConfirmation({
        title: "Fintech Request Confirmed! 💳",
        message: `Your ${ttPlatform === 'tabby' ? 'Tabby' : ttPlatform === 'tamara' ? 'Tamara' : 'One Time Payment'} link request was successfully filed. The Team Leader has been notified to generate the installment link. Do not submit this request twice.`,
        type: 'fintech_request',
        referenceId: newRequest.id
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast.error("Fintech error: " + (err.message || err));
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleConfirmTabbyTamara = (
    requestId: string,
    paymentLink: string,
    tlNotes?: string,
    tlLinks?: string,
    status: 'confirmed' | 'rejected' = 'confirmed'
  ) => {
    if (!currentUser) return;
    const updated = tabbyTamaraRequests.map(r => {
      if (r.id === requestId) {
        const updatedReq = {
          ...r,
          status: status,
          confirmedAt: new Date().toISOString(),
          confirmedBy: currentUser.name,
          paymentLink: paymentLink || null,
          tlNotes: tlNotes || null,
          tlLinks: tlLinks || undefined
        };
        // Sync to Firestore
        setDoc(doc(db, "tt_requests", r.id), updatedReq).catch(e => console.error("TT Confirm Error:", e));
        
        addSystemNotification(
          status === 'confirmed' ? `✅ Payment Link Ready` : `❌ Fintech Request Rejected`,
          status === 'confirmed'
            ? `Your ${r.platform} request for ${r.patientName} has been confirmed. ${tlNotes ? `Notes: ${tlNotes}` : ''}`
            : `Your ${r.platform} request for ${r.patientName} has been rejected. ${tlNotes ? `Notes: ${tlNotes}` : ''}`,
          "general",
          r.agentName
        );

        return updatedReq;
      }
      return r;
    });

    setTabbyTamaraRequests(updated);
    setStorageItem('sched_tabby_tamara', updated);
    if (status === 'confirmed') {
      toast.success('Request successfully confirmed with feedback! Submitting agent was notified.');
    } else {
      toast.success('Request successfully marked as rejected with notes!');
    }
  };

  const handleContactTabbyTamara = (requestId: string, status: 'not_contacted' | 'contacted', notes?: string, screenshot?: string) => {
    const updated = tabbyTamaraRequests.map(r => {
      if (r.id === requestId) {
        const updatedReq = {
          ...r,
          customerContacted: status,
          contactedAt: status === 'contacted' ? new Date().toISOString() : undefined,
          agentContactNotes: notes,
          paymentScreenshot: screenshot
        };
        // Sync to Firestore
        setDoc(doc(db, "tt_requests", r.id), updatedReq).catch(e => console.error("TT Update Contact Error:", e));
        return updatedReq;
      }
      return r;
    });

    setTabbyTamaraRequests(updated);
    setStorageItem('sched_tabby_tamara', updated);
    if (status === 'contacted') {
       toast.success('Case marked as contacted and successfully closed!');
    } else {
       toast.success('Undo contact status.');
    }
  };

  const handleDeleteTabbyTamara = (requestId: string) => {
    const doubleCheck = window.confirm('Are you sure you want to delete this Tabby/Tamara request?');
    if (!doubleCheck) return;
    const updated = tabbyTamaraRequests.filter(r => r.id !== requestId);
    setTabbyTamaraRequests(updated);
    setStorageItem('sched_tabby_tamara', updated);
    
    // Sync to Firestore
    deleteDoc(doc(db, "tt_requests", requestId)).catch(e => console.error("TT Delete Error:", e));
  };

  const handleSubmitTabbyTamaraComplaint = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isFormSubmitting) return;

    if (!tcPatientName || !tcPhoneNumber || !tcComplaintDetails || !tcClinicName) {
      toast.error('Please fill out all mandatory fields (Patient Name, Phone Number, Complaint Details, and Clinic Name).');
      return;
    }

    if (!tcIsOldCustomer && !tcIdNumber) {
      toast.error('Since the customer is not an old customer, please enter their ID Number.');
      return;
    }

    setIsFormSubmitting(true);
    try {
      const newComplaint: any = {
        id: 'tc_' + Math.random().toString(36).substr(2, 9),
        agentName: currentUser.name,
        patientName: tcPatientName,
        fileNumber: tcFileNumber,
        isOldCustomer: tcIsOldCustomer,
        idNumber: !tcIsOldCustomer ? tcIdNumber : null,
        imageUrl: activeScreenshot || tcImageUrl, photos: activePhotos, links: activeLinks,
        phoneNumber: tcPhoneNumber,
        complaintDetails: tcComplaintDetails,
        createdAt: new Date().toISOString(),
        status: 'pending_tl',
        customerContacted: 'not_contacted',
        clinicName: tcClinicName
      };
      Object.keys(newComplaint).forEach(k => newComplaint[k] === undefined && delete newComplaint[k]);

      setTabbyTamaraComplaints(prev => {
        const updated = [newComplaint, ...prev];
        setStorageItem('sched_tt_complaints', updated);
        return updated;
      });
      
      // Sync to Firestore
      await setDoc(doc(db, "tt_complaints", newComplaint.id), newComplaint);

      // Clear form
      setTcPatientName('');
      setTcClinicName('');
      setTcFileNumber('');
      setTcIsOldCustomer(true);
      setTcIdNumber('');
      setTcImageUrl('');
      setTcPhoneNumber('');
      setTcComplaintDetails('');
      setActiveScreenshot(null); setActivePhotos([]); setActiveLinks([]);

      addSystemNotification(`⚠️ New Complaint`, `${currentUser.name} submitted a new complaint for ${tcPatientName} (${tcPhoneNumber})`, 'general', 'tl');

      setSubmissionConfirmation({
        title: "Complaint Registered! ⚠️",
        message: `Your installment complaint for ${tcPatientName} has been recorded. Team Leaders will review the issue and initiate contact.`,
        type: 'fintech_complaint',
        referenceId: newComplaint.id
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting complaint. Please try again.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleSubmitClientComms = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isFormSubmitting) return;

    if (!ccClinicName || !ccPhoneNumber || !ccNotes) {
      toast.error('Please fill out all mandatory fields (Clinic Name, Phone Number, Inquiry/Notes).');
      return;
    }

    setIsFormSubmitting(true);
    try {
      const newComm: any = {
        id: 'cc_' + Math.random().toString(36).substr(2, 9),
        callCenterAgentName: currentUser.name,
        clinicName: ccClinicName,
        phoneNumber: ccPhoneNumber,
        language: ccLanguage,
        notes: ccNotes,
        createdAt: new Date().toISOString(),
        status: 'pending',
        screenshot: activeScreenshot || null, photos: activePhotos, links: activeLinks
      };
      Object.keys(newComm).forEach(k => newComm[k] === undefined && delete newComm[k]);

      setClientComms(prev => {
        const updated = [newComm, ...prev];
        setStorageItem('sched_client_comms', updated);
        return updated;
      });
      
      // Sync to Firestore
      await setDoc(doc(db, "client_comms", newComm.id), newComm);

      // Clear form
      setCcClinicName('');
      setCcPhoneNumber('');
      setCcLanguage('Arabic');
      setCcNotes('');
      setActiveScreenshot(null); setActivePhotos([]); setActiveLinks([]);

      addSystemNotification(`💬 New Client Comm Request`, `New request submitted for phone: ${ccPhoneNumber}`, 'general', 'tl');

      setSubmissionConfirmation({
        title: "Dialogue Request Submitted! 💬",
        message: `Your communication and callback request has been dispatched to Team Leaders and social media agents successfully. We will initiate contact and keep you updated.`,
        type: 'client_comm',
        referenceId: newComm.id
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting. Please try again.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleProcessClientComms = (commId: string, notes: string) => {
    if (!currentUser) return;
    if (!notes.trim()) {
      toast.error('Please enter your handling notes first.');
      return;
    }

    const updated = clientComms.map(c => {
      if (c.id === commId) {
        const updatedComm = {
          ...c,
          status: 'contacted' as const,
          handledBy: currentUser.name,
          handledAt: new Date().toISOString(),
          handlingNotes: notes
        };
        // Sync to Firestore
        setDoc(doc(db, "client_comms", c.id), updatedComm).catch(e => console.error("Client Comm Update Error:", e));
        return updatedComm;
      }
      return c;
    });

    setClientComms(updated);
    setStorageItem('sched_client_comms', updated);
    
    // Clear TL input
    setActiveCcHandlingId(null);
    setCcHandlingNotes('');

    toast.success('Communication request status updated to Contacted!');
  };

  const handleTakeClientComm = (commId: string) => {
    if (!currentUser) return;
    const updated = clientComms.map(c => {
      if (c.id === commId) {
        const updatedComm = {
          ...c,
          status: 'in_progress' as const,
          openedBy: currentUser.name,
          openedAt: new Date().toISOString()
        };
        // Sync to Firestore
        setDoc(doc(db, "client_comms", c.id), updatedComm).catch(e => console.error("Client Comm Take Error:", e));
        return updatedComm;
      }
      return c;
    });
    setClientComms(updated);
    setStorageItem('sched_client_comms', updated);
    toast.success('Request taken! You can now provide handling notes.');
  };

  const downloadShiftsICS = () => {
    if (!currentUser) return;
    const myShifts = schedules.filter(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase());
    
    if (myShifts.length === 0) {
      toast.error('No shifts found to export.');
      return;
    }

    const localTZ = getLocalTimeZone();
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Synq//Portal//EN\n";

    myShifts.forEach(shift => {
      try {
        const [startTime, endTime] = shift.shiftLabel.split(' - ');
        const startDate = shift.date.replace(/-/g, '');
        const startTimeStr = startTime.replace(':', '') + '00';
        
        let endDate = startDate;
        if (endTime < startTime) {
          const d = new Date(shift.date);
          d.setDate(d.getDate() + 1);
          endDate = getLocalISOString(d).replace(/-/g, '');
        }
        const endTimeStr = endTime.replace(':', '') + '00';

        icsContent += "BEGIN:VEVENT\\n";
        icsContent += `DTSTART;TZID=${localTZ}:${startDate}T${startTimeStr}
`;
        icsContent += `DTEND;TZID=${localTZ}:${endDate}T${endTimeStr}
`;
        icsContent += `SUMMARY:Work: ${shift.shiftLabel}
`;
        icsContent += `DESCRIPTION:Synq Portal Work Shift
`;
        icsContent += "END:VEVENT\\n";
      } catch (e) {
         console.warn("Skipping malformed shift for ICS export", shift);
      }
    });

    icsContent += "END:VCALENDAR\\n";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentUser.name.replace(/\s+/g, '_')}_schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar file (.ics) downloaded! You can now import this into Outlook or Apple Calendar.');
  };

  const commitSchedulesManual = (targetSchedules: ScheduledShift[], newAgentsList: string[], parsedMeta: any) => {
    if (targetSchedules.length === 0) return;

    // MERGE LOGIC: Merge new shifts into existing ones, replacing only matching (agent + date) pairs
    const mergedSchedules = [...schedules];
    targetSchedules.forEach(newShift => {
      const existingIdx = mergedSchedules.findIndex(s => 
        s.agentName?.toLowerCase() === newShift.agentName?.toLowerCase() && 
        s.date === newShift.date
      );
      if (existingIdx !== -1) {
        mergedSchedules[existingIdx] = newShift;
      } else {
        mergedSchedules.push(newShift);
      }
    });

    // Save schedules
    setSchedules(mergedSchedules);

    // Sync to Firestore (only the ones we changed/added)
    targetSchedules.forEach(s => {
      setDoc(doc(db, "schedules", s.id), s).catch(e => console.error("Schedule Write Error:", e));
      
      // Auto assign shift to agent's user profile in Firestore
      const userDocId = s.agentName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (userDocId) {
        setDoc(doc(db, "users", userDocId), {
          assignedShifts: {
            [s.date]: s.shiftLabel
          }
        }, { merge: true }).catch(err => {
          console.error("Syncing shift to user doc failed:", err);
        });
        
        // As requested: write to agents collection
        const agentSchedulesRef = doc(collection(doc(collection(db, 'agents'), userDocId), 'schedules'), s.date);
        setDoc(agentSchedulesRef, {
            shift: s.shiftLabel,
            date: s.date,
            agentId: userDocId
        }, { merge: true }).catch(err => {
            console.error("Syncing shift to agents collection failed:", err);
        });
      }
    });

    // Automatically trigger notification
    addSystemNotification(
      "📅 New Schedule Released & Published!",
      `A new shift schedule has been successfully uploaded and automatically published by ${currentUser?.name || "Leadership"}. System state is now updated.`,
      "schedule",
      "all"
    );

    // Register any new agents found
    if (newAgentsList.length > 0) {
      const updatedAgents = [...agentsList];
      newAgentsList.forEach(a => {
        if (!updatedAgents.some(ea => ea?.toLowerCase() === a?.toLowerCase())) {
          updatedAgents.push(a);
        }
      });
      setAgentsList(updatedAgents);
      setStorageItem('sched_agents_list', updatedAgents);
    }

    const newMeta = { ...getAgentMeta() };
    Object.entries(parsedMeta).forEach((entry) => {
      const agent = entry[0];
      const meta = entry[1] as { tlName?: string };
      if (!newMeta[agent]) newMeta[agent] = { roleType: '', tlName: '' };
      if (meta.tlName) {
        newMeta[agent].tlName = meta.tlName;
      }
    });
    setStorageItem('sched_agent_meta', newMeta);
    
    // Sync system docs to Firestore
    if (newAgentsList.length > 0) {
      setDoc(doc(db, "system", "sched_agents_list"), { data: agentsList }).catch(e => console.error("Agents List Sync Error:", e));
    }
    setDoc(doc(db, "system", "sched_agent_meta"), { data: newMeta }).catch(e => console.error("Agent Meta Sync Error:", e));
    
    toast.success(`Schedule system updated with ${targetSchedules.length} live shifts!`);
    setTempSchedules([]);
    setTempNewAgents([]);
    setTempParsedMeta({});
  };

  const isGlobalAdmin = currentUser?.email === 'sobhyhesham00@gmail.com';

  const handleResetAllData = async () => {
    if (!isGlobalAdmin) {
      toast.error('Unauthorized access.');
      return;
    }

    const confirmed = window.confirm("CRITICAL WARNING: This will permanently delete ALL organization data including schedules, requests, cases, and logs. This cannot be undone. Are you absolutely sure?");
    if (!confirmed) return;

    const secondConfirm = window.confirm("FINAL CONFIRMATION: Type 'RESET' in your mind and click OK to wipe everything.");
    if (!secondConfirm) return;

    setIsSyncingCalendar(true); // Reusing sync state for loading
    try {
      // 1. Delete Firestore Collections
      const collectionsToWipe = ['schedules', 'requests', 'inquiries', 'clientComms', 'cases', 'timeLogs', 'announcements', 'orders'];
      
      for (const colName of collectionsToWipe) {
        const q = query(collection(db, colName));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      // Also clear all local data
      localStorage.clear();

      toast.success('System wipe successful. All organizational data has been reset.');
      window.location.reload(); // Hard refresh to clear all local states
    } catch (error) {
      console.error("Reset failed:", error);
      toast.error('Reset failed. Check console for details.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const downloadFullXLSX = () => {
    const data = requests.map(r => ({
      ID: r.id,
      Agent: r.agentName,
      Type: r.type,
      Date: r.type === 'swap' ? r.date : `${r.startDate} to ${r.endDate}`,
      Status: r.status,
      Submitted: r.createdAt
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requests");
    XLSX.writeFile(workbook, `Synq_Requests_Export_${getLocalISOString()}.xlsx`);
    toast.success('Excel workbook generated successfully!');
  };

  const downloadTimeLogsXLSX = () => {
    const data = timeLogs.map(log => ({
      Agent: log.agentName,
      Date: log.date,
      'Clock In': log.clockIn,
      'Clock Out': log.clockOut,
      'Total Minutes': (log as any).totalMinutes || 0,
      Violations: ((log as any).violations || []).join(', ')
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Synq_Attendance_Report_${getLocalISOString()}.xlsx`);
    toast.success('Attendance Excel report generated!');
  };

  const syncShiftsToGoogleCalendar = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error('Please connect your Google Account in the Integrations Hub first.');
      setActiveTab('integrations');
      return;
    }

    try {
      setIsSyncingCalendar(true);
      const todayStr = getLocalISOString();
      const myShifts = schedules.filter(s => 
        s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && 
        s.date >= todayStr
      );

      if (myShifts.length === 0) {
        toast.error('No upcoming shifts found to sync.');
        return;
      }

      const confirmed = window.confirm(`Found ${myShifts.length} upcoming shifts. Sync to Google Calendar?`);
      if (!confirmed) return;

      let successCount = 0;
      for (const shift of myShifts) {
        const [startTime, endTime] = shift.shiftLabel.split(' - ');
        
        // Handle night shift crossing midnight
        const startDateTime = new Date(`${shift.date}T${startTime}:00`);
        const endDateTime = new Date(`${shift.date}T${endTime}:00`);
        if (endTime < startTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        const event = {
          summary: `Work Shift: ${shift.shiftLabel}`,
          description: `Scheduled shift at Call Center via Synq Portal.`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'Africa/Cairo',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'Africa/Cairo',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 },
              { method: 'email', minutes: 120 }
            ],
          },
        };

        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (res.ok) successCount++;
      }

      toast.success(`Successfully synced ${successCount} shifts to your Google Calendar!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync. Please check your connection.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const uploadToDrive = async (filename: string, content: string, contentType: string = 'text/csv') => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error('Please connect your Google Account in the Integrations Hub first.');
      setActiveTab('integrations');
      return;
    }

    try {
      setIsUploadingToDrive(true);
      const confirmed = window.confirm(`Upload "${filename}" to your Google Drive?`);
      if (!confirmed) return;

      const metadata = {
        name: filename,
        mimeType: contentType,
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: contentType }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (!res.ok) throw new Error('Upload failed');
      toast.success(`Successfully uploaded "${filename}" to Google Drive!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload to Drive.');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleDeleteClientComms = (commId: string) => {
    const doubleCheck = window.confirm('Are you sure you want to delete this communication request?');
    if (!doubleCheck) return;
    const updated = clientComms.filter(c => c.id !== commId);
    setClientComms(updated);
    setStorageItem('sched_client_comms', updated);
    // Sync to Firestore
    deleteDoc(doc(db, "client_comms", commId)).catch(e => console.error("Client Comm Delete Error:", e));
  };

  const handleTLCommentComplaint = (complaintId: string, comment: string) => {
    if (!currentUser) return;
    if (!comment.trim()) {
      toast.error('Please enter a handling comment first.');
      return;
    }

    const updated = tabbyTamaraComplaints.map(c => {
      if (c.id === complaintId) {
        const updatedComplaint = {
          ...c,
          status: 'need_contact' as const,
          tlComment: comment,
          tlHandledAt: new Date().toISOString(),
          tlHandledBy: currentUser.name
        };
        // Sync to Firestore
        setDoc(doc(db, "tt_complaints", c.id), updatedComplaint).catch(e => console.error("TT Complaint Comment Error:", e));
        
        addSystemNotification(
          `📝 Complaint Evaluated`,
          `Your complaint for ${c.patientName} has been evaluated by ${currentUser.name}. Please contact the client now.`,
          "general",
          c.agentName
        );

        return updatedComplaint;
      }
      return c;
    });

    setTabbyTamaraComplaints(updated);
    setStorageItem('sched_tt_complaints', updated);
    
    // Clear TL input
    setActiveComplaintHandlingId(null);
    setTlComplaintComment('');

    toast.success('Complaint successfully updated! Status changed to: Need to contact the client. The agent has been notified with a timer.');
  };

  const handleToggleContactComplaint = (complaintId: string, status: 'not_contacted' | 'contacted') => {
    const updated = tabbyTamaraComplaints.map(c => {
      if (c.id === complaintId) {
        const updatedComplaint = {
          ...c,
          customerContacted: status,
          status: status === 'contacted' ? ('closed' as const) : ('need_contact' as const),
          contactedAt: status === 'contacted' ? new Date().toISOString() : undefined
        };
        // Sync to Firestore
        setDoc(doc(db, "tt_complaints", c.id), updatedComplaint).catch(e => console.error("TT Complaint Contact Update Error:", e));
        return updatedComplaint;
      }
      return c;
    });

    setTabbyTamaraComplaints(updated);
    setStorageItem('sched_tt_complaints', updated);
  };

  const handleDeleteComplaint = (complaintId: string) => {
    const doubleCheck = window.confirm('Are you sure you want to delete this complaint record?');
    if (!doubleCheck) return;
    const updated = tabbyTamaraComplaints.filter(c => c.id !== complaintId);
    setTabbyTamaraComplaints(updated);
    setStorageItem('sched_tt_complaints', updated);
    // Sync to Firestore
    deleteDoc(doc(db, "tt_complaints", complaintId)).catch(e => console.error("TT Complaint Delete Error:", e));
  };

  const handleCopyCSVReport = () => {
    let csv = "Agent Name,Status,Clock In,Clock Out,Total Break (mins),Total Lunch (mins),Total Restroom (mins),Restroom Sessions,Team Meeting (mins),1:1 Session (mins),Personal Break (mins),Today's Compliance\\n";
    
    let activeAgentsForCSV = [...agentsList];
    timeLogs.forEach(log => {
        if (log.clockIn && (new Date(log.clockIn).toDateString() === new Date().toDateString() || !['clocked_out', 'day_off', 'casual', 'annual', 'no_show'].includes(log.status))) {
            if (!activeAgentsForCSV.some(a => a?.toLowerCase() === log.agentName?.toLowerCase())) {
                activeAgentsForCSV.push(log.agentName);
            }
        }
    });

    activeAgentsForCSV.forEach(agent => {
      const stats = getAgentTodayStats(agent);
      const active = getActiveTimeLog(agent);
      const statusText = active ? (active.status === 'working' ? 'Shift Active' : active.status.toUpperCase()) : 'Offline / Clocked Out';
      
      let compliance = "Compliant";
      if (stats.breakMins > 15) {
        compliance = `Exceeded Break limit by ${(stats.breakMins - 15).toFixed(1)} mins`;
      } else if (stats.lunchMins > 30) {
        compliance = `Exceeded Lunch limit by ${(stats.lunchMins - 30).toFixed(1)} mins`;
      } else if (stats.restroomMins > 10) {
        compliance = `Exceeded Restroom limit by ${(stats.restroomMins - 10).toFixed(1)} mins`;
      } else if (stats.meetingMins > 60) {
        compliance = `Exceeded Team Meeting limit by ${(stats.meetingMins - 60).toFixed(1)} mins`;
      } else if (stats.oneOnOneMins > 30) {
        compliance = `Exceeded 1:1 limit by ${(stats.oneOnOneMins - 30).toFixed(1)} mins`;
      } else if (stats.personalMins > 15) {
        compliance = `Exceeded Personal Break limit by ${(stats.personalMins - 15).toFixed(1)} mins`;
      }

      const clockInVal = stats.clockIn ? new Date(stats.clockIn).toLocaleTimeString() : 'N/A';
      const clockOutVal = stats.clockOut ? new Date(stats.clockOut).toLocaleTimeString() : 'N/A';

      csv += `"${agent}","${statusText}","${clockInVal}","${clockOutVal}",${stats.breakMins.toFixed(1)},${stats.lunchMins.toFixed(1)},${stats.restroomMins.toFixed(1)},${stats.restroomCount},${stats.meetingMins.toFixed(1)},${stats.oneOnOneMins.toFixed(1)},${stats.personalMins.toFixed(1)},"${compliance}"
`;
    });

    navigator.clipboard.writeText(csv);
    toast.success("Master Agent Attendance CSV report compiled and copied to clipboard successfully! You can directly paste it (Ctrl+V) into Excel or Google Sheets.");
  };

  const handleExportCloudBackup = () => {
    toast.loading("Compiling secure cloud backup...");
    const backupData = {
      timestamp: new Date().toISOString(),
      appVersion: CURRENT_APP_VERSION,
      schedules,
      timeLogs,
      registeredUsers,
      requests,
      cases,
      notifications,
      tabbyTamaraRequests,
      tabbyTamaraComplaints,
      clientComms,
      inquiries,
      agentDirectory,
      announcements,
      orders,
      tlFeedbacks,
      qaScores,
      todos
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Firebase_Cloud_Data_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.dismiss();
    toast.success("Cloud Data Backup has been generated and saved locally! Original data remains safe in Firebase Cloud.");
  };

  // Filter logs for general browsing
  const [logFilter, setLogFilter] = useState<'all' | 'swap' | 'annual'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // TL Dashboard search, filter and print states
  const [tlSearchQuery, setTlSearchQuery] = useState('');
  const [tlStatusFilter, setTlStatusFilter] = useState<'all' | 'in' | 'out' | 'break_lunch' | 'overtime'>('all');
  const [tlIsPrintMode, setTlIsPrintMode] = useState(false);

  const filteredLogs = requests.filter(req => {
    const matchesFilter = logFilter === 'all' || req.type === logFilter;
    const matchesSearch = req.agentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (req.type === 'swap' && (req as SwapRequest).swapWithAgent.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Derived counts for overview cards
  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'pending_partner');
  const pendingSwapsCount = pendingRequests.filter(r => r.type === 'swap').length;
  const pendingAnnualsCount = pendingRequests.filter(r => r.type === 'annual').length;

  const totalApprovedThisMonth = requests.filter(r => {
    if (r.status !== 'approved') return false;
    const actionDate = r.actionAt ? new Date(r.actionAt) : new Date(r.createdAt);
    return actionDate.getMonth() === systemTime.getMonth() && actionDate.getFullYear() === systemTime.getFullYear();
  }).length;

  const totalViolationsCount = requests.filter(r => r.ruleViolation).length;

  // Swaps where the logged-in agent is the trade target, awaiting their agreement
  const partnerPendingSwaps = currentUser && currentUser.role === 'agent'
    ? requests.filter(r => 
        r.type === 'swap' && 
        r.status === 'pending_partner' && 
        (r as SwapRequest).swapWithAgent.toLowerCase() === currentUser?.name?.toLowerCase()
      ) as SwapRequest[]
    : [];

  // Schedules Derived Calculations
  const allScheduleDates = Array.from(new Set(schedules.map(p => p.date))).sort() as string[];
  const baseDatesList = (allScheduleDates.length > 0 ? allScheduleDates : Array.from({ length: 30 }, (_, i) => {
    const d = new Date(systemTime);
    d.setDate(d.getDate() - 5 + i);
    return getLocalISOString(d);
  })) as string[];
  
  let displayDaysCount = 14;
  if (scheduleViewMode === 'week') displayDaysCount = 7;
  if (scheduleViewMode === 'month') displayDaysCount = 31;

  const safeOffset = Math.max(0, Math.min(schedulePageOffset, Math.max(0, baseDatesList.length - displayDaysCount)));
  const activeDisplayDates = baseDatesList.slice(safeOffset, safeOffset + displayDaysCount) as string[];

  const getShiftBadgeStyle = (label: string) => {
    if (!label) return { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', display: 'Not Scheduled' };
    const norm = label.toLowerCase();
    if (norm.includes('morning') || norm.includes('am') || norm.includes('07:') || norm.includes('08:') || norm === 'a' || norm === 'morning shift') {
      return { bg: 'bg-sky-500/15 text-sky-300 border-sky-500/25', display: 'Morning' };
    }
    if (norm.includes('afternoon') || norm.includes('pm') || norm.includes('12:') || norm.includes('13:') || norm.includes('14:') || norm === 'b' || norm === 'afternoon shift') {
      return { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/25', display: 'Afternoon' };
    }
    if (norm.includes('night') || norm.includes('22:') || norm.includes('23:') || norm.includes('00:') || norm.includes('graveyard') || norm === 'c' || norm === 'night shift') {
      return { bg: 'bg-purple-500/15 text-purple-300 border-purple-500/25', display: 'Night' };
    }
    if (norm === 'not scheduled' || norm === 'unassigned') {
      return { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', display: 'Not Scheduled' };
    }
    if (norm.includes('off') || norm.includes('leave') || norm.includes('al') || norm.includes('sl') || norm === 'o' || norm === 'r') {
      return { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', display: 'Off Day' };
    }
    return { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', display: label };
  };

  const visibleAgents = agentsList.filter(agentName => {
    if (currentUser?.role === 'agent') {
      return agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
    }
    return !scheduleFilterAgent || agentName?.toLowerCase().includes(scheduleFilterAgent.toLowerCase());
  });

  if (isAppKilled) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <Toaster theme="dark" position="bottom-right" />
        <div className="max-w-md w-full text-center space-y-6">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
          <div>
            <h1 className="text-3xl font-black text-rose-500">System Offline</h1>
            <p className="text-slate-400 mt-2">The application has been temporarily suspended by the system administrator.</p>
          </div>
          
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold pt-1">System Restore (Admin Only)</p>
            <div className="relative">
              <input 
                type={showKillSwitchPassword ? "text" : "password"} 
                placeholder="Admin Password"
                value={killSwitchPassword}
                onChange={e => setKillSwitchPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-black/40 border border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                     const creds = getStorageItem<Record<string, string>>('sched_credentials', {});
                     const correctAdminPass = creds['h.sobhy'] || creds['Hesham Sobhy'] || creds['h.sobhy'.toLowerCase()];
                     if (killSwitchPassword && killSwitchPassword === correctAdminPass && killSwitchCar === 'BMW') {
                        setDoc(doc(db, "system", "app_status"), { isKilled: false, restoredAt: new Date().toISOString() }, {merge: true});
                        toast.success("System Restored.");
                     } else {
                       toast.error("Incorrect restoration password");
                     }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowKillSwitchPassword(!showKillSwitchPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showKillSwitchPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Security Check: Favorite car?"
              value={killSwitchCar}
              onChange={e => setKillSwitchCar(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                   const creds = getStorageItem<Record<string, string>>('sched_credentials', {});
                   const correctAdminPass = creds['h.sobhy'] || creds['Hesham Sobhy'] || creds['h.sobhy'.toLowerCase()];
                   if (killSwitchPassword && killSwitchPassword === correctAdminPass && killSwitchCar === 'BMW') {
                      setDoc(doc(db, "system", "app_status"), { isKilled: false, restoredAt: new Date().toISOString() }, {merge: true});
                      toast.success("System Restored.");
                      setKillSwitchPassword('');
                      setKillSwitchCar('');
                   } else {
                     toast.error("Incorrect restoration password or security answer");
                   }
                }
              }}
            />
            <button
              onClick={() => {
                const creds = getStorageItem<Record<string, string>>('sched_credentials', {});
                const correctAdminPass = creds['h.sobhy'] || creds['Hesham Sobhy'] || creds['h.sobhy'.toLowerCase()];
                if (killSwitchPassword && killSwitchPassword === correctAdminPass && killSwitchCar === 'BMW') {
                   setDoc(doc(db, "system", "app_status"), { isKilled: false, restoredAt: new Date().toISOString() }, {merge: true});
                   toast.success("System Restored.");
                   setKillSwitchPassword('');
                   setKillSwitchCar('');
                } else {
                   toast.error("Invalid credentials.");
                }
              }}
              className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm tracking-wide transition-colors"
            >
              Restore Operations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="scheduling-root" className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans relative overflow-x-hidden antialiased">
      <Toaster theme="dark" position="bottom-right" />
      <AIChatWidget />
      
      {/* Background aesthetic blobs */}
      <div className="fixed top-[-10%] -left-32 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] -right-32 w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>



      {/* Main Container */}
      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 z-10">
        
        {/* Check Installation */}
        {!currentUser ? (
          <div className="flex-1 flex flex-col items-center justify-center my-12 animate-fade-in">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500"></div>
              
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/80 mb-4 border border-white/10 relative group">
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CoolLogo className="w-10 h-10 text-slate-100" />
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent font-display">
                  Synq
                </h1>
                <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mt-1.5">
                  Enterprise Shift & Work Console
                </p>
              </div>

              {isRegistering ? (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-200 flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="font-bold text-slate-100 mb-0.5">First-Time Setup Detected!</p>
                      Password of your choice will be associated with the username <span className="font-semibold text-blue-300">"{loginName.toLowerCase()}"</span>. Record this password for future sign-ins.
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">Confirming Username</span>
                    <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-100 font-medium text-sm font-mono tracking-wide text-left">
                      {loginName.toLowerCase()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">Set Password</span>
                    <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-100 font-medium text-sm font-mono tracking-widest text-left">
                      {loginPassword}
                    </div>
                  </div>

                  <button
                    onClick={handleRegisterConfirm}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-slate-100 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Password & Enter Tool
                  </button>

                  <button
                    onClick={() => {
                      setIsRegistering(false);
                      setLoginPassword('');
                    }}
                    className="w-full py-2.5 text-slate-400 hover:text-slate-100 text-xs font-semibold transition-colors"
                  >
                    Go Back / Edit Username
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-2.5 mb-2">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="font-bold text-slate-100 mb-0.5">📢 Important Notice: New Login Style!</p>
                      <p className="mb-1.5 text-slate-300">Sessions were reset for a simpler login structure. Use your new username format:</p>
                      <div className="bg-black/40 p-2 rounded-xl border border-white/10 mb-1">
                        <p className="text-[10px] text-slate-400 font-mono">Format: <strong className="text-amber-300">first_letter.last_name</strong></p>
                        <p className="text-[10px] text-slate-400 font-mono">Example: <strong className="text-cyan-300">h.sobhy</strong> (for Hesham Sobhy)</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Your existing, pre-agreed password continues to work normally.</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block text-left" htmlFor="login-name">
                      Username
                    </label>
                    <input
                      id="login-name"
                      type="text"
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono font-medium"
                      placeholder="e.g. h.sobhy"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 ">
                    <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block text-left" htmlFor="login-password">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        className="w-full pl-4 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-sans"
                        placeholder="Enter or set your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-left">
                      * If this is your first time using the app with your new username, you will set & register this password.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    id="login-submit-btn"
                    type="submit"
                    className="w-full py-3.5 bg-white/10 hover:bg-slate-800/15 border border-white/10 hover:border-white/20 text-slate-100 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-white/5 mt-4"
                  >
                    Sign In / Access
                  </button>
                </form>
              )}

              {/* Roles guide to keep tool accessible */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Shield id="badge-shield-roles" className="w-3.5 h-3.5 text-indigo-400" /> Authorized Roles
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                  <div className="p-2 bg-white/5 border border-white/5 rounded-xl">
                    <span className="font-bold text-indigo-300 block mb-0.5">Team Leaders (TL)</span>
                    <span className="text-[10px] space-y-0.5 block">
                      Hesham Sobhy, Shymaa Hassan, Amira Hassan, Emad Sayed
                    </span>
                  </div>
                  <div className="p-2 bg-white/5 border border-white/5 rounded-xl">
                    <span className="font-bold text-emerald-300 block mb-0.5">Agents</span>
                    <span className="text-[10px] block">
                      Type any other name to enter as a standard Agent
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic PWA Install / Download Prompt */}
              {/* Install prompt removed from login screen */}
            </div>
          </div>
        ) : (
          /* User Logged In Portal */
          <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 my-4 lg:my-6">
            
            {/* Navigation / Sidebar Menu */}
            <aside className="w-full md:w-64 border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col p-5 rounded-2xl sm:rounded-3xl shadow-xl space-y-6">
              
              {/* Egypt Local Time & 10th of Ramadan Weather */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    Cairo, Egypt
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Cairo', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-black text-slate-100 font-mono tracking-tight">
                    {currentTime.toLocaleTimeString('en-US', {
                      timeZone: 'Africa/Cairo',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </p>
                  {ramadanTemp !== null && (
                    <div className="flex items-center gap-1 text-xs text-[#FCD34D] font-bold font-mono">
                      {ramadanWeatherCode === 0 ? (
                        <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      ) : ramadanWeatherCode < 3 ? (
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Cloudy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{ramadanTemp.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-white/5 pt-1.5">
                  <span className="truncate">10th of Ramadan City</span>
                  <span className="font-mono text-slate-500">PC: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Profile Card and Title */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/80 border border-white/10">
                      <CoolLogo className="w-6 h-6 text-slate-100" />
                    </div>
                    <div>
                      <h1 className="text-sm font-black tracking-tight text-slate-100 font-display">Synq</h1>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-indigo-300 font-extrabold uppercase tracking-wide">Work Portal</span>
                        <div className="flex items-center gap-1 px-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-black text-emerald-400 uppercase tracking-tighter">
                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          Offline
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Dark/Light mode toggle */}
                    <button
                      onClick={() => {
                        setIsDarkMode(!isDarkMode);
                        toast.success(`Theme switched to ${!isDarkMode ? 'Dark' : 'Light'} Mode! 🎨`);
                      }}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-slate-300 hover:text-slate-100 cursor-pointer flex items-center justify-center"
                      title="Toggle Dark/Light Mode"
                    >
                      {isDarkMode ? (
                        <span className="text-xs leading-none">☀️</span>
                      ) : (
                        <span className="text-xs leading-none">🌙</span>
                      )}
                    </button>

                    {/* Notification Center Trigger */}
                    <button
                      onClick={() => setIsNotifDrawerOpen(true)}
                      className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-slate-300 hover:text-slate-100 cursor-pointer group flex items-center justify-center"
                      title="Real-time Alerts Inbox"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 text-[8px] font-black font-sans text-white flex items-center justify-center">
                            {unreadCount}
                          </span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center font-black text-sm text-slate-100">
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-100 truncate">{formatAgentName(currentUser.name)}</p>
                      <p className="text-[10px] uppercase tracking-widest font-mono text-indigo-300 font-semibold">
                        {currentUser.role === 'tl' ? '👑 Team Leader' : (supportAssignments[currentUser.name] ? '⚡ Support' : '👤 Agent')}
                      </p>
                    </div>
                  </div>

                  {/* Spotlight Profile Window - Bio & Daily Updates with real-time Firebase syncing */}
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5 font-sans">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      <span>My Spotlight 🌟</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-normal uppercase ${
                        (currentUser.status || 'online') === 'online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 animate-pulse' :
                        (currentUser.status || 'online') === 'busy' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' :
                        (currentUser.status || 'online') === 'away' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/25'
                      }`}>
                        {(currentUser.status || 'online')}
                      </span>
                    </div>

                    {/* Quick Profile Bio */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Short Bio:</label>
                      <textarea
                        value={currentUser.bio || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const userDocId = currentUser?.name?.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setCurrentUser(prev => prev ? { ...prev, bio: val } : null);
                          setDoc(doc(db, "users", userDocId), { bio: val }, { merge: true }).catch(console.error);
                        }}
                        placeholder="Tell others about yourself..."
                        rows={2}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-lg px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all resize-none custom-scrollbar"
                      />
                    </div>

                    {/* Daily Updates small window */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Daily Updates / Focus: 📝</label>
                      <textarea
                        value={currentUser.dailyUpdate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const userDocId = currentUser?.name?.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setCurrentUser(prev => prev ? { ...prev, dailyUpdate: val } : null);
                          setDoc(doc(db, "users", userDocId), { dailyUpdate: val }, { merge: true }).catch(console.error);
                        }}
                        placeholder="E.g. working on social media posts..."
                        rows={2}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-lg px-2 py-1 text-[11px] text-indigo-300 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/45 transition-all resize-none custom-scrollbar"
                      />
                    </div>
                  </div>

                  {supportAssignments[currentUser.name] && (
                    <div className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 p-2.5 rounded-lg space-y-1 font-sans">
                      <p className="font-extrabold uppercase tracking-widest text-[#a5b4fc] text-[8px]">Support Assigned By</p>
                      <p className="text-slate-100 font-semibold flex items-center gap-1">👑 {supportAssignments[currentUser.name].assignedBy}</p>
                      <p className="text-[8px] text-slate-400">{new Date(supportAssignments[currentUser.name].assignedAt).toLocaleString()}</p>
                    </div>
                  )}

                  {showInstallBtn && (
                    (currentUser.role as string) === 'tl' || 
                    (currentUser.role as string) === 'admin' || 
                    (currentUser.role as string) === 'director' || 
                    (currentUser.role === 'agent' && !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
                  ) && (
                    <button
                      onClick={handleInstallClick}
                      className="w-full px-3 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/25 text-indigo-300 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Desktop App
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      toast.loading("Updating app and flushing caches...");
                      if ('caches' in window) {
                         try {
                           const names = await caches.keys();
                           for (let name of names) await caches.delete(name);
                         } catch (e) {
                           console.error("Cache flush error", e);
                         }
                      }
                      
                      if (isTLOreSupport) {
                        try {
                          const newVer = CURRENT_APP_VERSION + 1;
                          await setDoc(doc(db, "system", "app_version"), { version: newVer }, { merge: true });
                          toast.success(`Broadcasting system update (Version ${newVer})...`);
                        } catch (err) {
                          console.error("Failed to propagate global version", err);
                        }
                      }
                      
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    }}
                    className="w-full px-3 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/25 text-emerald-300 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mb-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                    Update App (Force Sync)
                  </button>

                  <button
                    id="signout-button"
                    onClick={handleSignOut}
                    className="w-full px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/10 text-rose-300 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer mb-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out Portal
                  </button>
                  {currentUser?.name === 'Hesham Sobhy' && (
                    <button
                      onClick={() => {
                        if (window.confirm("WARNING: This will factory reset and erase ALL data across all devices! Continue?")) {
                          const keys = [
                            'sched_inquiries', 
                            'sched_tabby_tamara', 
                            'sched_tt_complaints', 
                            'sched_requests', 
                            'sched_time_logs', 
                            'sched_schedules', 
                            'sched_support_assignments', 
                            'sched_cases', 
                            'sched_client_comms'
                          ];
                          keys.forEach(k => {
                            setStorageItem(k, []);
                          });
                          
                          // Clear local states to update UI immediately
                          setInquiries([]);
                          setTabbyTamaraRequests([]);
                          setTabbyTamaraComplaints([]);
                          setRequests([]);
                          setTimeLogs([]);
                          setSchedules([]);
                          setSupportAssignments({});
                          setCases([]);
                          setClientComms([]);
                          
                          toast.success('System Factory Reset: All local data cleared!');
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-red-950 border border-red-500/50 text-red-200 hover:bg-red-900 rounded-lg text-[10px] font-bold transition-all mt-2 uppercase cursor-pointer shadow-lg shadow-red-900/20"
                    >
                      Factory Reset All Data
                    </button>
                  )}
                </div>
              </div>

              {/* Left Nav Elements */}
                            <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 pb-4">
                {(() => {
                  const buildBtn = (id, icon, label, bgColors = '') => {
                    const isActive = activeTab === id;
                    const baseClass = isActive 
                      ? (`${bgColors} text-white shadow-lg scale-[1.02] font-bold border`)
                      : 'border-transparent text-slate-300 hover:bg-slate-700/60 hover:text-white border font-medium hover:scale-[1.01]';
                    
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 text-sm ${baseClass} group`}
                      >
                        <span className="flex items-center gap-2.5">
                          {icon}
                          {label}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'}`} />
                      </button>
                    );
                  };

                  const groupTitle = (title, emoji, color) => (
                    <span className={`text-[10px] tracking-wider uppercase font-bold ${color} block px-3 mt-4 mb-1.5`}>
                      {emoji} {title}
                    </span>
                  );

                  if (isTLOreSupport) {
                     return (
                      <>
                        {groupTitle("Operations & Triage", "📋", "text-teal-600")}
                        {buildBtn("tl-announcements", <Bell className="w-4 h-4 text-yellow-400" />, "TL Announcements", "bg-yellow-500/20 border-yellow-500/30 text-yellow-100")}
                        {buildBtn("client-search", <Search className="w-4 h-4 text-cyan-400" />, "Patient Search Hub", "bg-cyan-500/20 border-cyan-500/30 text-cyan-100")}
                        {buildBtn("inquiries", <HelpCircle className="w-4 h-4 text-amber-500" />, "General Inquiries", "bg-amber-500/20 border-amber-500/30 text-amber-100")}
                        {buildBtn("tabby-tamara", <Wallet className="w-4 h-4 text-rose-500" />, "Tabby & Tamara Requests", "bg-rose-500/20 border-rose-500/30 text-rose-100")}
                        {buildBtn("complaints", <AlertTriangle className="w-4 h-4 text-red-500" />, "Complaints", "bg-red-500/20 border-red-500/30 text-red-100")}
                        {buildBtn("client-comms", <MessageSquare className="w-4 h-4 text-sky-500" />, "Client Comm Requests", "bg-sky-500/20 border-sky-500/30 text-sky-100")}
                        {buildBtn("cases", <History className="w-4 h-4 text-orange-500" />, "My Cases", "bg-orange-500/20 border-orange-500/30 text-orange-100")}
                        {buildBtn("submissions-log", <ClipboardList className="w-4 h-4 text-purple-400" />, "Agent Submissions Log", "bg-purple-500/20 border-purple-500/30 text-purple-100")}

                        {groupTitle("Core Analytics & RTM", "📊", "text-indigo-600")}
                        {buildBtn("profile", <UserIcon className="w-4 h-4 text-pink-400" />, "My Profile & Workspace", "bg-indigo-500/20 border-indigo-500/30 text-indigo-100")}
                        {buildBtn("dashboard", <LayoutDashboard className="w-4 h-4 text-indigo-500" />, "Global Dashboard", "bg-indigo-900 border-indigo-800")}
                        {buildBtn("time-logs", <Activity className="w-4 h-4 text-emerald-500" />, "Live RTM & Agent Logs", "bg-emerald-900 border-emerald-800")}
                        {buildBtn("report", <BarChart2 className="w-4 h-4 text-purple-500" />, "Daily Metrics Reports", "bg-purple-900 border-purple-800")}

                        {groupTitle("Workforce Management", "📅", "text-blue-600")}
                        {buildBtn("schedules", <Calendar className="w-4 h-4" />, "Schedules & Roster", "bg-blue-500/20 border-blue-500/30 text-blue-100")}
                        {buildBtn("overview", <UserCheck className="w-4 h-4" />, "Approvals & Leave Console", "bg-blue-500/20 border-blue-500/30 text-blue-100")}
                        
                        {groupTitle("System Controls", "⚙️", "text-slate-400")}
                        {buildBtn("integrations", <Sparkles className="w-4 h-4 text-amber-400" />, "Integrations Hub", "bg-indigo-900/30 border-indigo-800")}
                        {buildBtn("directory", <Users className="w-4 h-4 text-cyan-600" />, "Headcount & Directory", "bg-slate-500/20 border-slate-500/30 text-slate-200")}
                        {buildBtn("tl-feedback", <MessageCircle className="w-4 h-4 text-pink-500" />, "Director Hub", "bg-pink-500/20 border-pink-500/30 text-pink-100")}
                        {buildBtn("qa-scorecard", <CheckCircle2 className="w-4 h-4 text-green-500" />, "QA Scorecards", "bg-green-500/20 border-green-500/30 text-green-100")}
                        {buildBtn("kpi-calculator", <Calculator className="w-4 h-4 text-purple-400" />, "KPIs Calculator", "bg-purple-500/20 border-purple-500/30 text-purple-100")}
                        {isSuperAdmin && buildBtn("admin", <ShieldCheck className="w-4 h-4 text-rose-600" />, "Super Admin Control", "bg-rose-900 border-rose-800")}
                      </>
                     );
                  } else {
                     return (
                      <>
                        {groupTitle("Operations & Triage", "📋", "text-teal-600")}
                        {buildBtn("tl-announcements", <Bell className="w-4 h-4 text-yellow-400" />, "Updates & Announcements", "bg-yellow-500/20 border-yellow-500/30 text-yellow-100")}
                        {buildBtn("client-search", <Search className="w-4 h-4 text-cyan-400" />, "Patient Search Hub", "bg-cyan-500/20 border-cyan-500/30 text-cyan-100")}
                        {buildBtn("inquiries", <HelpCircle className="w-4 h-4 text-amber-500" />, "General Inquiries", "bg-amber-500/20 border-amber-500/30 text-amber-100")}
                        {buildBtn("tabby-tamara", <Wallet className="w-4 h-4 text-rose-500" />, "Tabby & Tamara Requests", "bg-rose-500/20 border-rose-500/30 text-rose-100")}
                        {buildBtn("complaints", <AlertTriangle className="w-4 h-4 text-red-500" />, "Complaints", "bg-red-500/20 border-red-500/30 text-red-100")}
                        {buildBtn("client-comms", <MessageSquare className="w-4 h-4 text-sky-500" />, "Client Comm Requests", "bg-sky-500/20 border-sky-500/30 text-sky-100")}
                        {buildBtn("cases", <History className="w-4 h-4 text-orange-500" />, "My Cases", "bg-orange-500/20 border-orange-500/30 text-orange-100")}
                        {buildBtn("qa-scorecard", <CheckCircle2 className="w-4 h-4 text-green-500" />, "My QA Scorecards", "bg-green-500/20 border-green-500/30 text-green-100")}

                        {groupTitle("My Core Workspace", "📊", "text-indigo-600")}
                        {buildBtn("profile", <UserIcon className="w-4 h-4 text-pink-400" />, "My Profile & Workspace", "bg-indigo-500/20 border-indigo-500/30 text-indigo-100")}
                        {buildBtn("dashboard", <LayoutDashboard className="w-4 h-4 text-indigo-500" />, "Personal Dashboard", "bg-indigo-900 border-indigo-800")}
                        {buildBtn("clocking", <Activity className="w-4 h-4 text-emerald-500" />, "My Time Logs & Status", "bg-emerald-900 border-emerald-800")}

                        {groupTitle("My Planning & Leave", "📅", "text-blue-600")}
                        {buildBtn("schedules", <Calendar className="w-4 h-4" />, "My Schedule", "bg-blue-500/20 border-blue-500/30 text-blue-100")}
                        {buildBtn("apply", <PlusCircle className="w-4 h-4 text-emerald-400" />, "Submit Leave / Swap", "bg-emerald-500/20 border-emerald-500/30 text-emerald-100")}
                        {buildBtn("my-requests", <GitPullRequest className="w-4 h-4" />, "My Swap & Leave Requests", "bg-blue-500/20 border-blue-500/30 text-blue-100")}

                        {groupTitle("Shared Goodies", "☕", "text-fuchsia-400")}
                        {buildBtn("tl-feedback", <MessageCircle className="w-4 h-4 text-pink-500" />, "TL Hub", "bg-pink-500/20 border-pink-500/30 text-pink-100")}
                        {isSuperAdmin && buildBtn("admin", <ShieldCheck className="w-4 h-4 text-rose-600" />, "Super Admin Control", "bg-rose-900 border-rose-800")}
                      </>
                     );
                  }
                })()}
              </nav>


              {/* Mini Standalone Disclaimer block */}
              <div className="mt-auto pt-4 border-t border-white/5 text-[10px] text-slate-400 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold font-mono">
                  <Info className="w-3.5 h-3.5 text-indigo-400" /> STANDALONE COMPLIANT
                </div>
                <p>This web application executes and persists database operations client-side, enabling full utility offline or loaded locally on any PC.</p>
              </div>

            </aside>


            {/* Primary Content Screen */}
            <main className={`flex-1 flex flex-col gap-6 overflow-hidden relative ${
              currentUser.role === 'tl' ? 'shadow-[inset_0_20px_50px_-20px_rgba(99,102,241,0.1)]' : 
              (supportAssignments[currentUser.name] ? 'shadow-[inset_0_20px_50px_-20px_rgba(245,158,11,0.1)]' : 'shadow-[inset_0_20px_50px_-20px_rgba(16,185,129,0.1)]')
            }`}>
              {/* Role-Specific Background Accent Blur */}
              <div className={`absolute top-[-10%] left-[20%] w-[60%] h-[20%] blur-[120px] opacity-20 pointer-events-none rounded-full ${
                currentUser.role === 'tl' ? 'bg-indigo-500' : 
                (supportAssignments[currentUser.name] ? 'bg-amber-500' : 'bg-emerald-500')
              }`} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex flex-col gap-6"
                >
                  {activeTab === 'dashboard' && (
                    <DashboardSummary 
                      currentUser={currentUser}
                      myNextShift={schedules.find(s => 
                        s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && 
                        s.date >= getLocalISOString()
                      )}
                      pendingRequestsCount={
                        currentUser.role === 'tl' 
                          ? requests.filter(r => r.status === 'pending').length
                          : clientComms.filter(c => c.status === 'pending').length
                      }
                      activeCasesCount={cases.filter(c => 
                        c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() &&
                        c.createdAt.startsWith(getLocalISOString())
                      ).length}
                      inquiriesCount={inquiries.filter(i => 
                        currentUser.role === 'tl' || i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase()
                      ).length}
                      ttRequestsCount={tabbyTamaraRequests.filter(i => 
                        currentUser.role === 'tl' || i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase()
                      ).length}
                      qaScores={qaScores}
                      onNavigate={(tab) => setActiveTab(tab === 'roster' ? 'schedules' : tab)}
                      announcements={announcements}
                    />
                  )}
              
              {activeTab === 'integrations' && (
                <IntegrationsManager 
                  currentUser={currentUser} 
                  onReset={handleResetAllData}
                />
              )}

              {/* Client Comm Queue Notification for TLs and Chat Agents */}
              {((currentUser.role === 'tl' || getAgentLOB(currentUser.name) === 'Social Media')) && clientComms.some(c => c.status === 'pending') && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 shadow-xl shadow-indigo-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 relative">
                      <MessageSquare className="w-5 h-5" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        Communication Queue Active
                        <span className="bg-rose-500/20 text-rose-300 text-[9px] px-2 py-0.5 rounded-full border border-rose-500/30 font-black">
                          {clientComms.filter(c => c.status === 'pending').length} REQUESTS
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                        Awaiting Chat / Social Media Agent handling
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {(() => {
                      const pending = clientComms.filter(c => c.status === 'pending');
                      if (pending.length === 0) return null;
                      const oldest = [...pending].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
                      const start = new Date(oldest.createdAt).getTime();
                      const diff = currentTime.getTime() - start;
                      const mins = Math.floor(diff / 60000);
                      const secs = Math.floor((diff % 60000) / 1000);
                      
                      return (
                        <div className="text-center sm:text-right px-4 py-2 bg-black/20 rounded-xl border border-white/5 flex-1 sm:flex-initial">
                          <p className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Queue Time (Oldest)</p>
                          <p className="text-sm font-mono text-amber-400 font-bold tabular-nums">
                            {mins}m {secs}s
                          </p>
                        </div>
                      );
                    })()}
                    <button 
                      onClick={() => setActiveTab('client-comms')}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/30 flex-1 sm:flex-initial uppercase tracking-wider"
                    >
                      Process Queue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Live Inquiry Notifications */}
              {currentUser.role === 'agent' && inquiries.some(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && (i.status === 'sent' || i.status === 'answered') && !i.seenByAgent) && (
                <div id="inquiry-unseen-notifications" className="space-y-3 animate-fade-in">
                  {inquiries
                    .filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && (i.status === 'sent' || i.status === 'answered') && !i.seenByAgent)
                    .map(inq => (
                      <div key={inq.id} className="relative overflow-hidden p-5 rounded-3xl border backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950/80 border-indigo-500/30">
                        {/* Glow indicator line */}
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-500"></div>
                        
                        <div className="flex items-start gap-3.5 pl-1.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${inq.status === 'sent' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'}`}>
                            {inq.status === 'sent' ? <Send className="w-4 h-4 animate-pulse" /> : <CheckCircle2 className="w-4 h-4 animate-bounce" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg font-bold">Inquiry Update</span>
                              <span className="text-[9px] text-slate-400">{new Date(inq.sentAt || inq.answeredAt || inq.createdAt).toLocaleString()}</span>
                            </div>
                            {inq.status === 'sent' ? (
                              <p className="text-sm text-slate-200">
                                Your inquiry (<em>"{inq.text.substring(0, 50)}{inq.text.length > 50 ? '...' : ''}"</em>) was updated to <strong className="text-amber-400 font-bold uppercase">Sent</strong> by Team Leader <strong>{inq.sentBy}</strong>.
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                <p className="text-sm text-slate-100">
                                  🎉 Your inquiry has been <strong className="text-emerald-400 font-bold uppercase">Answered</strong> by Team Leader <strong>{inq.answeredBy}</strong>!
                                </p>
                                <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-xs text-indigo-200 italic leading-relaxed">
                                  "{inq.answer}"
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleMarkInquirySeen(inq.id)}
                          className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg hover:brightness-105 transition-all text-center self-end sm:self-center shrink-0 active:scale-95"
                        >
                          Mark as Read & Dismiss
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Live Tabby/Tamara Pending Contact Notifications for Agents */}
              {currentUser.role === 'agent' && tabbyTamaraRequests.some(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && r.status === 'confirmed' && r.customerContacted === 'not_contacted') && (
                <div id="tabby-tamara-pending-notifications" className="space-y-3 animate-fade-in text-left">
                  {tabbyTamaraRequests
                    .filter(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && r.status === 'confirmed' && r.customerContacted === 'not_contacted')
                    .map(req => (
                      <div key={req.id} className="relative overflow-hidden p-5 rounded-3xl border backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/25 to-slate-950/80 border-amber-500/30">
                        {/* Glow indicator line */}
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-yellow-500"></div>
                        
                        <div className="flex items-start gap-3.5 pl-1.5 flex-1">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-amber-500/10 border-amber-500/25 text-amber-400 animate-pulse mt-0.5">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div className="space-y-1 w-full text-left">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-mono uppercase tracking-wider bg-amber-500/20 text-yellow-300 px-2 py-0.5 rounded-lg font-bold">⚠️ Customer Contact Required</span>
                              <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-2 py-1.5 rounded border border-emerald-500/20">Confirmed by {req.confirmedBy}</span>
                              <span className="text-[9px] text-slate-400">{new Date(req.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-200">
                              Your <strong className="capitalize text-amber-400">{req.platform === 'one_time_payment' ? 'One Time' : req.platform}</strong> request for patient <strong className="text-slate-100 font-bold">{req.patientName}</strong> {req.fileNumber ? <>(File Number: <span className="font-mono font-bold text-slate-100 bg-white/5 px-1.5 py-0.5 rounded">{req.fileNumber}</span>)</> : ''} has been confirmed! Please contact the client now.
                            </p>
                            <div className="flex items-center gap-2.5 text-xs pt-1.5">
                              <span className="text-slate-400 text-[11px] font-medium">Pending Contact Timer:</span>
                              <span className="text-amber-300 font-mono font-bold text-xs bg-black/45 px-2.5 py-1 border border-amber-500/20 rounded-lg animate-pulse">
                                {req.confirmedAt ? getElapsedTimerString(req.confirmedAt) : '00m 00s'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleContactTabbyTamara(req.id, 'contacted')}
                            className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 active:scale-95 text-xs text-black font-extrabold font-sans rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            📞 Mark as Contacted
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Live Tabby/Tamara Pending Complaint Contact Notifications for Agents */}
              {currentUser.role === 'agent' && tabbyTamaraComplaints.some(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && c.status === 'need_contact') && (
                <div id="tabby-tamara-complaint-pending-notifications" className="space-y-3 mt-3 animate-fade-in text-left">
                  {tabbyTamaraComplaints
                    .filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && c.status === 'need_contact')
                    .map(comp => (
                      <div key={comp.id} className="relative overflow-hidden p-5 rounded-3xl border backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl bg-gradient-to-r from-rose-950/40 via-red-950/25 to-slate-950/80 border-rose-500/30">
                        {/* Glow indicator line */}
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-rose-400 to-red-500"></div>
                        
                        <div className="flex items-start gap-3.5 pl-1.5 flex-1">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-rose-500/10 border-rose-500/25 text-rose-400 animate-pulse mt-0.5">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="space-y-1 w-full text-left">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-mono uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg font-bold">🚨 Complaint Resolution & Contact Required</span>
                              <span className="text-[10px] text-amber-300 font-extrabold uppercase bg-amber-500/10 px-2 py-1.5 rounded border border-amber-500/20">TL Commented by {comp.tlHandledBy}</span>
                              <span className="text-[9px] text-slate-400">{new Date(comp.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-200">
                              Your complaint for patient <strong className="text-slate-100 font-bold">{comp.patientName}</strong> has been processed by the TL!
                              <br />
                              <span className="text-amber-300 font-semibold block mt-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">💬 TL Comment: "{comp.tlComment}"</span>
                            </p>
                            <div className="flex items-center gap-2.5 text-xs pt-1.5">
                              <span className="text-slate-400 text-[11px] font-medium">Pending Contact Timer:</span>
                              <span className="text-rose-300 font-mono font-bold text-xs bg-black/45 px-2.5 py-1 border border-rose-500/20 rounded-lg animate-pulse">
                                {comp.tlHandledAt ? getElapsedTimerString(comp.tlHandledAt) : '00m 00s'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleToggleContactComplaint(comp.id, 'contacted')}
                            className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 active:scale-95 text-xs text-black font-extrabold font-sans rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            📞 Mark as Contacted & Close
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Swaps Awaiting Partner Agreement banner */}
              {currentUser.role === 'agent' && partnerPendingSwaps.length > 0 && (
                <div id="swaps-awaiting-agreement-panel" className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 p-5 sm:p-6 rounded-3xl backdrop-blur-xl flex flex-col space-y-4 shadow-xl animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-base font-display">Roster Swaps Awaiting Your Agreement</h4>
                      <p className="text-xs text-slate-400">Other agents requested a swap with you. Please review and approve or decline them below.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {partnerPendingSwaps.map(req => (
                      <div key={req.id} className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-all">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-100">
                            Swap requested by <span className="text-indigo-300 font-bold">{req.agentName}</span>
                          </p>
                          <div className="text-xs text-slate-300 space-y-0.5">
                            <p>For Date: <span className="font-semibold text-slate-100">{formatDateNice(req.date)}</span></p>
                            <p>
                              Your proposed shift: <span className="text-amber-300 font-semibold">{req.swapWithShift}</span> &rarr; Their shift: <span className="text-emerald-300 font-semibold">{req.shift}</span>
                            </p>
                            {req.notes && (
                              <p className="italic text-slate-400 mt-1">" {req.notes} "</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                          <button
                            onClick={() => handlePartnerDecision(req.id, true)}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                          >
                            Agree Swap
                          </button>
                          <button
                            onClick={() => handlePartnerDecision(req.id, false)}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/20 text-rose-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'profile' && currentUser && (
                <div className="space-y-6 max-w-4xl mx-auto w-full animate-fade-in relative z-10 p-4 sm:p-0 text-left">
                  <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                      <div className="relative group">
                        {currentUser.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 shadow-xl" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-indigo-500/20 text-indigo-400 border-4 border-slate-700 shadow-xl flex items-center justify-center text-3xl font-bold font-display uppercase">
                            {formatAgentName(currentUser.name).substring(0, 2)}
                          </div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity backdrop-blur-sm">
                          <span className="text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-1"><Upload className="w-3 h-3"/> Edit 📸</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                const raw = ev.target?.result as string;
                                const compressedUrl = await compressImage(raw, 500, 0.6); // smaller profile photo is perfect
                                const updated = { ...currentUser, avatarUrl: compressedUrl };
                                setCurrentUser(updated);
                                setStorageItem('sched_current_user', updated);
                                setDoc(doc(db, "users", currentUser?.name?.toLowerCase().replace(/[^a-z0-9]/g, '')), { ...updated, lastUpdated: Date.now() }, { merge: true }).catch(console.error);
                                addSystemNotification('🖼️ Profile Updated!', 'Your profile picture has been updated across the workspace! 😎', 'general', 'personal');
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }} />
                        </label>
                      </div>
                      <div className="text-center sm:text-left flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-center sm:justify-start">
                          <h2 className="text-3xl font-display font-black text-slate-100">
                            {formatAgentName(currentUser.name)} {currentUser.role === 'tl' ? '👑' : '🌟'}
                          </h2>
                          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-1 rounded mb-1">
                            LOB: {getAgentLOB(currentUser.name)} 🏢
                          </p>
                        </div>
                        <p className="text-slate-400 font-medium mt-1">
                          {currentUser.role === 'tl' ? 'Team Leader & Operations Supervisor 📊' : (supportAssignments[currentUser.name] ? 'Line Support Specialist ⚡' : 'Customer Service Representative 🎧')}
                        </p>
                        
                        <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                           <button 
                             onClick={() => {
                               const newPhone = window.prompt("Enter your personal phone number:", "");
                               if (newPhone !== null) {
                                  const updated = { ...currentUser, phone: newPhone };
                                  setCurrentUser(updated);
                                  setStorageItem('sched_current_user', updated);
                                  setDoc(doc(db, "users", currentUser?.name?.toLowerCase().replace(/[^a-z0-9]/g, '')), { ...updated, lastUpdated: Date.now() }, { merge: true }).catch(console.error);
                                  toast.success("Personal phone updated!");
                               }
                             }}
                             className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
                           >
                             📞 Edit Phone
                           </button>
                           <button 
                             onClick={() => {
                               const newEmail = window.prompt("Enter your preferred contact email:", "");
                               if (newEmail !== null) {
                                  const updated = { ...currentUser, email: newEmail };
                                  setCurrentUser(updated);
                                  setStorageItem('sched_current_user', updated);
                                  setDoc(doc(db, "users", currentUser?.name?.toLowerCase().replace(/[^a-z0-9]/g, '')), { ...updated, lastUpdated: Date.now() }, { merge: true }).catch(console.error);
                                  toast.success("Contact email updated!");
                               }
                             }}
                             className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
                           >
                             ✉️ Edit Email
                           </button>
                           <button 
                             onClick={() => {
                               const nextState = !soundEnabled;
                               setSoundEnabled(nextState);
                               if (nextState) triggerNotificationAlert();
                             }}
                             className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border rounded-lg transition-all cursor-pointer ${soundEnabled ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:text-slate-300'}`}
                           >
                             {soundEnabled ? '🔊 Sound: ON' : '🔈 Sound: OFF'}
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">📝 My Personal Inbox & Notes</h3>
                        <textarea className="w-full h-32 bg-slate-900/50 border border-white/10 text-slate-100 p-3 rounded-xl focus:border-indigo-500 outline-none resize-none text-sm font-medium" placeholder="Write anything... scratchpad... thoughts... 💭"></textarea>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-inner flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">⏱️ Smart To-Do List</h3>
                          <select 
                            value={todoFilter}
                            onChange={e => setTodoFilter(e.target.value as any)}
                            className="bg-black/30 border border-white/10 text-xs font-bold text-slate-300 rounded px-2 py-1 outline-none"
                          >
                            <option value="All">All Categories</option>
                            <option value="Work">Work</option>
                            <option value="Personal">Personal</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>
                        <form className="flex flex-col gap-2 mb-4" onSubmit={(e) => {
                           e.preventDefault();
                           const fd = new FormData(e.currentTarget);
                           const text = fd.get('text');
                           const minutes = parseInt(fd.get('mins') as string) || 0;
                           const category = fd.get('category') as string;
                           if (!text) return;
                           const reminderTimeMs = minutes ? Date.now() + minutes * 60000 : null;
                           const newItem = {
                             id: 'td_' + Date.now(),
                             agentName: currentUser.name,
                             text,
                             category,
                             isCompleted: false,
                             reminderTimeMs,
                             createdAt: new Date().toISOString()
                           };
                           setDoc(doc(db, "todos", newItem.id), newItem).catch(console.error);
                           e.currentTarget.reset();
                           addSystemNotification('📋 Task Added!', `Added: "${text}" ${minutes ? 'with a reminder set!' : ''} ✅`, 'general', 'personal');
                        }}>
                          <div className="flex gap-2">
                            <input name="text" type="text" placeholder="I need to..." required className="flex-1 bg-slate-900/50 border border-white/10 text-slate-100 px-3 py-2 text-sm rounded-xl outline-none focus:border-indigo-500" />
                            <select name="category" className="bg-slate-900/50 border border-white/10 text-slate-100 px-2 text-xs rounded-xl outline-none focus:border-indigo-500">
                              <option value="Work">Work</option>
                              <option value="Personal">Personal</option>
                              <option value="Urgent">Urgent</option>
                            </select>
                            <input name="mins" type="number" placeholder="Mins?" title="Remind in X mins" min="1" className="w-20 bg-slate-900/50 border border-white/10 text-slate-100 px-2 py-2 text-sm rounded-xl outline-none focus:border-indigo-500 text-center" />
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-indigo-500/20">+</button>
                          </div>
                        </form>
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[200px] pr-1">
                          {todos.filter(t => t.agentName === currentUser.name && (todoFilter === 'All' || t.category === todoFilter)).length === 0 ? (
                            <div className="text-center text-slate-500 text-xs py-6 italic">No tasks yet. Enjoy your free time! 🏖️</div>
                          ) : (
                            todos.filter(t => t.agentName === currentUser.name && (todoFilter === 'All' || t.category === todoFilter)).map(t => (
                              <div key={t.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${t.isCompleted ? 'bg-slate-800/30 border-slate-700/30 opacity-60' : 'bg-slate-800/80 border-slate-700 shadow-sm'}`}> 
                                <input type="checkbox" checked={t.isCompleted} onChange={() => {
                                  const done = !t.isCompleted;
                                  updateDoc(doc(db, "todos", t.id), { isCompleted: done }).catch(console.error);
                                  if (done) addSystemNotification('🎉 Goal Reached!', `You completed: "${t.text}" Awesome job! 🚀`, 'general', 'personal');
                                }} className="w-4 h-4 rounded text-indigo-500 accent-indigo-500 bg-slate-900" />
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium truncate ${t.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.text}</p>
                                    {t.category && (
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${t.category === 'Urgent' ? 'bg-rose-500/20 text-rose-300' : t.category === 'Work' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                        {t.category}
                                      </span>
                                    )}
                                  </div>
                                  {t.reminderTimeMs && !t.isCompleted && (
                                     <p className="text-[10px] text-amber-400 font-mono flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/> Remind around {new Date(t.reminderTimeMs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ⏰</p>
                                  )}
                                </div>
                                <button type="button" onClick={() => {
                                  deleteDoc(doc(db, "todos", t.id)).catch(console.error);
                                }} className="text-slate-500 hover:text-rose-400 transition-colors p-1"><X className="w-3 h-3"/></button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Activity & Data Vault Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Activity className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-100">Device Status</h3>
                            <p className="text-xs text-slate-400">Current workspace local health & sync</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                            <span className="text-xs text-slate-400">Cloud Sync</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Synced
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                            <span className="text-xs text-slate-400">Persistence Engine</span>
                            <span className="text-xs font-bold text-indigo-400 uppercase">IndexedDB Offline</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                            <span className="text-xs text-slate-400">Local OS</span>
                            <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">
                              {window.navigator.platform} Workspace
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => {
                              try {
                                const fullBackup = {
                                  localStorage: { ...localStorage },
                                  timestamp: new Date().toISOString()
                                };
                                const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `device_backup_${new Date().getTime()}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast.success("Device backup downloaded successfully! 🔐");
                              } catch (e) {
                                toast.error("Failed to generate backup.");
                              }
                            }}
                            className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-indigo-300 font-bold text-sm"
                          >
                            <FileText className="w-4 h-4" /> Export Device Backup
                          </button>
                        </div>
                      </div>
                      
                      {/* Placeholder for Data Vault usage / generic blocks */}

                      <DataVault userName={currentUser.name} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chat' && currentUser && (
                <div className="flex-1 overflow-hidden min-h-0 h-full max-w-7xl mx-auto w-full p-0 sm:p-4 animate-fade-in relative z-10">
                  <ErrorBoundary>
                    <MessagingSystem currentUser={currentUser} agentsList={agentsList} registeredUsers={registeredUsers} addSystemNotification={addSystemNotification} />
                  </ErrorBoundary>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="space-y-6">

                {(() => {
                  const range = {
                    startTimeMs: new Date(`${selectedDashboardDate}T07:00:00`).getTime(),
                    endTimeMs: new Date(`${selectedDashboardDate}T07:00:00`).getTime() + 24 * 60 * 60 * 1000 - 1,
                    startLabel: selectedDashboardDate,
                    endLabel: new Date(new Date(`${selectedDashboardDate}T07:00:00`).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  };
                  const isInOpDay = (ts: string | number) => {
                    const d = new Date(ts).getTime();
                    return d >= range.startTimeMs && d <= range.endTimeMs;
                  };

                  const isAllowedToView = (agentName: string) => {
                    if (currentUser.role === 'tl' || currentUser?.name?.toLowerCase() === 'hesham sobhy' || currentUser?.name?.toLowerCase() === 'amira hassan' || currentUser?.name?.toLowerCase() === 'shaymaa hassan') return true;
                    return agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
                  };

                  const opInquiries = inquiries.filter(i => isInOpDay(i.createdAt) && isAllowedToView(i.agentName));
                  const answeredInquiries = opInquiries.filter(i => i.status === 'answered');
                  const avgResTimeMin = opInquiries.length ? Math.round(answeredInquiries.reduce((acc, curr) => acc + ((new Date(curr.answeredAt || Date.now()).getTime() - new Date(curr.createdAt).getTime()) / 60000), 0) / opInquiries.length) : 0;
                  
                  const opFintech = tabbyTamaraRequests.filter(r => isInOpDay(r.createdAt) && isAllowedToView(r.agentName));
                  const confirmedFintech = opFintech.filter(i => i.status === 'confirmed' || i.status === 'rejected');
                  const fintechRate = opFintech.length ? Math.round((confirmedFintech.length / opFintech.length) * 100) : 100;
                  
                  const opComplaints = tabbyTamaraComplaints.filter(c => isInOpDay(c.createdAt) && isAllowedToView(c.agentName));
                  const closedComplaints = opComplaints.filter(i => (i.status as string) === 'resolved' || i.status === 'closed');
                  
                  const opComms = clientComms.filter(c => isInOpDay(c.createdAt) && isAllowedToView(c.callCenterAgentName || ''));
                  const contactedComms = opComms.filter(i => i.status === 'contacted' || (i.status as string) === 'resolved' || (i.status as string) === 'closed_no_answer');
                  
                  const opCases = cases.filter(c => isInOpDay(c.createdAt) && isAllowedToView(c.agentName));
                  
                  const opTimeLogs = timeLogs.filter(log => {
                    const matchesAgent = isAllowedToView(log.agentName);
                    if (!matchesAgent) return false;
                    if (log.clockIn) {
                      const cIn = new Date(log.clockIn).getTime();
                      return cIn >= range.startTimeMs && cIn <= range.endTimeMs;
                    }
                    return log.date === selectedDashboardDate;
                  });

                  const totalSubmissions = opInquiries.length + opFintech.length + opComplaints.length + opComms.length + opCases.length;
                  const totalProcessed = answeredInquiries.length + confirmedFintech.length + closedComplaints.length + contactedComms.length + opCases.filter(c => c.status === 'resolved').length;
                  const resolutionRate = totalSubmissions ? Math.round((totalProcessed / totalSubmissions) * 100) : 100;
                  const operationsScore = Math.min(100, Math.max(0, resolutionRate + (fintechRate * 0.2) - (avgResTimeMin * 0.1)));

                  const hourlyCounts = Array.from({length: 24}, (_, i) => {
                    const hr = (i + 7) % 24;
                    const inq = opInquiries.filter(inq => new Date(inq.createdAt).getHours() === hr).length;
                    const comm = opComms.filter(c => new Date(c.createdAt).getHours() === hr).length;
                    const fin = opFintech.filter(f => new Date(f.createdAt).getHours() === hr).length;
                    const totalLoad = inq + comm + fin;
                    let hrLabel = hr % 12;
                    hrLabel = hrLabel ? hrLabel : 12;
                    return { 
                      hour: hr,
                      hourLabel: `${hrLabel}${hr >= 12 ? 'PM' : 'AM'}`,
                      time: `${hr.toString().padStart(2, '0')}:00`, 
                      inquiries: inq,  
                      comms: comm,
                      fintech: fin,
                      totalLoad,
                      presence: 0
                    };
                  });
                  const peakLoad = hourlyCounts.reduce((max, h) => h.totalLoad > max.totalLoad ? h : max, hourlyCounts[0]);
                  const peakPresence = peakLoad; 

                  return (
                    <>
                    {/* NEW LOGIN STYLE REMINDER BANNER */}
                    <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <Info className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="text-left space-y-1">
                          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                            📢 Important Account Notice: New Log In Format!
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            The system now uses a cleaner, simplified username format instead of full names. Everyone was securely logged out.
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Your Login ID:</span>
                            <code className="px-2.5 py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-cyan-300">
                              first_letter.last_name
                            </code>
                            <span className="text-xs text-slate-400 font-semibold">• e.g., Hesham Sobhy enters</span>
                            <code className="px-2 py-0.5 bg-black/40 border border-white/5 rounded-md text-xs font-mono text-amber-300 font-bold">
                              h.sobhy
                            </code>
                          </div>
                          <p className="text-[10px] text-slate-400 pt-1">
                            * Your pre-agreed passwords remain exactly the same.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* View Mode Switching Tab Toggles */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 p-2.5 rounded-3xl select-none">
                      <div className="flex bg-black/30 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
                        <button
                          onClick={() => setDashboardViewMode('personal')}
                          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            dashboardViewMode === 'personal'
                              ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 text-slate-100 border border-indigo-500/40 font-bold shadow-md shadow-indigo-500/10'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'
                          }`}
                        >
                          <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                          My Performance Dashboard
                        </button>
                        <button
                          onClick={() => {
                            if (!isTLOreSupport) {
                              toast.info("Viewing general operation trends. Team roster timelines are restricted to leaders.");
                            }
                            setDashboardViewMode('team');
                          }}
                          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            dashboardViewMode === 'team'
                              ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 text-slate-100 border border-indigo-500/40 font-bold shadow-md shadow-indigo-500/10'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          Team Daily Dashboard
                        </button>
                      </div>

                      {dashboardViewMode === 'personal' && (
                        <div className="flex bg-black/30 p-1 rounded-2xl border border-white/5 w-full sm:w-auto justify-between">
                          {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setAgentDashboardTab(tab)}
                              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                agentDashboardTab === tab
                                  ? 'bg-indigo-500 text-white shadow font-black'
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                     {dashboardViewMode === 'personal' ? (
                      <div className="space-y-6">
                        {/* Agent Gamification & Excellence Badge Room */}
                        {(() => {
                          const myInquiries = inquiries.filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase());
                          const myFintech = tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase());
                          const myComms = clientComms.filter(c => (c.callCenterAgentName?.toLowerCase() === currentUser?.name?.toLowerCase() || c.handledBy?.toLowerCase() === currentUser?.name?.toLowerCase()));
                          const myCases = cases.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase());

                          const resolvedCount = 
                            myInquiries.filter(i => i.status === 'answered').length +
                            myFintech.filter(r => r.status === 'confirmed').length +
                            myComms.filter(c => c.status === 'contacted').length +
                            myCases.filter(c => c.status === 'closed').length;

                          const workedMinsCalculated = timeLogs
                            .filter(log => log.agentName?.toLowerCase() === currentUser?.name?.toLowerCase())
                            .reduce((acc, log) => {
                              const actsSum = log.activities.reduce((sum, act) => sum + (act.durationMinutes || 0), 0);
                              return acc + actsSum;
                            }, 0);

                          const xpScore = Math.floor(1000 + (resolvedCount * 75) + (workedMinsCalculated * 1.5));
                          const agentLevel = Math.floor(xpScore / 1000);
                          const levelProgress = (xpScore % 1000) / 10;

                          const holdsGoldPunctuality = workedMinsCalculated > 120;
                          const isGrandmasterResovler = resolvedCount >= 25;
                          const isTeamCommunicator = myComms.length >= 10;

                          return (
                            <div className="bg-gradient-to-r from-slate-900 via-[#18182b] to-indigo-950/30 border border-indigo-500/20 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 text-left font-sans">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">🏆</span>
                                    <h3 className="font-extrabold text-slate-100 text-base font-display">Agent Prestige & Gamification Room</h3>
                                  </div>
                                  <p className="text-slate-400 text-xs font-sans">Dynamic level tracking, badges, and operational performance reward indicators</p>
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/25">
                                  <span className="text-[10px] font-black text-indigo-300 font-mono tracking-wider">LEVEL {!isNaN(agentLevel) ? agentLevel : 0} OPERATIONS EXPERT</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6 pt-2 font-sans">
                                {/* Level Tracker */}
                                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-3.5 flex flex-col justify-between">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Level Upgrade Status</span>
                                    <span className="text-xs text-indigo-300 font-mono font-bold">{!isNaN(xpScore) ? xpScore : 0} total XP</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="w-full h-3 rounded-full bg-white/5 p-0.5 border border-white/5 overflow-hidden">
                                      <div style={{ width: `${!isNaN(levelProgress) ? levelProgress : 0}%` }} className="h-full bg-gradient-to-r from-[#22d3ee] to-[#6366f1] rounded-full transition-all duration-1000" />
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 pt-0.5 font-mono">
                                      <span>Level {!isNaN(agentLevel) ? agentLevel : 0}</span>
                                      <span>Level {!isNaN(agentLevel) ? agentLevel + 1 : 1} ({!isNaN(Math.round(100 - levelProgress)) ? Math.round(100 - levelProgress) : 0}% remaining)</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Achievement Badges Room */}
                                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2.5">
                                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Unlocked Badges</span>
                                  <div className="flex flex-wrap gap-2.5 font-sans">
                                    {holdsGoldPunctuality ? (
                                      <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5" title="Worked more than 120 minutes overall on shifts.">
                                        <Sparkles className="w-3 h-3 text-yellow-400" /> Duty Star
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 opacity-40">
                                        Duty Star (Locked)
                                      </span>
                                    )}

                                    {isGrandmasterResovler ? (
                                      <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5" title="Handled more than 25 ticket resolutions in total.">
                                        <Activity className="w-3 h-3 text-rose-400" /> Resolve King
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 opacity-40" title="Need 25 total resolutions">
                                        Resolve King (Locked)
                                      </span>
                                    )}

                                    {isTeamCommunicator ? (
                                      <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5" title="Registered communication requests">
                                        <MessageSquare className="w-3 h-3 text-cyan-400" /> Talk Champion
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 opacity-40" title="Need 10 communication requests">
                                        Talk Master (Locked)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Instant Stats overview Card */}
                                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center justify-between font-sans">
                                  <div className="space-y-0.5 text-left">
                                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider font-mono">Operations Badge Rank</span>
                                    <p className="text-xl font-bold text-slate-100 font-display">
                                      {agentLevel >= 3 ? '🏆 Platinum Synq Master' : agentLevel >= 2 ? '🎖️ Gold Operator' : '🥉 Elite Core Agent'}
                                    </p>
                                    <p className="text-[9px] text-slate-450">Continuous ranking metric updated in live database cycles</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ----------------- DAILY TAB ----------------- */}
                        {agentDashboardTab === 'daily' && (() => {
                          const myDailyInq = inquiries.filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && isInOpDay(i.createdAt));
                          const myDailyFin = tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && isInOpDay(r.createdAt));
                          const myDailyComp = tabbyTamaraComplaints.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && isInOpDay(c.createdAt));
                          const myDailyCom = clientComms.filter(c => (c.callCenterAgentName?.toLowerCase() === currentUser?.name?.toLowerCase() || c.handledBy?.toLowerCase() === currentUser?.name?.toLowerCase()) && isInOpDay(c.createdAt));
                          const myDailyCas = cases.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && isInOpDay(c.createdAt));

                          const myDailyTotal = myDailyInq.length + myDailyFin.length + myDailyComp.length + myDailyCom.length + myDailyCas.length;
                          
                          const myDailyCompleted = 
                            myDailyInq.filter(i => i.status === 'answered' || i.status === 'sent').length +
                            myDailyFin.filter(r => r.status === 'confirmed').length +
                            myDailyComp.filter(c => c.status === 'closed').length +
                            myDailyCom.filter(c => c.status === 'contacted').length +
                            myDailyCas.filter(c => c.status === 'closed').length;

                          const myDailySuccessRate = myDailyTotal > 0 ? (myDailyCompleted / myDailyTotal) * 100 : 100;

                          const myDailyLog = timeLogs.find(log => {
                            if (log.clockIn) {
                              const cIn = new Date(log.clockIn).getTime();
                              return cIn >= range.startTimeMs && cIn <= range.endTimeMs;
                            }
                            return log.date === selectedDashboardDate;
                          });

                          let clockInStr = '--:-- AM';
                          let clockOutStr = '--:-- PM';
                          let totalHoursDecimal = 0;
                          let restroomMins = 0;
                          let breakMins = 0;
                          let lunchMins = 0;
                          let isLate = false;

                          if (myDailyLog) {
                            if (myDailyLog.clockIn) {
                              const cInDate = new Date(myDailyLog.clockIn);
                              clockInStr = cInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              
                              const sched = schedules.find(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date === selectedDashboardDate);
                              if (sched && sched.shiftLabel) {
                                let schedHour = 7;
                                let schedMin = 0;
                                const match = sched.shiftLabel.match(/(\d+):(\d+)\s*(AM|PM)/i);
                                if (match) {
                                  let h = parseInt(match[1]);
                                  const m = parseInt(match[2]);
                                  const ampm = match[3].toUpperCase();
                                  if (ampm === 'PM' && h < 12) h += 12;
                                  if (ampm === 'AM' && h === 12) h = 0;
                                  schedHour = h;
                                  schedMin = m;
                                }
                                const cInMinutes = cInDate.getHours() * 60 + cInDate.getMinutes();
                                const schedMinutes = schedHour * 60 + schedMin;
                                if (cInMinutes > schedMinutes + 15) {
                                  isLate = true;
                                }
                              }
                            }
                            if (myDailyLog.clockOut) {
                              clockOutStr = new Date(myDailyLog.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            } else if (myDailyLog.clockIn) {
                              clockOutStr = 'Active';
                            }

                            const cInMs = myDailyLog.clockIn ? new Date(myDailyLog.clockIn).getTime() : 0;
                            const cOutMs = myDailyLog.clockOut ? new Date(myDailyLog.clockOut).getTime() : (myDailyLog.clockIn ? Date.now() : 0);
                            if (cInMs && cOutMs && cOutMs > cInMs) {
                              totalHoursDecimal = (cOutMs - cInMs) / (3600 * 1000);
                            }

                            myDailyLog.activities.forEach(a => {
                              const dur = a.durationMinutes || (a.endTime ? 0 : Math.max(0, (Date.now() - new Date(a.startTime).getTime()) / 60000));
                              if (a.type === 'break') breakMins += dur;
                              else if (a.type === 'lunch') lunchMins += dur;
                              else if (a.type === 'restroom') restroomMins += dur;
                            });
                          }

                          return (
                            <div className="space-y-6">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                                <div>
                                  <h2 className="text-xl font-black text-slate-100 font-display">My Daily Work Dashboard</h2>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Track, filter and audit your single-shift logs for <strong className="text-indigo-300 font-mono">{range.startLabel}</strong>
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 self-stretch sm:self-auto justify-between">
                                  <button
                                    onClick={() => {
                                      const d = new Date(selectedDashboardDate);
                                      d.setDate(d.getDate() - 1);
                                      setSelectedDashboardDate(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-1.5 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-slate-100 transition-all cursor-pointer text-xs"
                                  >
                                    &larr; Prev
                                  </button>
                                  <span className="text-slate-100 font-bold text-xs font-mono px-3">{formatDateNice(selectedDashboardDate).split(',')[0]}</span>
                                  <button
                                    onClick={() => {
                                      const d = new Date(selectedDashboardDate);
                                      d.setDate(d.getDate() + 1);
                                      setSelectedDashboardDate(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-1.5 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-slate-100 transition-all cursor-pointer text-xs"
                                  >
                                    Next &rarr;
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-fade-in">
                                <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                                  <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider mb-4">Daily Resolve Ratio</span>
                                  <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="transparent" />
                                      <circle 
                                        cx="50" cy="50" r="40" 
                                        stroke="url(#personal-gauge)" 
                                        strokeWidth="8" fill="transparent"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - myDailySuccessRate / 100)}`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                      />
                                      <defs>
                                        <linearGradient id="personal-gauge" x1="0" y1="0" x2="1" y2="1">
                                          <stop offset="0%" stopColor="#22d3ee" />
                                          <stop offset="100%" stopColor="#818cf8" />
                                        </linearGradient>
                                      </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <span className="text-2xl font-black text-slate-100 font-mono">{!isNaN(Math.round(myDailySuccessRate)) ? Math.round(myDailySuccessRate) : 0}%</span>
                                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Resolved</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-300 mt-4 font-medium">
                                    Completed <strong className="text-slate-100 font-mono">{myDailyCompleted}</strong> of <strong className="text-slate-100 font-mono">{myDailyTotal}</strong> assigned operations.
                                  </p>
                                </div>

                                <div className="md:col-span-8 grid grid-cols-2 gap-4">
                                  <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-colors"
                                  >
                                    <div className="flex justify-between items-center text-indigo-400">
                                      <HelpCircle className="w-4 h-4" />
                                      <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300">Inquiries</span>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-2xl font-mono text-slate-100 font-black">{myDailyInq.length}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Medical Qs Logged</p>
                                    </div>
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-colors"
                                  >
                                    <div className="flex justify-between items-center text-emerald-400">
                                      <Wallet className="w-4 h-4" />
                                      <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">Fintech</span>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-2xl font-mono text-slate-100 font-black">{myDailyFin.length}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tabby & Tamara Link Requests</p>
                                    </div>
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-colors"
                                  >
                                    <div className="flex justify-between items-center text-pink-400">
                                      <MessageSquare className="w-4 h-4" />
                                      <span className="text-[9px] font-mono bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded text-pink-300">Client Comms</span>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-2xl font-mono text-slate-100 font-black">{myDailyCom.length}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Client Dials Handled</p>
                                    </div>
                                  </motion.div>

                                  {currentUser.role === 'agent' && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-colors"
                                  >
                                    <div className="flex justify-between items-center text-cyan-400">
                                      <Clock className="w-4 h-4 animate-pulse" />
                                      <span className="text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">Shift</span>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-[14px] font-mono text-slate-100 font-bold truncate">{clockInStr} - {clockOutStr}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Shift Active Stream</p>
                                    </div>
                                  </motion.div>
                                  )}
                                </div>
                              </div>

                              {currentUser.role === 'agent' && (
                              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
                                <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2 mb-4">
                                  <AlertTriangle className="w-4 h-4 text-pink-400" />
                                  Punctuality & Sub-Session Allowance Logs
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-black uppercase">Schedule Compliance</p>
                                      <p className={`text-sm font-bold mt-0.5 ${isLate ? 'text-pink-400' : 'text-emerald-400'}`}>
                                        {myDailyLog ? (isLate ? '⏰ Over Grace Period' : '✓ Standard On Time') : 'No shift logged'}
                                      </p>
                                    </div>
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.05 }}
                                    className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-black uppercase">Total Active Work</p>
                                      <p className="text-sm font-bold text-slate-100 mt-0.5 font-mono">
                                        {totalHoursDecimal > 0 ? `${totalHoursDecimal.toFixed(2)} Hrs` : '0 Hrs'}
                                      </p>
                                    </div>
                                    <Clock className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                    className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-black uppercase">Restroom duration</p>
                                      <p className={`text-sm font-mono font-bold mt-0.5 ${restroomMins > 10 ? 'text-pink-400 animate-pulse' : 'text-slate-300'}`}>
                                        {!isNaN(Math.round(restroomMins)) ? Math.round(restroomMins) : 0} min <span className="text-[10px] text-slate-500">/ 10m cap</span>
                                      </p>
                                    </div>
                                    <Coffee className="w-4 h-4 text-slate-400" />
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.15 }}
                                    className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-black uppercase">Breaks & Lunch Used</p>
                                      <p className={`text-sm font-mono font-bold mt-0.5 ${breakMins + lunchMins > 45 ? 'text-pink-400' : 'text-slate-300'}`}>
                                        {!isNaN(Math.round(breakMins + lunchMins)) ? Math.round(breakMins + lunchMins) : 0} min <span className="text-[10px] text-slate-500">/ 45m cap</span>
                                      </p>
                                    </div>
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                  </motion.div>
                                </div>
                              </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* ----------------- WEEKLY TAB ----------------- */}
                        {agentDashboardTab === 'weekly' && (() => {
                          const past7Days = Array.from({ length: 7 }, (_, idx) => {
                            const d = new Date();
                            d.setDate(d.getDate() - idx);
                            return d.toISOString().split('T')[0];
                          }).reverse();

                          const weeklyDataPoints = past7Days.map(dateStr => {
                            const dayStartMs = new Date(`${dateStr}T07:00:00`).getTime();
                            const nextD = new Date(dateStr);
                            nextD.setDate(nextD.getDate() + 1);
                            const nextDateStr = nextD.toISOString().split('T')[0];
                            const dayEndMs = new Date(`${nextDateStr}T06:59:59.999`).getTime();

                            const isInDayRange = (createdAtStr?: string | null) => {
                              if (!createdAtStr) return false;
                              const ms = new Date(createdAtStr).getTime();
                              return ms >= dayStartMs && ms <= dayEndMs;
                            };

                            const inq = inquiries.filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && isInDayRange(i.createdAt)).length;
                            const fin = tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && isInDayRange(r.createdAt)).length;
                            const comp = tabbyTamaraComplaints.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && isInDayRange(c.createdAt)).length;
                            const comm = clientComms.filter(c => (c.callCenterAgentName?.toLowerCase() === currentUser?.name?.toLowerCase() || c.handledBy?.toLowerCase() === currentUser?.name?.toLowerCase()) && isInDayRange(c.createdAt)).length;
                            const cas = cases.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && isInDayRange(c.createdAt)).length;

                            const total = inq + fin + comp + comm + cas;
                            
                            const dailyLogs = timeLogs.filter(log => {
                              if (log.clockIn) {
                                const cIn = new Date(log.clockIn).getTime();
                                return cIn >= dayStartMs && cIn <= dayEndMs;
                              }
                              return log.date === dateStr;
                            });

                            let dayHours = 0;
                            dailyLogs.forEach(dl => {
                              const cIn = dl.clockIn ? new Date(dl.clockIn).getTime() : 0;
                              const cOut = dl.clockOut ? new Date(dl.clockOut).getTime() : (dl.clockIn ? dayEndMs : 0);
                              if (cIn && cOut && cOut > cIn) {
                                dayHours += (Math.min(dayEndMs, cOut) - Math.max(dayStartMs, cIn)) / (3600 * 1000);
                              }
                            });

                            return {
                              date: dateStr,
                              label: formatDateNice(dateStr).split(',')[0],
                              total,
                              hours: dayHours
                            };
                          });

                          const totalWeeklyCount = weeklyDataPoints.reduce((acc, curr) => acc + curr.total, 0);
                          const totalWeeklyHours = weeklyDataPoints.reduce((acc, curr) => acc + curr.hours, 0);
                          const peakWeeklyDayVolume = Math.max(...weeklyDataPoints.map(dp => dp.total), 1);

                          return (
                            <div className="space-y-6">
                              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                                <h3 className="text-xl font-black text-slate-100 font-display">Weekly Work Output & Trends</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                  Your total resolving productivity and tracked clock-in hours for the last 7 calendar days
                                </p>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                                <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider mb-2">Daily Interactions Handled</h4>
                                    <p className="text-xs text-slate-400 mb-6 font-medium">Visual distribution representing active day outputs</p>
                                  </div>

                                  <div className="h-48 flex items-end justify-between gap-3 pt-6 relative border-b border-white/10 px-2 select-none">
                                    {weeklyDataPoints.map((dp, idx) => {
                                      const barHeightPercent = (dp.total / peakWeeklyDayVolume) * 75;
                                      return (
                                        <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-transparent border border-indigo-400 px-2 py-1 rounded text-[10px] text-slate-100 font-mono transition-opacity duration-200 z-10 font-bold whitespace-nowrap shadow-xl">
                                            {dp.total} tasks | {dp.hours.toFixed(1)}rs
                                          </div>

                                          <div 
                                            className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-indigo-500/40 via-cyan-500/20 to-indigo-500/10 border border-indigo-500/30 group-hover:from-cyan-400 group-hover:to-pink-500 transition-all duration-300"
                                            style={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                                          />

                                          <span className="text-[9px] font-bold text-slate-400 font-sans tracking-tight mt-2 rotate-12 sm:rotate-0">
                                            {dp.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider mb-4">Weekly Summary Stats</h4>
                                    
                                    <div className="space-y-4">
                                      <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Aggregate Resolved Tasks</span>
                                        <div className="flex items-baseline gap-2 mt-1">
                                          <span className="text-3xl font-mono text-slate-100 font-black">{totalWeeklyCount}</span>
                                          <span className="text-xs text-slate-400">Total inputs</span>
                                        </div>
                                      </div>

                                      <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Logged Clock Duration</span>
                                        <div className="flex items-baseline gap-2 mt-1">
                                          <span className="text-3xl font-mono text-cyan-400 font-black">{totalWeeklyHours.toFixed(1)}</span>
                                          <span className="text-xs text-slate-400">Hours overall</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t border-white/5 mt-6 pt-4 text-xs text-slate-400 font-medium">
                                    ✓ Average of <strong className="text-slate-100">{(totalWeeklyCount / 7).toFixed(1)}</strong> complete ticket conversions per shift day this week.
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ----------------- MONTHLY TAB ----------------- */}
                        {agentDashboardTab === 'monthly' && (() => {
                          const past30DaysMs = 30 * 24 * 3600 * 1000;
                          const startOfLimitMs = Date.now() - past30DaysMs;

                          const monthlyInq = inquiries.filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && i.createdAt && new Date(i.createdAt).getTime() >= startOfLimitMs);
                          const monthlyFin = tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && r.createdAt && new Date(r.createdAt).getTime() >= startOfLimitMs);
                          const monthlyComp = tabbyTamaraComplaints.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && c.createdAt && new Date(c.createdAt).getTime() >= startOfLimitMs);
                          const monthlyCom = clientComms.filter(c => (c.callCenterAgentName?.toLowerCase() === currentUser?.name?.toLowerCase() || c.handledBy?.toLowerCase() === currentUser?.name?.toLowerCase()) && c.createdAt && new Date(c.createdAt).getTime() >= startOfLimitMs);
                          const monthlyCas = cases.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && c.createdAt && new Date(c.createdAt).getTime() >= startOfLimitMs);

                          const myMonthlyTotalCount = monthlyInq.length + monthlyFin.length + monthlyComp.length + monthlyCom.length + monthlyCas.length;

                          const myMonthlyLogs = timeLogs.filter(log => log.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && log.clockIn && new Date(log.clockIn).getTime() >= startOfLimitMs);
                          
                          let schedLogsCount = 0;
                          let myOnTimeCount = 0;

                          myMonthlyLogs.forEach(log => {
                            const dateStr = log.date;
                            const sched = schedules.find(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date === dateStr);
                            if (sched && sched.shiftLabel && !['OFF', 'DAY OFF', 'LEAVE', 'VACATION'].includes(sched.shiftLabel.toUpperCase())) {
                              schedLogsCount++;
                              if (log.clockIn) {
                                const cInDate = new Date(log.clockIn);
                                let schedHour = 7;
                                let schedMin = 0;
                                const match = sched.shiftLabel.match(/(\d+):(\d+)\s*(AM|PM)/i);
                                if (match) {
                                  let h = parseInt(match[1]);
                                  const m = parseInt(match[2]);
                                  const ampm = match[3].toUpperCase();
                                  if (ampm === 'PM' && h < 12) h += 12;
                                  if (ampm === 'AM' && h === 12) h = 0;
                                  schedHour = h;
                                  schedMin = m;
                                }
                                const cInMinutes = cInDate.getHours() * 60 + cInDate.getMinutes();
                                const schedMinutes = schedHour * 60 + schedMin;
                                if (cInMinutes <= schedMinutes + 15) {
                                  myOnTimeCount++;
                                }
                              }
                            }
                          });

                          const punctScore = schedLogsCount > 0 ? (myOnTimeCount / schedLogsCount) * 100 : 96;

                          let badgeTitle = "Sync Core Agent";
                          let badgeIcon = "🏆";
                          let badgeGradient = "from-slate-400 to-slate-500 border-slate-400/30 bg-slate-500/10";
                          let badgeDesc = "Consistently contributing core sync resolutions to ensure clinic metrics compliance on every shift.";

                          if (myMonthlyTotalCount >= 100 && punctScore >= 95) {
                            badgeTitle = "Master Sync Communicator";
                            badgeIcon = "💎";
                            badgeGradient = "from-indigo-400 via-pink-400 to-cyan-400 border-pink-500/30 bg-indigo-500/10 shadow shadow-indigo-500/20 text-indigo-200";
                            badgeDesc = "Awarded to the most elite resolvers displaying exceptional punctuality standards and unprecedented task metrics!";
                          } else if (myMonthlyTotalCount >= 60) {
                            badgeTitle = "High-Yield Resolving Champion";
                            badgeIcon = "⚡";
                            badgeGradient = "from-cyan-400 to-indigo-500 border-indigo-500/30 bg-indigo-500/10 text-cyan-200";
                            badgeDesc = "Awarded for completing massive volumes of inquiries and payment flows during busy call center duty cycles.";
                          } else if (punctScore >= 96) {
                            badgeTitle = "Chronos Punctuality Ace";
                            badgeIcon = "⏳";
                            badgeGradient = "from-[#fbbf24] to-[#f59e0b] border-amber-400/30 bg-amber-500/10 text-amber-200";
                            badgeDesc = "Awarded for exceptional calendar discipline, clocking in perfectly to cover morning call handovers on time.";
                          }

                          return (
                            <div className="space-y-6">
                              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                                <h3 className="text-xl font-black text-slate-100 font-display">Monthly Performance & Achievement Desk</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                  Your professional rolling 30-day index of achievements, punctuality indices, and work volumes
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                                <div className="md:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-between text-center">
                                  <div>
                                    <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Motivational Badge Status</span>
                                    <h4 className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tight">System Tier Rating</h4>
                                  </div>

                                  <div className="my-8 flex flex-col items-center">
                                    <span className="text-6xl animate-bounce duration-1000 select-none pb-2">{badgeIcon}</span>
                                    <div className={`mt-4 px-4 py-2 border rounded-2xl bg-gradient-to-r text-base font-black uppercase tracking-wider ${badgeGradient}`}>
                                      {badgeTitle}
                                    </div>
                                    <p className="text-xs text-slate-300 max-w-xs mt-4 leading-relaxed font-semibold">
                                      "{badgeDesc}"
                                    </p>
                                  </div>

                                  <div className="text-[10px] text-slate-500 font-mono font-black uppercase tracking-widest">
                                    Calculated Live from Database logs
                                  </div>
                                </div>

                                <div className="md:col-span-7 space-y-4">
                                  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                                    <h4 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider mb-4">30-Day Operation Ratios</h4>
                                    
                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
                                          <span className="font-bold">Total Operations Logs</span>
                                          <span className="font-mono font-black text-slate-100">{myMonthlyTotalCount} Files Handled</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min((myMonthlyTotalCount / 120) * 100, 100)}%` }} />
                                        </div>
                                      </div>

                                      {currentUser.role === 'agent' && (
                                      <div>
                                        <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
                                          <span className="font-bold">Shift Punctuality Score</span>
                                          <span className="font-mono font-black text-emerald-400">{punctScore.toFixed(0)}% On Time</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${punctScore}%` }} />
                                        </div>
                                      </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3 font-sans">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                      <span className="text-[9px] text-slate-500 uppercase font-black">Medical Qs</span>
                                      <p className="text-xl font-mono text-slate-100 font-black mt-1">{monthlyInq.length}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                      <span className="text-[9px] text-[#22d3ee] uppercase font-black">Fintech Cash</span>
                                      <p className="text-xl font-mono text-slate-100 font-black mt-1">{monthlyFin.length}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                      <span className="text-[9px] text-slate-400 uppercase font-black font-sans">Dials Handled</span>
                                      <p className="text-xl font-mono text-slate-100 font-black mt-1">{monthlyCom.length}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Header Controls Banner */}
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl animate-fade-in">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                            Synq Engine
                          </span>
                          {selectedDashboardDate === getLocalISOString() && (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                              Live Today
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-100 font-display mt-1">Daily Analytics & Operations</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Aggregating continuous shift cycles from <strong className="text-indigo-300 font-mono">07:00 AM</strong> to <strong className="text-indigo-300 font-mono">06:59 AM</strong> on next calendar day
                        </p>
                      </div>

                      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto">
                        {/* Search Filter for Floor Tracking */}
                        <div className="flex relative w-full lg:w-48">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter by agent..."
                            value={dashboardSearchTeam}
                            onChange={(e) => setDashboardSearchTeam(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-slate-100 text-xs rounded-2xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                            spellCheck="false"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1">
                          <button
                            onClick={() => {
                              const d = new Date(selectedDashboardDate);
                              d.setDate(d.getDate() - 1);
                              setSelectedDashboardDate(d.toISOString().split('T')[0]);
                            }}
                            className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-slate-100 transition-all cursor-pointer"
                          >
                            &larr;
                          </button>
                          <input
                            type="date"
                            value={selectedDashboardDate}
                            onChange={(e) => {
                              if (e.target.value) setSelectedDashboardDate(e.target.value);
                            }}
                            className="bg-transparent border-0 text-slate-100 font-bold text-xs font-mono outline-none focus:ring-0 cursor-pointer px-2"
                          />
                          <button
                            onClick={() => {
                              const d = new Date(selectedDashboardDate);
                              d.setDate(d.getDate() + 1);
                              setSelectedDashboardDate(d.toISOString().split('T')[0]);
                            }}
                            className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-slate-100 transition-all cursor-pointer"
                          >
                            &rarr;
                          </button>
                        </div>

                        {/* Presets */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedDashboardDate(getLocalISOString());
                            }}
                            className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                              selectedDashboardDate === getLocalISOString()
                                ? 'bg-indigo-500 text-white border-indigo-400'
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            Today
                          </button>
                          <button
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() - 1);
                              setSelectedDashboardDate(d.toISOString().split('T')[0]);
                            }}
                            className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                              selectedDashboardDate === (() => {
                                const y = new Date();
                                y.setDate(y.getDate() - 1);
                                return y.toISOString().split('T')[0];
                              })()
                                ? 'bg-indigo-500 text-white border-indigo-400'
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            Yesterday
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Meta Interval Descriptor Banner */}
                    <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-pink-500/10 border border-indigo-500/15 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-slate-300">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>Active Operational Period:</span>
                        <strong className="text-slate-100 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">{range.startLabel}</strong>
                        <span>&rarr;</span>
                        <strong className="text-slate-100 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">{range.endLabel}</strong>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                        TimeZone: Real-time Live Sync
                      </span>
                    </div>

                    {/* Agent Excellence Team Leaderboard */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl shadow-sm text-slate-100 p-6 shadow-2xl space-y-4 text-left animate-fade-in font-sans">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
                        <div>
                          <h3 className="font-extrabold text-transparent bg-gradient-to-r from-yellow-300 via-indigo-200 to-amber-300 bg-clip-text text-lg font-display flex items-center gap-2">
                            <span>🏆</span>
                            Team Prestige Leaderboard
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5 font-sans">Continuous gamified rankings based on resolved ticket weight and clock schedule adherence</p>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20 font-mono">
                          Gamified Arena
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Podium Top 3 */}
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-3.5 flex flex-col justify-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Today's Prestige Podium</p>
                          {(() => {
                            const scores = agentsList.map(aName => {
                              const myInquiries = inquiries.filter(i => i.agentName?.toLowerCase() === aName?.toLowerCase());
                              const myFintech = tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === aName?.toLowerCase());
                              const myComms = clientComms.filter(c => (c.callCenterAgentName?.toLowerCase() === aName?.toLowerCase() || c.handledBy?.toLowerCase() === aName?.toLowerCase()));
                              const myCases = cases.filter(c => c.agentName?.toLowerCase() === aName?.toLowerCase());

                              const resolvedC = 
                                myInquiries.filter(i => i.status === 'answered').length +
                                myFintech.filter(r => r.status === 'confirmed').length +
                                myComms.filter(c => c.status === 'contacted').length +
                                myCases.filter(c => c.status === 'closed').length;

                              const workedMinsC = timeLogs
                                .filter(log => log.agentName?.toLowerCase() === aName?.toLowerCase())
                                .reduce((acc, log) => {
                                  const actsSum = log.activities.reduce((sum, act) => sum + (act.durationMinutes || 0), 0);
                                  return acc + actsSum;
                                }, 0);

                              const xp = Math.floor(1000 + (resolvedC * 75) + (workedMinsC * 1.5));
                              return { name: aName, xp, resolved: resolvedC };
                            });

                            scores.sort((a,b) => b.xp - a.xp);
                            const top3 = scores.slice(0, 3);

                            return (
                              <div className="grid grid-cols-3 gap-3 items-end pt-4 min-h-[140px] font-sans">
                                {/* 2nd Place */}
                                {top3[1] && (
                                  <div className="flex flex-col items-center space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-400/20 border-2 border-slate-700 flex items-center justify-center font-bold text-slate-100 text-sm relative">
                                      🥈
                                    </div>
                                    <div className="bg-gradient-to-t from-slate-400/10 to-slate-400/20 border border-slate-400/20 rounded-t-xl p-2 w-full text-center space-y-0.5">
                                      <p className="text-[10px] font-black text-slate-200 truncate">{formatAgentName(top3[1].name)}</p>
                                      <p className="text-[9px] text-slate-400 font-bold font-mono">{top3[1].xp} XP</p>
                                    </div>
                                  </div>
                                )}

                                {/* 1st Place */}
                                {top3[0] && (
                                  <div className="flex flex-col items-center space-y-2">
                                    <div className="w-12 h-12 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center font-bold text-slate-100 text-base relative -top-1 shadow-lg shadow-yellow-500/10">
                                      👑
                                    </div>
                                    <div className="bg-gradient-to-t from-yellow-500/10 to-yellow-500/20 border border-yellow-400/30 rounded-t-2xl p-3 w-full text-center space-y-0.5 scale-105 relative z-10">
                                      <p className="text-xs font-black text-yellow-300 truncate">{formatAgentName(top3[0].name)}</p>
                                      <p className="text-[10px] text-yellow-400 font-extrabold font-mono">{top3[0].xp} XP</p>
                                    </div>
                                  </div>
                                )}

                                {/* 3rd Place */}
                                {top3[2] && (
                                  <div className="flex flex-col items-center space-y-2">
                                    <div className="w-9 h-9 rounded-full bg-amber-600/20 border-2 border-amber-600 flex items-center justify-center font-bold text-slate-100 text-xs relative">
                                      🥉
                                    </div>
                                    <div className="bg-gradient-to-t from-amber-600/10 to-amber-600/20 border border-amber-600/20 rounded-t-xl p-2 w-full text-center space-y-0.5">
                                      <p className="text-[9px] font-black text-amber-300 truncate">{formatAgentName(top3[2].name)}</p>
                                      <p className="text-[9px] text-slate-400 font-bold font-mono">{top3[2].xp} XP</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Ranks list view */}
                        <div className="bg-black/35 p-4 rounded-2xl border border-white/5 space-y-2.5">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Operations Leaderboard Rankings</p>
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {(() => {
                              const scores = agentsList.map(aName => {
                                const myInquiries = inquiries.filter(i => i.agentName?.toLowerCase() === aName?.toLowerCase());
                                const myFintech = tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === aName?.toLowerCase());
                                const myComms = clientComms.filter(c => (c.callCenterAgentName?.toLowerCase() === aName?.toLowerCase() || c.handledBy?.toLowerCase() === aName?.toLowerCase()));
                                const myCases = cases.filter(c => c.agentName?.toLowerCase() === aName?.toLowerCase());

                                const resolvedCount = 
                                  myInquiries.filter(i => i.status === 'answered').length +
                                  myFintech.filter(r => r.status === 'confirmed').length +
                                  myComms.filter(c => c.status === 'contacted').length +
                                  myCases.filter(c => c.status === 'closed').length;

                                const workedMinsCalculated = timeLogs
                                  .filter(log => log.agentName?.toLowerCase() === aName?.toLowerCase())
                                  .reduce((acc, log) => {
                                    const actsSum = log.activities.reduce((sum, act) => sum + (act.durationMinutes || 0), 0);
                                    return acc + actsSum;
                                  }, 0);

                                const xpScore = Math.floor(1000 + (resolvedCount * 75) + (workedMinsCalculated * 1.5));
                                return { name: aName, xp: xpScore, lob: getAgentLOB(aName) };
                              });

                              scores.sort((a,b) => b.xp - a.xp);

                              return scores.slice(0, 10).map((row, rankIndex) => {
                                return (
                                  <div key={row.name} className="flex justify-between items-center bg-slate-800/[0.02] border border-white/5 p-2 rounded-xl text-xs font-sans">
                                    <div className="flex items-center gap-2.5">
                                      <span className="font-mono text-[10px] w-4 text-center text-slate-500 font-bold">#{rankIndex + 1}</span>
                                      <div className="text-left font-sans">
                                        <p className="font-bold text-slate-100 leading-normal">{row.name}</p>
                                        <p className="text-[8px] text-slate-400 uppercase font-mono tracking-wider">{row.lob}</p>
                                      </div>
                                    </div>
                                    <span className="font-mono font-black text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/20 px-2 py-0.5 rounded-lg text-[9px]">
                                      {row.xp} XP
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operational Performance Core Ring & KPI Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Overall composite score circle gauge */}
                      <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col items-center justify-center text-center">
                        <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-4">Day Resolve Efficiency</p>
                        <div className="relative w-36 h-36 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="transparent" />
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="40" 
                              stroke="url(#eff-grad)" 
                              strokeWidth="8" 
                              fill="transparent" 
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - operationsScore / 100)}`}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                              <linearGradient id="eff-grad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="50%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#f43f5e" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-100 font-mono">{!isNaN(Math.round(operationsScore)) ? Math.round(operationsScore) : 0}%</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Completed</span>
                          </div>
                        </div>
                        <p className="text-xs text-indigo-200 mt-4 leading-relaxed font-semibold">
                          {totalSubmissions > 0 
                            ? `Handled ${totalProcessed} of ${totalSubmissions} operations successfully across all company departments.`
                            : "No incoming interactions registered inside this operational timeframe."}
                        </p>
                      </div>

                      {/* 2x2 metric micro scorecard grid */}
                      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Inquiries */}
                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:border-white/20 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-blue-500/15 text-blue-400 rounded-2xl border border-blue-500/20">
                                <HelpCircle className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-[#38bdf8] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                {!isNaN(Math.round(resolutionRate)) ? Math.round(resolutionRate) : 0}% Resolved
                              </span>
                            </div>
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Inquiries Desk</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-3xl font-black text-slate-100 font-mono">{opInquiries.length}</span>
                              <span className="text-xs text-slate-400">Total received</span>
                            </div>
                          </div>
                          <div className="border-t border-white/5 mt-4 pt-3 flex justify-between text-xs text-slate-300">
                            <div>
                              <p className="text-slate-100 font-black font-mono">{answeredInquiries.length}</p>
                              <p className="text-[10px] text-slate-400">Answered</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-100 font-black font-mono">
                                {avgResTimeMin > 0 ? `${!isNaN(Math.round(avgResTimeMin)) ? Math.round(avgResTimeMin) : 0}m` : '-'}
                              </p>
                              <p className="text-[10px] text-slate-400">Avg Speed of Answer</p>
                            </div>
                          </div>
                        </div>

                        {/* 2. Fintech Integration */}
                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:border-white/20 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/20">
                                <Wallet className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                {!isNaN(Math.round(fintechRate)) ? Math.round(fintechRate) : 0}% Confirmed
                              </span>
                            </div>
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Fintech Orders</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-3xl font-black text-slate-100 font-mono">{opFintech.length}</span>
                              <span className="text-xs text-slate-400">Tabby/Tamara transactions</span>
                            </div>
                          </div>
                          <div className="border-t border-white/5 mt-4 pt-3 flex justify-between text-xs text-slate-300">
                            <div>
                              <p className="text-slate-100 font-black font-mono">{confirmedFintech.length}</p>
                              <p className="text-[10px] text-slate-400">Approved</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-100 font-black font-mono">
                                {opFintech.filter(f => f.platform === 'tabby').length}T | {opFintech.filter(f => f.platform === 'tamara').length}M
                              </p>
                              <p className="text-[10px] text-slate-400">Platform Shares</p>
                            </div>
                          </div>
                        </div>

                        {/* 3. Complaints & Comm Requests */}
                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:border-white/20 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-rose-500/15 text-rose-400 rounded-2xl border border-rose-500/20">
                                <MessageSquare className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                {opComplaints.length > 0 ? `${Math.round((closedComplaints.length / opComplaints.length) * 100)}%` : '100%'} Closed
                              </span>
                            </div>
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Corporate Complaints</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-3xl font-black text-slate-100 font-mono">{opComplaints.length}</span>
                              <span className="text-xs text-slate-400">Logged complaints</span>
                            </div>
                          </div>
                          <div className="border-t border-white/5 mt-4 pt-3 flex justify-between text-xs text-slate-300">
                            <div>
                              <p className="text-slate-100 font-black font-mono">{closedComplaints.length}</p>
                              <p className="text-[10px] text-slate-400">Resolved</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-100 font-black font-mono">
                                {opComplaints.filter(c => c.status === 'pending_tl').length}
                              </p>
                              <p className="text-[10px] text-slate-400">Awaiting TL Review</p>
                            </div>
                          </div>
                        </div>

                        {/* 4. Client Communication requests */}
                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:border-white/20 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-indigo-500/15 text-indigo-400 rounded-2xl border border-indigo-500/20">
                                <MessageCircle className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                {opComms.length > 0 ? `${Math.round((contactedComms.length / opComms.length) * 100)}%` : '100%'} Contacted
                              </span>
                            </div>
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Client Communications</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-3xl font-black text-slate-100 font-mono">{opComms.length}</span>
                              <span className="text-xs text-slate-400">Total requests logged</span>
                            </div>
                          </div>
                          <div className="border-t border-white/5 mt-4 pt-3 flex justify-between text-xs text-slate-300">
                            <div>
                              <p className="text-slate-100 font-black font-mono">{contactedComms.length}</p>
                              <p className="text-[10px] text-slate-400">Assigned & Dialed</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-100 font-black font-mono">
                                {opComms.filter(c => c.status === 'pending').length}
                              </p>
                              <p className="text-[10px] text-slate-400">Unassigned Backlog</p>
                            </div>
                          </div>
                        </div>

                        {/* 5. QA Performance */}
                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:border-green-500/30 transition-all flex flex-col justify-between cursor-pointer" onClick={() => setActiveTab('qa-scorecard')}>
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-green-500/15 text-green-400 rounded-2xl border border-green-500/20">
                                <ShieldCheck className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-green-300 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                QA Metrics
                              </span>
                            </div>
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">QA Score</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              {(() => {
                                const qas = qaScores.filter(q => isInOpDay(q.createdAt));
                                const avg = qas.length ? Math.round((qas.reduce((a, b) => a + (b.totalScore / b.maxTotalScore), 0) / qas.length) * 100) : null;
                                return (
                                  <>
                                    <span className={`text-3xl font-black font-mono ${avg && avg < 70 ? 'text-red-400' : 'text-slate-100'}`}>
                                      {avg !== null ? `${avg}%` : 'N/A'}
                                    </span>
                                    <span className="text-xs text-slate-400">Average Performance</span>
                                    {/* We inject the values specifically here so they're in scope */}
                                    <span className="hidden qa-count">{qas.length}</span>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                          <div className="border-t border-white/5 mt-4 pt-3 flex justify-between text-xs text-slate-300">
                            <div>
                                {(() => {
                                  const qasLength = qaScores.filter(q => isInOpDay(q.createdAt)).length;
                                  return (
                                    <>
                                      <p className="text-slate-100 font-black font-mono">{qasLength}</p>
                                      <p className="text-[10px] text-slate-400">Total Evaluations Today</p>
                                    </>
                                  )
                                })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hourly Load Distribution SVG Interactive Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-black text-slate-100 font-display">
                            Hourly Load & Density Distribution
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Continuous 24-hr layout of incoming transactional load and active staffing rosters
                          </p>
                        </div>

                        {/* Interactive Selector for metric inside SVG chart */}
                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-xl">
                          {(['all', 'inquiries', 'fintech', 'presence'] as const).map((m) => (
                            <button
                              key={m}
                              onClick={() => setDashboardChartMetric(m)}
                              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                                dashboardChartMetric === m
                                  ? 'bg-indigo-500 text-white'
                                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                              }`}
                            >
                              {m === 'all' ? 'All Load' : m === 'inquiries' ? 'Inquiries' : m === 'fintech' ? 'FinTech' : 'On-Duty Attendance'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cool SVG Area Chart */}
                      <div className="relative h-64 w-full">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="50%" stopColor="#818cf8" />
                              <stop offset="100%" stopColor="#f43f5e" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                            <line
                              key={idx}
                              x1="0%"
                              y1={`${p * 85 + 5}%`}
                              x2="100%"
                              y2={`${p * 85 + 5}%`}
                              stroke="rgba(255,255,255,0.04)"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                          ))}

                          {/* Render the SVG Area / Curve */}
                          {(() => {
                            const dataPoints = hourlyCounts.map((hc, idx) => {
                              const x = (idx / 23) * 100; // Match 0 to 23 hours nicely
                              let val = hc.totalLoad;
                              let maxVal = peakLoad.totalLoad;
                              if (dashboardChartMetric === 'inquiries') {
                                val = hc.inquiries;
                                maxVal = Math.max(...hourlyCounts.map(h => h.inquiries), 1);
                              } else if (dashboardChartMetric === 'fintech') {
                                val = hc.fintech;
                                maxVal = Math.max(...hourlyCounts.map(h => h.fintech), 1);
                              } else if (dashboardChartMetric === 'presence') {
                                val = hc.presence;
                                maxVal = peakPresence.presence || 1;
                              }
                              // Calculate height % from bottom
                              const y = 90 - (val / (maxVal || 1)) * 80;
                              return { x, y, val };
                            });

                            // Build SVG Path
                            const pointString = dataPoints.map(p => `${p.x}%,${p.y}%`).join(' L ');
                            const fillString = `0%,90% L ${pointString} L 100%,90% Z`;

                            return (
                              <>
                                {/* Gradient Area Fill */}
                                <path
                                  d={`M ${fillString}`}
                                  fill="url(#chart-area-grad)"
                                  className="transition-all duration-700"
                                />

                                {/* Glowing Line */}
                                <path
                                  d={`M ${pointString}`}
                                  fill="none"
                                  stroke="url(#chart-line-grad)"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  className="transition-all duration-700"
                                />

                                {/* Individual Interactive Nodes */}
                                {dataPoints.map((pt, idx) => (
                                  <g key={idx} className="group cursor-pointer">
                                    <circle
                                      cx={`${pt.x}%`}
                                      cy={`${pt.y}%`}
                                      r="4"
                                      className="fill-indigo-400 stroke-slate-900 stroke-2 hover:r-6 transition-all duration-150"
                                    />
                                    <foreignObject
                                      x={`${Math.max(pt.x - 7, 0)}%`}
                                      y={`${pt.y - 12}%`}
                                      width="70"
                                      height="24"
                                      className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <div className="bg-indigo-950/90 border border-indigo-400 text-slate-100 text-[9px] font-bold px-1.5 py-0.5 rounded text-center">
                                        Value: {pt.val}
                                      </div>
                                    </foreignObject>
                                  </g>
                                ))}
                              </>
                            );
                          })()}
                        </svg>

                        {/* Chart X Axis Labels */}
                        <div className="absolute bottom-1.5 inset-x-0 flex justify-between px-1 text-[9px] font-black text-slate-400 font-mono tracking-tight">
                          {hourlyCounts.map((hc, idx) => (
                            <span 
                              key={idx} 
                              className={`origin-center ${
                                idx % 3 === 0 ? 'opacity-100' : 'opacity-40'
                              }`}
                            >
                              {hc.hour === 12 || hc.hour === 0 ? hc.hourLabel : `${hc.hour === 7 ? '7 AM' : hc.hour === 19 ? '7 PM' : hc.hour}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Left Column: LOB speed table, Right Column: Agent shift timeline / roster */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* LOB Performance Card */}
                      <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
                        <div>
                          <h3 className="text-base font-black text-slate-100 font-display flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            Channels & LOB Statistics
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Performance segmented by work divisions and lines of business for this operational day
                          </p>

                          {/* Small channel progress list */}
                          <div className="space-y-4 mt-6">
                            {(() => {
                              // Breakdown counts
                              const socialInq = opInquiries.filter(i => {
                                const lob = AGENT_LOBS[i.agentName] || '';
                                return lob.toLowerCase().includes('social');
                              }).length;

                              const callInq = opInquiries.filter(i => {
                                const lob = AGENT_LOBS[i.agentName] || '';
                                return lob.toLowerCase().includes('call') || lob.toLowerCase().includes('phone');
                              }).length;

                              const totalSegments = socialInq + callInq || 1;
                              const socialPercent = Math.round((socialInq / totalSegments) * 100);
                              const callPercent = Math.round((callInq / totalSegments) * 100);

                              return (
                                <>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-bold text-slate-300">Social Media Load</span>
                                      <span className="text-slate-100 font-black font-mono">{socialInq} ({socialPercent}%)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${socialPercent}%` }} />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-bold text-slate-300">Call Center Load</span>
                                      <span className="text-slate-100 font-black font-mono">{callInq} ({callPercent}%)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${callPercent}%` }} />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-bold text-slate-300">Direct Case Records</span>
                                      <span className="text-slate-100 font-black font-mono">{opCases.length}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-pink-400 transition-all duration-1000" style={{ width: `${opCases.length > 0 ? 100 : 0}%` }} />
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Daily Schedule & Absenteeism Analysis */}
                        <div className="mt-6 p-5 bg-white/5 border border-white/10 rounded-2xl">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            Daily Roster & Absenteeism
                          </p>

                          {(() => {
                            // Find active scheduled shifts that aren't "OFF", "DAY OFF", or empty
                            const scheduledForDay = schedules.filter(s => 
                              s.date === selectedDashboardDate && 
                              s.shiftLabel && 
                              !['OFF', 'DAY OFF', 'LEAVE', 'VACATION'].includes(s.shiftLabel.toUpperCase()) &&
                              isAllowedToView(s.agentName)
                            );

                            const scheduledAgentNames = new Set(scheduledForDay.map(s => s.agentName?.toLowerCase()));

                            // Present scheduled agents: who are scheduled and have checked in or recorded active hours
                            const presentScheduledAgents = opTimeLogs.filter(log => 
                              scheduledAgentNames.has(log.agentName?.toLowerCase()) && 
                              (log.clockIn || ['working', 'break', 'lunch', 'restroom', 'clocked_out'].includes(log.status))
                            );

                            // Absent scheduled agents: who are scheduled but have no log or a 'no_show' status
                            const absentScheduledAgents = scheduledForDay.filter(s => {
                              const log = opTimeLogs.find(l => l.agentName?.toLowerCase() === s.agentName?.toLowerCase());
                              if (!log) return true;
                              return log.status === 'no_show' || (!log.clockIn && !['day_off', 'casual', 'annual'].includes(log.status));
                            });

                            const approvedLeaves = opTimeLogs.filter(log => 
                              ['day_off', 'casual', 'annual'].includes(log.status)
                            );

                            const totalScheduled = scheduledForDay.length;
                            const presenterCount = presentScheduledAgents.length;
                            const absenteeCount = absentScheduledAgents.length;
                            const leaveCount = approvedLeaves.length;

                            const complianceRate = totalScheduled > 0 
                              ? Math.round((presenterCount / totalScheduled) * 100) 
                              : 100;

                            return (
                              <div className="space-y-4">
                                {/* Overall Compliance Progress Bar */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-300">Roster Compliance</span>
                                    <span className={`font-mono font-black ${
                                      complianceRate >= 90 ? 'text-emerald-400' : complianceRate >= 75 ? 'text-amber-400' : 'text-pink-400'
                                    }`}>
                                      {complianceRate}%
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                      className={`h-full transition-all duration-1000 rounded-full ${
                                        complianceRate >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : complianceRate >= 75 ? 'bg-amber-400' : 'bg-pink-500'
                                      }`}
                                      style={{ width: `${complianceRate}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Metric Badges Grid */}
                                <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                                  <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Scheduled</span>
                                    <p className="text-xl font-mono text-slate-100 font-black mt-0.5">{totalScheduled}</p>
                                  </div>
                                  <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Present</span>
                                    <p className="text-xl font-mono text-emerald-400 font-black mt-0.5">{presenterCount}</p>
                                  </div>
                                  <div className="p-3 bg-rose-500/10 border border-rose-500/15 rounded-xl">
                                    <span className="text-[10px] uppercase font-black text-rose-300 tracking-wider">Absentees</span>
                                    <p className="text-xl font-mono text-rose-400 font-black mt-0.5">{absenteeCount}</p>
                                  </div>
                                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/15 rounded-xl">
                                    <span className="text-[10px] uppercase font-black text-indigo-300 tracking-wider">Approved Leave</span>
                                    <p className="text-xl font-mono text-indigo-400 font-black mt-0.5">{leaveCount}</p>
                                  </div>
                                </div>

                                {/* Breakdown on Absentee Agent names */}
                                {absenteeCount > 0 && (
                                  <div className="mt-2.5 p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl">
                                    <p className="text-[10px] font-black uppercase text-rose-300 tracking-widest mb-1.5 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                                      Flagged Absentees:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {absentYearlyNames(absentScheduledAgents)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );

                            function absentYearlyNames(absents: typeof absentScheduledAgents) {
                              return absents.map(node => (
                                <span 
                                  key={node.id} 
                                  className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded font-mono text-[9px] font-bold"
                                >
                                  {node.agentName}
                                </span>
                              ));
                            }
                          })()}
                        </div>
                      </div>

                      {/* Agent roster attendance statistics table with elegant slider timelines */}
                      <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                        <h3 className="text-base font-black text-slate-100 font-display flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-cyan-400 animate-pulse" />
                          On-Duty Roster Timeline ({opTimeLogs.length} active logs)
                        </h3>
                        <p className="text-xs text-slate-400 mb-6 font-semibold">
                          Live attendance, productivity timeline and status logs intersecting the 7 AM - 6:59 AM cycle
                        </p>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="pb-3 text-slate-100">Agent</th>
                                <th className="pb-3">LOB</th>
                                <th className="pb-3">Shift Log Interval</th>
                                <th className="pb-3 text-center">Duration</th>
                                <th className="pb-3 text-right">Roster Timeline (7 AM - 7 AM)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                              {opTimeLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                                    No logged attendance records found for this operational date slot.
                                  </td>
                                </tr>
                              ) : (
                                opTimeLogs.map((log) => {
                                  const cIn = log.clockIn ? new Date(log.clockIn) : null;
                                  const cOut = log.clockOut ? new Date(log.clockOut) : (log.clockIn ? new Date() : null);

                                  let displayInterval = 'No Clock In';
                                  let minutesWorked = 0;

                                  if (cIn) {
                                    const formatSimpleTime = (d: Date) => {
                                      let hr = d.getHours();
                                      const min = String(d.getMinutes()).padStart(2, '0');
                                      const ampm = hr >= 12 ? 'PM' : 'AM';
                                      hr = hr % 12;
                                      hr = hr ? hr : 12;
                                      return `${hr}:${min} ${ampm}`;
                                    };

                                    displayInterval = `${formatSimpleTime(cIn)} - ${log.clockOut ? formatSimpleTime(cOut!) : 'Live Now'}`;

                                    const overlapS = Math.max(range.startTimeMs, cIn.getTime());
                                    const overlapE = Math.min(range.endTimeMs, cOut!.getTime());
                                    if (overlapE > overlapS) {
                                      minutesWorked = (overlapE - overlapS) / 60000;
                                    }
                                  }

                                  const agentLOB = AGENT_LOBS[log.agentName] || 'Operations';

                                  let timelineStart = 0;
                                  let timelineWidth = 0;

                                  if (cIn) {
                                    const startOffset = Math.max(range.startTimeMs, cIn.getTime()) - range.startTimeMs;
                                    const duration = Math.min(range.endTimeMs, cOut!.getTime()) - Math.max(range.startTimeMs, cIn.getTime());
                                    const fullDayMs = range.endTimeMs - range.startTimeMs;
                                    timelineStart = (startOffset / fullDayMs) * 100;
                                    timelineWidth = (duration / fullDayMs) * 100;
                                  }

                                  return (
                                    <tr key={log.id} className="hover:bg-slate-700 transition-colors">
                                      <td className="py-3 font-bold text-slate-100 whitespace-nowrap">{log.agentName}</td>
                                      <td className="py-3 whitespace-nowrap">
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight bg-white/5 text-slate-300">
                                          {agentLOB}
                                        </span>
                                      </td>
                                      <td className="py-3 font-mono text-[11px] whitespace-nowrap">{displayInterval}</td>
                                      <td className="py-3 text-center font-mono font-bold text-slate-100 whitespace-nowrap">
                                        {minutesWorked > 0 ? `${Math.round(minutesWorked / 10) / 6} hrs` : '0'}
                                      </td>
                                      <td className="py-3 text-right">
                                        <div className="w-24 sm:w-32 h-2.5 bg-white/5 rounded-full overflow-hidden inline-block relative border border-white/5">
                                          {timelineWidth > 0 && (
                                            <div
                                              className="h-full bg-gradient-to-r from-emerald-400 via-indigo-500 to-cyan-500 rounded-full transition-all duration-1000"
                                              style={{
                                                marginLeft: `${timelineStart}%`,
                                                width: `${timelineWidth}%`
                                              }}
                                            />
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                    </>
                  );
                })()}
              </div>
            )}

              {/* Approvals & Leave Console (Only TL) */}
              {isTLOreSupport && activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Dynamic Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-100 font-display">Approvals & Leave Console</h2>
                      <p className="text-slate-400 text-sm">Reviewing pending requests and compliance logs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadFullCSV}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Full CSV backup
                      </button>
                    </div>
                  </div>

                  {/* High Fidelity Performance Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-md">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Pending Swaps</p>
                      <p className="text-4xl font-black text-slate-100">{pendingSwapsCount}</p>
                      <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${Math.min((pendingSwapsCount / (requests.length || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-md">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Annual Leaves</p>
                      <p className="text-4xl font-black text-slate-100">{pendingAnnualsCount}</p>
                      <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${Math.min((pendingAnnualsCount / (requests.length || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-md">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Approved Monthly</p>
                      <p className="text-4xl font-black text-slate-100">{totalApprovedThisMonth}</p>
                      <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${Math.min((totalApprovedThisMonth / (requests.length || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/6 border border-white/10 rounded-2xl backdrop-blur-sm shadow-md">
                      <p className="text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-1">Violations Blocked</p>
                      <p className="text-4xl font-black text-rose-300">{totalViolationsCount}</p>
                      <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${Math.min((totalViolationsCount / (requests.length || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Operations Live Wallboard & SLA Gauge */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl shadow-sm text-slate-100 p-6 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-4">
                      <div>
                        <h3 className="font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-lg font-display flex items-center gap-2">
                          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                          Ops Live Command Center
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Real-time Service Level Agreements, Queue Metrics, and AUX Occupancy</p>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-400 font-mono tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Synchronized Feed
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* SLA Gauge - SVG Circle representation */}
                      <div className="p-5 bg-slate-800/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="text-left">
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Inquiry Queue SLA</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Target: &gt;95% within 2 min Response Goal</p>
                        </div>

                        {/* Dial */}
                        <div className="relative flex items-center justify-center h-32">
                          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                            {/* Track Circle */}
                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                            {/* Progress Circle representing 96.4% */}
                            <circle cx="50" cy="50" r="40" stroke="url(#cyan-gradient)" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.964)} strokeLinecap="round" className="transition-all duration-1000" />
                            <defs>
                              <linearGradient id="cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#6366f1" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-2xl font-black text-slate-100 font-mono">96.4%</span>
                            <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">Met Goal</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs bg-black/20 p-2.5 rounded-xl border border-white/5 font-sans">
                          <span className="text-slate-400">Total processed today:</span>
                          <span className="font-bold text-slate-100 font-mono">{queueStats.processedToday} inquiries</span>
                        </div>
                      </div>

                      {/* Live Queue Monitor (Simulator Interface) */}
                      <div className="p-5 bg-slate-800/[0.02] border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="text-left">
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Simulated In-Flow Queue</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Trigger mock client events to check operational response</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-center">
                            <p className="text-[9px] text-slate-400 font-bold uppercase font-sans">Active Calls</p>
                            <p className="text-lg font-black text-rose-450 font-mono mt-0.5 animate-pulse">{queueStats.activeCalls}</p>
                          </div>
                          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-center">
                            <p className="text-[9px] text-slate-400 font-bold uppercase font-sans">Hold Time</p>
                            <p className="text-lg font-black text-amber-300 font-mono mt-0.5">{queueStats.holdTime}s</p>
                          </div>
                          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-center">
                            <p className="text-[9px] text-slate-400 font-bold uppercase font-sans">Tasks open</p>
                            <p className="text-lg font-black text-[#22d3ee] font-mono mt-0.5">{queueStats.waitingTasks}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newCalls = Math.max(1, queueStats.activeCalls + (Math.random() > 0.4 ? 1 : -1));
                              const newHold = Math.max(4, queueStats.holdTime + Math.floor(Math.random() * 6 - 3));
                              const newTasks = Math.max(0, queueStats.waitingTasks + (Math.random() > 0.5 ? 1 : -1));
                              const newProcessed = queueStats.processedToday + 1;
                              const updatedStats = { activeCalls: newCalls, waitingTasks: newTasks, holdTime: newHold, processedToday: newProcessed };
                              setQueueStats(updatedStats);
                              setStorageItem('sched_queue_stats', updatedStats);

                              const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                              const events = [
                                `Patient assessment dispatch record active`,
                                `Inbound call routed to Social Media Queue`,
                                `Fintech installment agreement callback processed`,
                                `Case inquiry record established`
                              ];
                              const randomEvent = events[Math.floor(Math.random() * events.length)];
                              const updatedLogs = [`[${timestamp}] ${randomEvent}`, ...liveOpsLogs.slice(0, 4)];
                              setLiveOpsLogs(updatedLogs);
                              setStorageItem('sched_live_ops_logs', updatedLogs);
                              toast.success("Successfully tick-triggered new live center activity event!");
                            }}
                            className="flex-1 px-3 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/35 text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                            Trigger Live Flow Tick
                          </button>
                        </div>
                      </div>

                      {/* Live Action/Audit Ticker Console Logs */}
                      <div className="p-5 bg-slate-800/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between space-y-3">
                        <div className="text-left">
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Live Activity Log</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Operations system ledger output</p>
                        </div>

                        <div className="bg-black/45 p-3 rounded-xl border border-white/5 text-left font-mono text-[10px] space-y-1.5 h-24 overflow-y-auto leading-snug">
                          {liveOpsLogs.map((logStr, index) => {
                            const isLive = logStr.includes('[Operational]');
                            return (
                              <p key={index} className={isLive ? 'text-indigo-300' : 'text-slate-300'}>
                                {logStr}
                              </p>
                            );
                          })}
                        </div>

                        {/* AUX Live Distribution Indicators */}
                        {(() => {
                          const activeAgentLogs = agentsList.map(aName => {
                            const activeLog = timeLogs.find(log => log.agentName?.toLowerCase() === aName?.toLowerCase() && !log.clockOut);
                            return activeLog ? activeLog.status : 'offline';
                          });
                          const activeOnDuty = activeAgentLogs.filter(s => s === 'working').length;
                          const activeAUXBreak = activeAgentLogs.filter(s => s === 'break').length;
                          const activeAUXMeeting = activeAgentLogs.filter(s => s === 'meeting').length;
                          const activeAUX1on1 = activeAgentLogs.filter(s => s === 'one_on_one').length;
                          const activeAUXRestroom = activeAgentLogs.filter(s => s === 'restroom').length;
                          const activeTotal = activeAgentLogs.filter(s => s !== 'offline').length || 1;

                          return (
                            <div className="flex flex-col gap-1.5 text-[10px] font-sans">
                              <p className="text-slate-400 font-bold uppercase tracking-wider text-left text-[9px] mb-0.5">Aux Occupancy ({activeTotal} Active on Shift)</p>
                              <div className="flex gap-1 h-3 rounded-full bg-white/5 overflow-hidden border border-white/5">
                                <div style={{ width: `${(activeOnDuty / activeTotal) * 100}%` }} className="bg-emerald-400" title={`On-Duty Working: ${activeOnDuty}`} />
                                <div style={{ width: `${(activeAUXBreak / activeTotal) * 100}%` }} className="bg-amber-400" title={`Break: ${activeAUXBreak}`} />
                                <div style={{ width: `${(activeAUXMeeting / activeTotal) * 100}%` }} className="bg-cyan-500" title={`Team Meeting: ${activeAUXMeeting}`} />
                                <div style={{ width: `${(activeAUX1on1 / activeTotal) * 100}%` }} className="bg-violet-500" title={`1:1 Session: ${activeAUX1on1}`} />
                                <div style={{ width: `${(activeAUXRestroom / activeTotal) * 100}%` }} className="bg-pink-400" title={`Restroom AUX: ${activeAUXRestroom}`} />
                              </div>
                              <div className="flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-[9px] text-slate-400 mt-1">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> On-Duty: {activeOnDuty}</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Break: {activeAUXBreak}</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Meet: {activeAUXMeeting}</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> 1:1: {activeAUX1on1}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Immediate Approval Queue Panel */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl flex flex-col shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/5 gap-3">
                      <div>
                        <h3 className="font-bold text-slate-100 text-lg font-display">Recent Approval Queue</h3>
                        <p className="text-xs text-slate-400">Review, flag or action latest roster change requests</p>
                      </div>
                      <div className="flex gap-4 items-center">
                        {selectedPendingRequests.size > 0 && (
                          <div className="flex items-center gap-2 mr-4 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                            <span className="text-xs font-bold text-indigo-300 mr-2">{selectedPendingRequests.size} Selected</span>
                            <button onClick={() => {
                              handleBulkTLApproval(Array.from(selectedPendingRequests), true);
                              setSelectedPendingRequests(new Set());
                            }} className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[10px] uppercase rounded transition-colors shadow">
                              Approve All
                            </button>
                            <button onClick={() => {
                              handleBulkTLApproval(Array.from(selectedPendingRequests), false);
                              setSelectedPendingRequests(new Set());
                            }} className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold text-[10px] uppercase rounded transition-colors shadow">
                              Decline All
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Swap (24h Requirement)
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Annual (14d Requirement)
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left min-w-[700px]">
                        <thead className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/5 bg-[#1e1e1e]/40 backdrop-blur-lg/40">
                          <tr>
                            <th className="px-6 py-4 font-bold max-w-[20px]">
                              <input 
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 cursor-pointer"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPendingRequests(new Set(pendingRequests.map(r => r.id)));
                                  } else {
                                    setSelectedPendingRequests(new Set());
                                  }
                                }}
                                checked={pendingRequests.length > 0 && selectedPendingRequests.size === pendingRequests.length}
                              />
                            </th>
                            <th className="px-6 py-4 font-bold">Agent Name</th>
                            <th className="px-6 py-4 font-bold">Request Type</th>
                            <th className="px-6 py-4 font-bold">Details (Shift/Dates)</th>
                            <th className="px-6 py-4 font-bold">Notes / Swap Partner</th>
                            <th className="px-6 py-4 font-bold">Compliance Status</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {pendingRequests.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                  <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-60" />
                                  <p className="font-medium">All queues clear! No pending requests awaits decision.</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            pendingRequests.map(req => {
                              const isSwap = req.type === 'swap';
                              
                              // Check live rule compliance just in case it was retroactively submitted
                              let hasViolation = false;
                              let vMessage = '';
                              if (req.type === 'swap') {
                                const check = validateSwapRequest(req.date, req.shift, new Date(req.createdAt));
                                if (!check.isValid) {
                                  hasViolation = true;
                                  vMessage = check.message || '';
                                }
                              } else {
                                const check = validateAnnualRequest(req.startDate, new Date(req.createdAt));
                                if (!check.isValid) {
                                  hasViolation = true;
                                  vMessage = check.message || '';
                                }
                              }

                              return (
                                <tr key={req.id} className="border-b border-white/5 hover:bg-slate-700 transition-colors">
                                  <td className="px-6 py-4">
                                    <input 
                                      type="checkbox"
                                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 cursor-pointer"
                                      checked={selectedPendingRequests.has(req.id)}
                                      onChange={(e) => {
                                        const next = new Set(selectedPendingRequests);
                                        if (e.target.checked) next.add(req.id);
                                        else next.delete(req.id);
                                        setSelectedPendingRequests(next);
                                      }}
                                    />
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-100">
                                    {req.agentName}
                                  </td>
                                  <td className="px-6 py-4">
                                    {isSwap ? (
                                      <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                        Shift Swap
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                        Annual Leave
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 font-medium text-slate-200">
                                    {isSwap ? (
                                      <div className="space-y-0.5">
                                        <p className="font-semibold text-slate-100">{formatDateNice((req as SwapRequest).date)}</p>
                                        <p className="text-xs text-slate-400 font-mono">Shift: {(req as SwapRequest).shift}</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-0.5">
                                        <p className="font-semibold text-slate-100">
                                          {formatDateNice((req as AnnualRequest).startDate)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                          to {formatDateNice((req as AnnualRequest).endDate)}
                                        </p>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs text-slate-300 max-w-[200px]">
                                    {isSwap ? (
                                      <div className="space-y-1">
                                        <p className="text-indigo-200">
                                          Swap Partner: <span className="font-semibold text-slate-100">{(req as SwapRequest).swapWithAgent}</span>
                                        </p>
                                        <p className="text-[11px] text-slate-400 italic">"{(req as SwapRequest).notes || 'No comments'}"</p>
                                      </div>
                                    ) : (
                                      <p className="italic">"{(req as AnnualRequest).notes || 'No comments'}"</p>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {hasViolation ? (
                                      <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
                                        <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                                        <span>Rule Violation</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span>Compliant</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2.5 flex-wrap">
                                      <button
                                        onClick={() => {
                                          let details = '';
                                          if (req.type === 'swap') {
                                            const s = req as SwapRequest;
                                            details = `Request Type: Shift Swap
Agent Name: ${s.agentName}
Swap Date: ${s.date}
Shift: ${s.shift}
Swap Partner Name: ${s.swapWithAgent}
Notes: ${s.notes || 'None'}`;
                                          } else {
                                            const a = req as AnnualRequest;
                                            details = `Request Type: Annual Leave
Agent Name: ${a.agentName}
Start Date: ${a.startDate}
End Date: ${a.endDate}
Notes: ${a.notes || 'None'}`;
                                          }
                                          navigator.clipboard.writeText(details);
                                          toast.success('Approval request details copied!');
                                        }}
                                        className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-slate-100 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-white/5 hover:border-white/15"
                                        title="Copy Request details"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleTLApproval(req.id, true)}
                                        className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleTLApproval(req.id, false)}
                                        className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/20 hover:bg-rose-500/25 text-rose-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                      >
                                        Decline
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TL File Logs / Database view (Only TL) */}
              {currentUser.role === 'tl' && activeTab === 'all-requests' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-100 font-display">Full Shift Requests Log</h2>
                      <p className="text-slate-400 text-sm">Comprehensive list of swaps, annual leaves and decision history</p>
                    </div>
                  </div>

                  {/* Filter Rail and Search Bar inside Frosted card */}
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl w-full md:w-auto self-stretch">
                      <button
                        onClick={() => setLogFilter('all')}
                        className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          logFilter === 'all' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-100'
                        }`}
                      >
                        All Categories
                      </button>
                      <button
                        onClick={() => setLogFilter('swap')}
                        className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          logFilter === 'swap' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-100'
                        }`}
                      >
                        Shift Swaps
                      </button>
                      <button
                        onClick={() => setLogFilter('annual')}
                        className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          logFilter === 'annual' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-100'
                        }`}
                      >
                        Annual Leaves
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="🔍 Search by agent name..."
                      className="flex-1 w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Logs Table */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[800px]">
                        <thead className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/5 bg-[#1e1e1e]/40 backdrop-blur-lg/40">
                          <tr>
                            <th className="px-6 py-4 font-bold">Agent</th>
                            <th className="px-6 py-4 font-bold">Request Type</th>
                            <th className="px-6 py-4 font-bold">Details</th>
                            <th className="px-6 py-4 font-bold">Submission Time</th>
                            <th className="px-6 py-4 font-bold">Status Badge</th>
                            <th className="px-6 py-4 font-bold">TL Approver / Feedback</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {filteredLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                No records matching filters.
                              </td>
                            </tr>
                          ) : (
                            filteredLogs.map(req => {
                              const isSwap = req.type === 'swap';
                              return (
                                <tr key={req.id} className="border-b border-white/5 hover:bg-slate-700 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-100">{req.agentName}</td>
                                  <td className="px-6 py-4">
                                    {isSwap ? (
                                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md text-[10px] font-bold uppercase">
                                        Shift Swap
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase">
                                        Annual
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {isSwap ? (
                                      <div className="text-xs">
                                        <p className="font-semibold text-slate-100">{(req as SwapRequest).date}</p>
                                        <p className="text-slate-400">Hours: {(req as SwapRequest).shift}</p>
                                        <p className="text-indigo-400">With: {(req as SwapRequest).swapWithAgent}</p>
                                      </div>
                                    ) : (
                                      <div className="text-xs">
                                        <p className="font-semibold text-slate-100">
                                          {(req as AnnualRequest).startDate} to {(req as AnnualRequest).endDate}
                                        </p>
                                      </div>
                                    )}
                                    <AttachmentsDisplay photos={req.photos} links={req.links} />
<AttachmentsDisplay photos={req.photos} links={req.links} />
{req.screenshot && (
                                      <div className="mt-2">
                                        <a href={req.screenshot} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-bold border border-indigo-500/20 transition-colors">
                                          <ImageIcon className="w-3 h-3" />
                                          View Image
                                        </a>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                    {new Date(req.createdAt).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4">
                                    {req.status === 'approved' && (
                                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-md text-xs font-semibold flex items-center gap-1 w-max">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                      </span>
                                    )}
                                    {req.status === 'declined' && (
                                      <span className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded-md text-xs font-semibold flex items-center gap-1 w-max">
                                        <XCircle className="w-3.5 h-3.5" /> Declined
                                      </span>
                                    )}
                                    {req.status === 'pending' && (
                                      <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-md text-xs font-semibold flex items-center gap-1 w-max animate-pulse">
                                        <Clock className="w-3.5 h-3.5" /> Pending Approval
                                      </span>
                                    )}
                                    {req.status === 'pending_partner' && (
                                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-xs font-semibold flex items-center gap-1 w-max animate-pulse">
                                        <Clock className="w-3.5 h-3.5" /> Awaiting Partner
                                      </span>
                                    )}
                                    {req.status === 'declined_by_partner' && (
                                      <span className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded-md text-xs font-semibold flex items-center gap-1 w-max">
                                        <XCircle className="w-3.5 h-3.5" /> Declined by Partner
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs text-slate-300">
                                    {req.actionBy ? (
                                      <div className="space-y-1">
                                        <p className="text-slate-100">Resolved by <span className="font-semibold text-indigo-300">{req.actionBy}</span></p>
                                        {req.ruleViolation && (
                                          <p className="text-[10px] text-rose-400 bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                                            ⚠️ Violation flag: {req.violationMessage}
                                          </p>
                                        )}
                                      </div>
                                    ) : req.status === 'pending_partner' ? (
                                      <span className="text-indigo-400">Awaiting partner agreement</span>
                                    ) : req.status === 'declined_by_partner' ? (
                                      <span className="text-rose-400">Partner refused swap agreement</span>
                                    ) : (
                                      <span className="text-slate-500">Awaiting leader review</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TL Report Section (Only TL) */}
              {currentUser.role === 'tl' && activeTab === 'report' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-100 font-display">System Analytics & Report Center</h2>
                    <p className="text-slate-400 text-sm">Download precise audit logs, timesheets, and run dynamic visual status breakdowns.</p>
                  </div>

                  {/* SVG Dashboards & Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Visual Chart 1: Real-time Agent Attendance Status (SVG Donut Chart) */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
                      <div className="mb-4">
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-mono font-bold uppercase">LIVE ATTENDANCE STATUS</span>
                        <h3 className="text-base font-bold text-slate-100 font-display mt-1.5 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          On-Shift State Ratio
                        </h3>
                        <p className="text-xs text-slate-400">Current status composition of clocked agents under your supervision.</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                        {/* Custom status donut */}
                        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                          {(() => {
                            const working = timeLogs.filter(t => t.status === 'working').length;
                            const rest = timeLogs.filter(t => t.status === 'break' || t.status === 'restroom').length;
                            const lunch = timeLogs.filter(t => t.status === 'lunch').length;
                            const offline = timeLogs.filter(t => t.status === 'clocked_out').length;
                            const total = working + rest + lunch + offline || 1;

                            const pctWorking = (working / total) * 188.5;
                            const pctRest = (rest / total) * 188.5;
                            const pctLunch = (lunch / total) * 188.5;
                            const pctOffline = (offline / total) * 188.5;

                            return (
                              <>
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                                  <circle cx="40" cy="40" r="30" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6.5" />
                                  {/* Working - Indigo */}
                                  <circle
                                    cx="40" cy="40" r="30" fill="transparent" stroke="#6366f1" strokeWidth="7.5"
                                    strokeDasharray="188.5" strokeDashoffset={188.5 - pctWorking}
                                    className="transition-all duration-1000"
                                  />
                                  {/* Rest/Break - Amber */}
                                  <circle
                                    cx="40" cy="40" r="30" fill="transparent" stroke="#f59e0b" strokeWidth="7.5"
                                    strokeDasharray="188.5" strokeDashoffset={188.5 - pctRest}
                                    style={{ transform: `rotate(${(working/total)*360}deg)`, transformOrigin: 'center' }}
                                    className="transition-all duration-1000"
                                  />
                                  {/* Lunch - Pink */}
                                  <circle
                                    cx="40" cy="40" r="30" fill="transparent" stroke="#ec4899" strokeWidth="7.5"
                                    strokeDasharray="188.5" strokeDashoffset={188.5 - pctLunch}
                                    style={{ transform: `rotate(${((working+rest)/total)*360}deg)`, transformOrigin: 'center' }}
                                    className="transition-all duration-1000"
                                  />
                                  {/* Offline - Slate */}
                                  <circle
                                    cx="40" cy="40" r="30" fill="transparent" stroke="#64748b" strokeWidth="7.5"
                                    strokeDasharray="188.5" strokeDashoffset={188.5 - pctOffline}
                                    style={{ transform: `rotate(${((working+rest+lunch)/total)*360}deg)`, transformOrigin: 'center' }}
                                    className="transition-all duration-1000"
                                  />
                                </svg>
                                <div className="absolute text-center select-none">
                                  <p className="text-2xl font-black text-slate-100">{total === 1 && working+rest+lunch+offline === 0 ? 0 : (working + rest + lunch + offline)}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Active Logs</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Status Legend List */}
                        <div className="space-y-2.5 text-xs font-semibold w-full sm:w-auto">
                          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5 min-w-[150px]">
                            <span className="flex items-center gap-2 text-indigo-400">
                              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                              Active Operating
                            </span>
                            <span className="text-slate-100 font-bold">{timeLogs.filter(t => t.status === 'working').length} agents</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5">
                            <span className="flex items-center gap-2 text-amber-400">
                              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                              On Breaks / Rest
                            </span>
                            <span className="text-slate-100 font-bold">{timeLogs.filter(t => t.status === 'break' || t.status === 'restroom').length} agents</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5">
                            <span className="flex items-center gap-2 text-pink-400">
                              <span className="w-2.5 h-2.5 bg-pink-500 rounded-full"></span>
                              On Lunch Duration
                            </span>
                            <span className="text-slate-100 font-bold">{timeLogs.filter(t => t.status === 'lunch').length} agents</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pb-0.5">
                            <span className="flex items-center gap-2 text-slate-400">
                              <span className="w-2.5 h-2.5 bg-slate-500 rounded-full"></span>
                              Clocked Out
                            </span>
                            <span className="text-slate-100 font-bold">{timeLogs.filter(t => t.status === 'clocked_out').length} agents</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visual Chart 2: Scheduling Requests & Swaps breakdown (SVG Pie Chart) */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
                      <div className="mb-4">
                        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-lg font-mono font-bold uppercase">DECISIONS & LOGS SUMMARY</span>
                        <h3 className="text-base font-bold text-slate-100 font-display mt-1.5 flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-indigo-400" />
                          Roster Modification Ratio
                        </h3>
                        <p className="text-xs text-slate-400">Shift swap swaps and annual leave approval summaries.</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                        {/* Custom Requests pie */}
                        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                          {(() => {
                            const swapsCount = requests.filter(r => r.type === 'swap').length;
                            const annualsCount = requests.filter(r => r.type === 'annual').length;
                            const totalRequests = swapsCount + annualsCount || 1;

                            const pctSwaps = (swapsCount / totalRequests) * 188.5;
                            const pctAnnuals = (annualsCount / totalRequests) * 188.5;

                            return (
                              <>
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                                  <circle cx="40" cy="40" r="30" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6.5" />
                                  {/* Swaps - Blue */}
                                  <circle
                                    cx="40" cy="40" r="30" fill="transparent" stroke="#3b82f6" strokeWidth="7.5"
                                    strokeDasharray="188.5" strokeDashoffset={188.5 - pctSwaps}
                                    className="transition-all duration-1000"
                                  />
                                  {/* Annuals - Violet */}
                                  <circle
                                    cx="40" cy="40" r="30" fill="transparent" stroke="#8b5cf6" strokeWidth="7.5"
                                    strokeDasharray="188.5" strokeDashoffset={188.5 - pctAnnuals}
                                    style={{ transform: `rotate(${(swapsCount/totalRequests)*360}deg)`, transformOrigin: 'center' }}
                                    className="transition-all duration-1000"
                                  />
                                </svg>
                                <div className="absolute text-center select-none">
                                  <p className="text-2xl font-black text-slate-100">{requests.length}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Requests</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Request Legend List */}
                        <div className="space-y-2.5 text-xs font-semibold w-full sm:w-auto">
                          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5 min-w-[150px]">
                            <span className="flex items-center gap-2 text-blue-400">
                              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                              Shift Swaps
                            </span>
                            <span className="text-slate-100 font-bold">{requests.filter(r => r.type === 'swap').length} cases</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5">
                            <span className="flex items-center gap-2 text-violet-400">
                              <span className="w-2.5 h-2.5 bg-violet-500 rounded-full"></span>
                              Annual Leave
                            </span>
                            <span className="text-slate-100 font-bold">{requests.filter(r => r.type === 'annual').length} cases</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5">
                            <span className="flex items-center gap-2 text-emerald-400">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                              Approved Total
                            </span>
                            <span className="text-emerald-400 font-bold">{requests.filter(r => r.status === 'approved').length}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pb-0.5">
                            <span className="flex items-center gap-2 text-rose-400">
                              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                              Declined / Denied
                            </span>
                            <span className="text-rose-400 font-bold">{requests.filter(r => r.status === 'declined' || r.status === 'declined_by_partner').length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Four-Column Quad Report Actions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Card 1: Custom Audit timeframe summary text download */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm">Text Summary Audit</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Download high-level counts and detailed audit lists of all modifications formatted in clean plain text.</p>
                      </div>

                      <div className="space-y-3 pt-4">
                        <div className="grid grid-cols-4 gap-1.5 bg-black/35 p-0.5 border border-white/5 rounded-lg select-none">
                          {(['day', 'week', 'month', 'year'] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => setReportPeriod(p)}
                              className={`py-1 text-[10px] font-bold rounded-md capitalize transition-all cursor-pointer ${
                                reportPeriod === p ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-100'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => downloadReportTxt(reportPeriod)}
                          className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Get {reportPeriod.toUpperCase()} Text
                        </button>
                      </div>
                    </div>

                    {/* Card 2: Master Roster Shift Swaps & Annual Leaves Export */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                          <GitPullRequest className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm font-sans">Shift swaps & Leave CSV</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Download complete records databases of all shift trades, partner-agreements, and yearly leave decisions to CSV.</p>
                      </div>

                      <div className="pt-4 mt-auto space-y-2">
                        <button
                          onClick={downloadFullXLSX}
                          className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/35 text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Excel Export
                        </button>
                        <button
                          onClick={() => {
                            const data = requests.map(r => ({ ...r }));
                            const csv = generateCSV(data);
                            uploadToDrive(`Requests_Export_${getLocalISOString()}.csv`, csv);
                          }}
                          disabled={isUploadingToDrive}
                          className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/35 text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                          Save to Drive
                        </button>
                      </div>
                    </div>

                    {/* Card 3: Agent Clock Timesheet Logs Export */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm">Attendance Timesheet CSV</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Extract raw clocking punches, total break times, lunch duration metrics, and overtime violations per agent.</p>
                      </div>

                      <div className="pt-4 mt-auto space-y-2">
                        <button
                          onClick={downloadTimeLogsXLSX}
                          className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/35 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Excel Export
                        </button>
                        <button
                          onClick={() => {
                            const csv = generateTimeLogsCSV(timeLogs);
                            uploadToDrive(`Attendance_Report_${getLocalISOString()}.csv`, csv);
                          }}
                          disabled={isUploadingToDrive}
                          className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/35 text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                          Save to Drive
                        </button>
                      </div>
                    </div>

                    {/* Card 4: Agent Inquiries & Feed Cases Export */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-purple-500/15 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm font-sans">Inquiries & Answers CSV</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Extract every submitted agent question, corresponding clinic name labels, forwarded timestamps, and answers.</p>
                      </div>

                      <div className="pt-4 mt-auto">
                        <button
                          onClick={handleDownloadInquiriesReport}
                          className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/35 text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Extract Inquiries CSV
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Section Title for Operational Module Analytics Exports */}
                  <div className="pt-4">
                    <h3 className="text-lg font-black text-slate-100 font-display flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-indigo-400" />
                      More Sections Diagnostics & Analytical Exports
                    </h3>
                    <p className="text-slate-400 text-xs text-sans mt-0.5">Run instant reports on operational modules and download clean records for audit matching.</p>
                  </div>

                  {/* New rows of module exports */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

                    {/* Card 5: Tabby & Tamara Fintech Requests */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm font-sans">Fintech Payments CSV</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Extract Tabby, Tamara, and payment link applications, including amounts, customer contacts, and confirmation logs.</p>
                      </div>

                      <div className="pt-4 mt-auto">
                        <button
                          onClick={handleDownloadFintechRequestsReport}
                          className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/35 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Extract Fintech CSV
                        </button>
                      </div>
                    </div>

                    {/* Card 6: General Service & Clinical Complaints */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm font-sans">Corporate Complaints CSV</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Extract general service complaints, clinical issue descriptions, management resolution comments, and resolution status logs.</p>
                      </div>

                      <div className="pt-4 mt-auto">
                        <button
                          onClick={handleDownloadFintechComplaintsReport}
                          className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/35 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Extract Complaints CSV
                        </button>
                      </div>
                    </div>

                    {/* Card 7: Client Communications */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm font-sans">Client Hotline Comms CSV</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Extract dialect preferences, clinic assignment paths, call notes, feedback, and dispatch resolution timelines.</p>
                      </div>

                      <div className="pt-4 mt-auto">
                        <button
                          onClick={handleDownloadClientCommsReport}
                          className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/35 text-cyan-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Extract Comms CSV
                        </button>
                      </div>
                    </div>

                    {/* Card 8: Direct Case Leads */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-teal-500/15 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm font-sans">Patient Case Leads CSV</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Extract direct patient enquiry clinic streams, active medical helpline histories, and lead source attributes.</p>
                      </div>

                      <div className="pt-4 mt-auto">
                        <button
                          onClick={handleDownloadCasesReport}
                          className="w-full py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/35 text-teal-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Extract Case Leads CSV
                        </button>
                      </div>
                    </div>

                    {/* Card 9: Active Work Schedules */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-pink-500/15 border border-pink-500/20 text-pink-400 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm font-sans">Master Work Schedules CSV</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Extract the complete master roster schedule database specifying agent names, shifts, and date assignments.</p>
                      </div>

                      <div className="pt-4 mt-auto">
                        <button
                          onClick={handleDownloadSchedulesReport}
                          className="w-full py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/35 text-pink-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Extract Schedules CSV
                        </button>
                      </div>
                    </div>

                    

                    {/* Card 11: RTM Live Attendance Summary Digest */}
                    <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/15 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm font-sans">RTM Live Attendance Digest</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Download a structured summary plain-text digest of active logged agents on lunch, restroom breaks & over-timers.</p>
                      </div>

                      <div className="pt-4 mt-auto">
                        <button
                          onClick={downloadRtmLiveMetricsDigest}
                          className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/35 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download RTM Digest
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}


              {/* Agent Form: Submit Requests (Only Agent) */}
              {currentUser.role === 'agent' && activeTab === 'apply' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-100 font-display">New Request Form</h2>
                    <p className="text-slate-400 text-sm">Please select the requested change type below</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Shift Swap Module */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col space-y-5 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100 font-display text-base">Request Shift Swap</h4>
                          <p className="text-xs text-slate-400">Must be requested 24 hours in advance.</p>
                        </div>
                      </div>

                      <form onSubmit={handleCreateSwap} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block" htmlFor="swap-date">Shift Date</label>
                          <input
                            id="swap-date"
                            type="date"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                            value={swapDate}
                            onChange={(e) => setSwapDate(e.target.value)}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block" htmlFor="swap-shift">Your Shift</label>
                            <select
                              id="swap-shift"
                              className="text-slate-100 w-full px-4 py-2.5 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl   focus:outline-none focus:border-indigo-500"
                              value={swapShift}
                              onChange={(e) => setSwapShift(e.target.value)}
                            >
                              {SHIFTS.map(s => (
                                <option key={s.id} value={s.label} className="bg-slate-800 text-slate-100 ">
                                  {s.display} ({s.label})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block" htmlFor="swap-target-shift">Target Shift</label>
                            <select
                              id="swap-target-shift"
                              className="text-slate-100 w-full px-4 py-2.5 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl   focus:outline-none focus:border-indigo-500"
                              value={swapTargetShift}
                              onChange={(e) => setSwapTargetShift(e.target.value)}
                            >
                              {SHIFTS.map(s => (
                                <option key={s.id} value={s.label} className="bg-slate-800 text-slate-100 ">
                                  {s.display} ({s.label})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block" htmlFor="swap-partner">Swap with Agent</label>
                          <select
                            id="swap-partner"
                            className="text-slate-100 w-full px-4 py-2.5 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl   focus:outline-none focus:border-indigo-500 font-medium"
                            value={swapTargetAgent}
                            onChange={(e) => setSwapTargetAgent(e.target.value)}
                            required
                          >
                            <option value="" className="bg-slate-800 text-slate-100 ">-- Select Partner Agent --</option>
                            {agentsList
                              .filter(name => name !== currentUser?.name)
                              .map(name => (
                                <option key={name} value={name} className="bg-slate-800 text-slate-100 ">
                                  {name} ({getAgentLOB(name)})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block" htmlFor="swap-notes">Notes / Reason</label>
                          <textarea
                            id="swap-notes"
                            rows={2}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                            placeholder="State reason (e.g., family errand, doctor appointment)..."
                            value={swapNotes}
                            onChange={(e) => setSwapNotes(e.target.value)}
                          ></textarea>
                        </div>

                        <div className="pt-2">
                          <MultiAttachmentUpload photos={swapPhotos} links={swapLinks} onPhotosChange={setSwapPhotos} onLinksChange={setSwapLinks} photosLabel="Optional Attachment" />
                        </div>

                        {/* Interactive Warning Message Display */}
                        {swapWarning && (
                          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                            <div>
                              <p className="font-bold">⚠️ Notice Rule Violation Detected</p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-rose-200">{swapWarning}</p>
                            </div>
                          </div>
                        )}

                        <button
                          id="submit-swap-btn"
                          type="submit"
                          disabled={swapWarning !== null}
                          className={`w-full py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            swapWarning !== null
                              ? 'bg-slate-900/40/20 backdrop-blur-md text-slate-500 cursor-not-allowed border border-white/5'
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 cursor-pointer'
                          }`}
                        >
                          <ArrowRight className="w-4 h-4" /> Apply for Swap (Awaiting TL)
                        </button>
                      </form>
                    </div>


                    {/* Annual Leave Module */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col space-y-5 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100 font-display text-base">Request Annual Leave</h4>
                          <p className="text-xs text-slate-400">Must be requested 14 days in advance.</p>
                        </div>
                      </div>

                      <form onSubmit={handleCreateAnnual} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block" htmlFor="annual-start">Start Date</label>
                            <input
                              id="annual-start"
                              type="date"
                              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                              value={annualStart}
                              onChange={(e) => setAnnualStart(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block" htmlFor="annual-end">End Date (Inclusive)</label>
                            <input
                              id="annual-end"
                              type="date"
                              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                              value={annualEnd}
                              onChange={(e) => setAnnualEnd(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block" htmlFor="annual-notes">Comments / Leave justification</label>
                          <textarea
                            id="annual-notes"
                            rows={4}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                            placeholder="State comments..."
                            value={annualNotes}
                            onChange={(e) => setAnnualNotes(e.target.value)}
                          ></textarea>
                        </div>

                        <div className="pt-2">
                          <MultiAttachmentUpload photos={annualPhotos} links={annualLinks} onPhotosChange={setAnnualPhotos} onLinksChange={setAnnualLinks} photosLabel="Optional Attachment" />
                        </div>

                        {/* Interactive Warning Message Display */}
                        {annualWarning && (
                          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                            <div>
                              <p className="font-bold">⚠️ Notice Rule Violation Detected</p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-rose-200">{annualWarning}</p>
                            </div>
                          </div>
                        )}

                        <button
                          id="submit-annual-btn"
                          type="submit"
                          disabled={annualWarning !== null}
                          className={`w-full py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            annualWarning !== null
                              ? 'bg-slate-900/40/20 backdrop-blur-md text-slate-500 cursor-not-allowed border border-white/5'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 cursor-pointer'
                          }`}
                        >
                          <ArrowRight className="w-4 h-4" /> Apply for Annual Leave (Awaiting TL)
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              )}


              {/* Agent Portal: Request History Logs (Only Agent) */}
              {currentUser.role === 'agent' && activeTab === 'my-requests' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-100 font-display">My Submission Logs</h2>
                    <p className="text-slate-400 text-sm">Review status, comments and feedback on your submissions</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <h4 className="font-bold text-slate-100 text-base">Your Requests Logs</h4>
                      <p className="text-xs text-slate-400 font-mono">Real-time status tracking</p>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {requests.filter(r => r.agentName === currentUser?.name).length === 0 ? (
                        <div className="text-center py-12 text-slate-400 space-y-2">
                          <ClipboardList className="w-10 h-10 mx-auto text-indigo-400 opacity-50" />
                          <p>You haven't submitted any scheduling requests yet.</p>
                        </div>
                      ) : (
                        requests
                          .filter(r => r.agentName === currentUser?.name)
                          .map(req => {
                            const isSwap = req.type === 'swap';
                            return (
                              <div key={req.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 hover:border-white/10 transition-all">
                                <div className="space-y-2 flex-grow min-w-[300px]">
                                  <div className="flex items-center gap-2">
                                    {isSwap ? (
                                      <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-[10px] font-bold uppercase tracking-wider">
                                        Shift Swap Request
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold uppercase tracking-wider">
                                        Annual Leave Request
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Submitted: {new Date(req.createdAt).toLocaleString()}
                                    </span>
                                  </div>

                                  <div className="space-y-0.5">
                                    {isSwap ? (
                                      <p className="text-sm font-bold text-slate-100">
                                        Swap shift for <span className="text-indigo-300">{formatDateNice((req as SwapRequest).date)}</span>
                                      </p>
                                    ) : (
                                      <p className="text-sm font-bold text-slate-100">
                                        Leave duration: <span className="text-emerald-300">{formatDateNice((req as AnnualRequest).startDate)}</span> to <span className="text-emerald-300">{formatDateNice((req as AnnualRequest).endDate)}</span>
                                      </p>
                                    )}

                                    {isSwap && (
                                      <p className="text-xs text-slate-300">
                                        Your Shift: <span className="font-semibold">{(req as SwapRequest).shift}</span> / Swap with Partner: <span className="font-semibold text-slate-100">{(req as SwapRequest).swapWithAgent}</span> &bull; Shift: <span className="font-semibold">{(req as SwapRequest).swapWithShift}</span>
                                      </p>
                                    )}

                                    {req.notes && (
                                      <p className="text-slate-400 text-xs italic mt-1 font-sans">
                                        " {req.notes} "
                                      </p>
                                    )}

                                    <AttachmentsDisplay photos={req.photos} links={req.links} />
<AttachmentsDisplay photos={req.photos} links={req.links} />
{req.screenshot && (
                                      <div className="mt-2 text-left">
                                        <a href={req.screenshot} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold tracking-wider transition-colors border border-indigo-500/20">
                                          <ImageIcon className="w-3.5 h-3.5" />
                                          View Attachment
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 self-stretch md:self-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                  {req.status === 'pending_partner' ? (
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-md text-xs font-bold flex items-center gap-1 animate-pulse">
                                        <Clock className="w-3.5 h-3.5" /> Awaiting partner decision
                                      </span>
                                      <button
                                        onClick={() => handleCancelRequest(req.id)}
                                        className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline px-2 py-1 bg-rose-500/10 rounded-lg cursor-pointer"
                                      >
                                        Cancel Request
                                      </button>
                                    </div>
                                  ) : req.status === 'pending' ? (
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-md text-xs font-bold flex items-center gap-1 animate-pulse">
                                        <Clock className="w-3.5 h-3.5" /> Pending TL approval
                                      </span>
                                      <button
                                        onClick={() => handleCancelRequest(req.id)}
                                        className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline px-2 py-1 bg-rose-500/10 rounded-lg cursor-pointer"
                                      >
                                        Cancel Request
                                      </button>
                                    </div>
                                  ) : req.status === 'approved' ? (
                                    <div className="text-right">
                                      <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-md text-xs font-bold flex items-center justify-end gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                      </span>
                                      <p className="text-[10px] text-slate-400 mt-1">
                                        Actioned by Leader {req.actionBy}
                                      </p>
                                    </div>
                                  ) : req.status === 'declined_by_partner' ? (
                                    <div className="text-right">
                                      <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md text-xs font-bold flex items-center justify-end gap-1">
                                        <XCircle className="w-3.5 h-3.5" /> Declined by Partner
                                      </span>
                                      <p className="text-[10px] text-slate-400 mt-1">
                                        Partner refused swap agreement
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-right">
                                      <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md text-xs font-bold flex items-center justify-end gap-1">
                                        <XCircle className="w-3.5 h-3.5" /> Declined by TL
                                      </span>
                                      {req.ruleViolation && (
                                        <p className="text-[9px] text-rose-400 mt-1 max-w-[150px] leading-tight">
                                          ⚠️ Reason: {req.violationMessage}
                                        </p>
                                      )}
                                      <p className="text-[10px] text-slate-400 mt-0.5">
                                        Actioned by Leader {req.actionBy}
                                      </p>
                                    </div>
                                  )}

                                  {isWithinFiveMinutes(req.createdAt) && (
                                    <button
                                      onClick={() => setEditingItem({ type: 'scheduling_request', id: req.id, data: { ...req } })}
                                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline px-2 py-1 bg-emerald-500/10 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 mt-1"
                                      title={`Edit request (${getRemainingEditTimeStr(req.createdAt)})`}
                                    >
                                      <Pencil className="w-3.5 h-3.5" /> Edit ({getRemainingEditTimeStr(req.createdAt)})
                                    </button>
                                  )}
                                </div>
                                <div className="w-full mt-2 pt-2 border-t border-white/5 md:w-full md:block basis-full">
                                  <RequestReplyThread request={req} currentUser={currentUser} collectionName="requests" />
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Inquiries Desk */}
              {activeTab === 'client-search' && (
                <div className="w-full">
                  <PatientSearchHub 
                    inquiries={inquiries}
                    ttRequests={tabbyTamaraRequests}
                    ttComplaints={tabbyTamaraComplaints}
                    clientComms={clientComms}
                    cases={cases}
                  />
                </div>
              )}

              {/* Orders Mini-App */}
              {activeTab === 'orders' && currentUser && (
                <OrdersTab
                  currentUser={currentUser}
                  orders={orders}
                  users={registeredUsers}
                  addSystemNotification={addSystemNotification}
                />
              )}

              {activeTab === 'knowledge' && currentUser && (
                <div id="knowledge-base-tab" className="space-y-6 animate-fade-in text-left">
                  {/* Page header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text font-display flex items-center gap-3">
                        <Book className="w-8 h-8 text-cyan-400" />
                        Operational Knowledge Base
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Upload and search SOPs, manuals, policy documents, and training references. All files are automatically indexed for the Synq AI assistant.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
                      <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15">
                        <Upload className="w-4 h-4" />
                        Upload Document
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleKbFileUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Complete structural redesign of the Search Interface & AI Grounding Panel */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Grounded search & AI expert Q&A
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search knowledge documents or type a question..."
                          value={searchQueryKb}
                          onChange={(e) => setSearchQueryKb(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleKbAiQuery();
                          }}
                          className="w-full bg-black/45 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans"
                        />
                        {searchQueryKb && (
                          <button
                            onClick={() => {
                              setSearchQueryKb('');
                              setKbAiAnswer('');
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={handleKbAiQuery}
                        disabled={isAnsweringKb || !searchQueryKb.trim()}
                        className={`px-5 py-3 h-[50px] bg-gradient-to-r from-cyan-400 to-indigo-600 hover:from-cyan-500 hover:to-indigo-700 text-slate-950 font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 ${
                          (isAnsweringKb || !searchQueryKb.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isAnsweringKb ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                            Answering...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-slate-950" />
                            Ask AI Synq Expert
                          </>
                        )}
                      </button>
                    </div>

                    {/* AI answer response shown in a clean highlighted box below the search bar */}
                    {(isAnsweringKb || kbAiAnswer) && (
                      <div className="p-5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-left shadow-inner space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400 font-sans" />
                            <span className="text-xs font-black text-cyan-300 uppercase tracking-widest font-mono">AI Synq Expert Answer</span>
                          </div>
                          {kbAiAnswer && (
                            <button
                              onClick={() => setKbAiAnswer('')}
                              className="text-[10px] text-slate-400 hover:text-slate-100 font-bold bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-2 py-1 transition-all cursor-pointer"
                            >
                              Dismiss Answer
                            </button>
                          )}
                        </div>

                        {isAnsweringKb ? (
                          <div className="py-4 flex flex-col items-center justify-center gap-2 min-h-[100px]">
                            <div className="relative w-8 h-8">
                              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/10" />
                              <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
                            </div>
                            <p className="text-xs text-slate-400 animate-pulse font-mono">Analyzing references and formulating grounded response...</p>
                          </div>
                        ) : (
                          <div className="text-slate-200 text-xs leading-relaxed max-h-[300px] overflow-y-auto pr-1">
                            {renderMarkdownText(kbAiAnswer)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Document List (Cols 4) */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                          Document Vault ({filteredKbDocs.length})
                        </h3>

                        {filteredKbDocs.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 italic text-sm">
                            {searchQueryKb ? 'No matching documents found.' : 'No documents uploaded yet.'}
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 select-none scrollbar-hide">
                            {filteredKbDocs.map((doc) => {
                              const isSelected = doc.id === (selectedKbDocId || (filteredKbDocs[0] && filteredKbDocs[0].id));
                              // Automatically set selected document if null
                              if (!selectedKbDocId && filteredKbDocs[0]) {
                                setSelectedKbDocId(filteredKbDocs[0].id);
                              }
                              return (
                                <div
                                  key={doc.id}
                                  onClick={() => setSelectedKbDocId(doc.id)}
                                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3 group relative ${
                                    isSelected
                                      ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                                      : 'bg-slate-900/40/[0.02] border-white/5 hover:border-white/10 text-slate-300'
                                  }`}
                                >
                                  {/* Rich Doc Type Icon */}
                                  <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}>
                                    {(() => {
                                      const t = String(doc.type || '').toUpperCase();
                                      if (['CSV', 'XLS', 'XLSX'].includes(t)) return <FileSpreadsheet className="w-4 h-4" />;
                                      if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG'].includes(t)) return <FileImage className="w-4 h-4" />;
                                      if (['MP3', 'WAV', 'OGG', 'M4A', 'AAC'].includes(t)) return <FileAudio className="w-4 h-4" />;
                                      if (['MP4', 'WEBM', 'MOV', 'AVI', 'MKV'].includes(t)) return <FileVideo className="w-4 h-4" />;
                                      if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(t)) return <FileArchive className="w-4 h-4" />;
                                      if (['PDF'].includes(t)) return <BookOpen className="w-4 h-4" />;
                                      if (['JSON', 'JS', 'TS', 'HTML', 'CSS', 'XML', 'SH', 'PY', 'YAML', 'YML'].includes(t)) return <FileCode className="w-4 h-4" />;
                                      return <FileText className="w-4 h-4" />;
                                    })()}
                                  </div>

                                  <div className="flex-1 min-w-0 pr-6">
                                    <h4 className="text-xs font-bold truncate group-hover:text-white transition-colors">
                                      {doc.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                      <span className="uppercase font-mono font-bold text-cyan-400/80">{doc.type}</span>
                                      <span>•</span>
                                      <span>{Math.round(doc.size / 1024) || 1}B</span>
                                      <span>•</span>
                                      <span>{new Date(doc.uploadedAt).toLocaleString()}</span>
                                    </div>
                                  </div>

                                  {/* Delete Doc Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteKbDoc(doc.id);
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-rose-400 bg-slate-900/40/[0.02] hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 animate-fade-in"
                                    title="Delete Document"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Viewer (Cols 8) */}
                    <div className="lg:col-span-8">
                      <div className="bg-gradient-to-br from-slate-900/60 to-slate-950 border border-white/10 rounded-3xl p-6 backdrop-blur-xl min-h-[450px] flex flex-col">
                        {currentKbDoc ? (
                          <div className="flex-1 flex flex-col space-y-4">
                            <div className="flex items-start justify-between border-b border-white/10 pb-4">
                              <div>
                                <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                                  {currentKbDoc.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-sans">
                                  <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold uppercase">
                                    {currentKbDoc.type} File
                                  </span>
                                  <span>•</span>
                                  <span>{Math.round(currentKbDoc.size / 1024) || 1}B</span>
                                  <span>•</span>
                                  <span>Uploaded at {new Date(currentKbDoc.uploadedAt).toLocaleString()}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteKbDoc(currentKbDoc.id)}
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                Delete
                              </button>
                            </div>

                            {/* Scrollable text or binary display panel */}
                            <div className="flex-1 max-h-[500px] overflow-y-auto bg-black/30 rounded-2xl p-5 border border-white/5 scrollbar-hide text-left leading-relaxed">
                              {currentKbDoc.isBinary ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 font-sans">
                                  {/* If it's an image, show beautiful preview */}
                                  {['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG'].includes(String(currentKbDoc.type).toUpperCase()) ? (
                                    <div className="max-w-full max-h-80 overflow-hidden border border-white/10 rounded-xl bg-slate-950/60 p-2 relative group flex items-center justify-center">
                                      <img 
                                        src={currentKbDoc.content} 
                                        alt={currentKbDoc.name} 
                                        referrerPolicy="no-referrer"
                                        className="max-h-72 object-contain rounded-lg shadow-lg"
                                      />
                                    </div>
                                  ) : ['PDF'].includes(String(currentKbDoc.type).toUpperCase()) ? (
                                    <div className="w-full flex flex-col items-center p-6 bg-indigo-500/5 border border-white/5 rounded-2xl">
                                      <BookOpen className="w-16 h-16 text-indigo-400 animate-pulse mb-3" />
                                      <p className="text-sm font-bold text-slate-200">PDF Document Reference</p>
                                      <p className="text-xs text-slate-400 mt-1 max-w-sm">This is an indexed PDF document. You can download and view it locally.</p>
                                    </div>
                                  ) : (
                                    <div className="w-full flex flex-col items-center p-6 bg-slate-900/40 border border-white/5 rounded-2xl">
                                      {(() => {
                                        const t = String(currentKbDoc.type || '').toUpperCase();
                                        if (['MP3', 'WAV', 'OGG', 'M4A', 'AAC'].includes(t)) return <FileAudio className="w-16 h-16 text-emerald-400 mb-3" />;
                                        if (['MP4', 'WEBM', 'MOV', 'AVI', 'MKV'].includes(t)) return <FileVideo className="w-16 h-16 text-rose-400 mb-3" />;
                                        if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(t)) return <FileArchive className="w-16 h-16 text-amber-500 mb-3" />;
                                        if (['CSV', 'XLS', 'XLSX'].includes(t)) return <FileSpreadsheet className="w-16 h-16 text-teal-400 mb-3" />;
                                        return <File className="w-16 h-16 text-cyan-400 mb-3" />;
                                      })()}
                                      <p className="text-sm font-bold text-slate-200">Binary Document Reference</p>
                                      <p className="text-xs text-slate-400 mt-1 max-w-sm">This file is stored securely as a binary source reference ({!isNaN(Math.round(currentKbDoc.size / 1024)) ? Math.round(currentKbDoc.size / 1024) : 0} KB).</p>
                                    </div>
                                  )}

                                  {/* Action Download / Open Buttons */}
                                  <div className="flex flex-wrap gap-3 justify-center pt-2">
                                    <a 
                                      href={currentKbDoc.content} 
                                      download={currentKbDoc.name}
                                      className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/10 cursor-pointer"
                                    >
                                      <Download className="w-4 h-4" />
                                      Download {currentKbDoc.name}
                                    </a>
                                    <a 
                                      href={currentKbDoc.content} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all border border-white/10 cursor-pointer"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Open File in New Tab
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                // Traditional code / text file renderer with download button
                                <div className="space-y-4">
                                  <div className="flex justify-end pb-2 border-b border-white/5">
                                    <a 
                                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(currentKbDoc.content)}`} 
                                      download={currentKbDoc.name.toLowerCase().endsWith('.pdf') ? `${currentKbDoc.name}.txt` : currentKbDoc.name}
                                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Download Text Source
                                    </a>
                                  </div>
                                  {currentKbDoc.type === 'JSON' ? (
                                    <pre className="text-xs text-cyan-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
                                      {(() => {
                                        try {
                                          return JSON.stringify(JSON.parse(currentKbDoc.content), null, 2);
                                        } catch {
                                          return currentKbDoc.content;
                                        }
                                      })()}
                                    </pre>
                                  ) : (
                                    <p className="text-slate-300 text-xs font-sans whitespace-pre-wrap leading-relaxed select-all">
                                      {currentKbDoc.content}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 italic text-slate-400">
                            <Book className="w-12 h-12 text-slate-600 mb-3 opacity-30" />
                            <p className="text-sm font-sans">No document selected</p>
                            <p className="text-xs text-slate-500 mt-1">Choose a file from the list to display its indexed contents</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'offers' && currentUser && (
                <ArticleManager currentUser={currentUser} category="offers" />
              )}

              {/* TL Announcements */}
              {activeTab === 'tl-announcements' && currentUser && (
                <div className="w-full">
                  <AnnouncementsTab 
                    announcements={announcements} 
                    currentUser={currentUser} 
                    addSystemNotification={addSystemNotification}
                  />
                </div>
              )}

              {currentUser.role === 'agent' && activeTab === 'inquiries' && (
                <div id="agent-inquiries-tab" className="space-y-6 animate-fade-in">
                  {/* Page Title */}
                  <div>
                    <h2 className="text-3xl font-bold text-slate-100 font-display">Inquiries Helpdesk</h2>
                    <p className="text-slate-400 text-sm font-sans">Submit questions, attach screenshots/links, and track live resolutions from Team Leaders.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Submit Inquiry Form (Left Side / Col Span 1) */}
                    <div className="lg:col-span-1 bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl space-y-5">
                      <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2 border-b border-white/5 pb-3">
                        <HelpCircle className="w-5 h-5 text-indigo-400" />
                        Submit New Inquiry
                      </h3>

                      <form onSubmit={handleSubmitInquiry} className="space-y-4">
                        {/* Mandatory Clinic Name Dropdown */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300 block flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              🏥 Clinic Name <span className="text-rose-400 font-extrabold">*</span>
                            </span>
                            {inquiryClinicName && (
                              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Passed</span>
                            )}
                          </label>
                          <select
                            value={inquiryClinicName}
                            onChange={(e) => setInquiryClinicName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer focus:ring-1 focus:ring-indigo-500/30"
                            required
                          >
                            <option value="" className="bg-slate-800 text-slate-100 ">-- Select Clinic * --</option>
                            <option value="dermadent" className="bg-slate-800 text-slate-100 ">Dermadent</option>
                            <option value="onetouch_mo3tred" className="bg-slate-800 text-slate-100 ">One Touch Mo3tred</option>
                                  <option value="onetouch_merkhnya" className="bg-slate-800 text-slate-100 ">One Touch Merkhnya</option>
                            <option value="welltouch" className="bg-slate-800 text-slate-100 ">WellTouch</option>
                            <option value="newedge" className="bg-slate-800 text-slate-100 ">New Edge</option>
                          </select>
                        </div>

                        {/* Phone Number optionally */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300 block">
                            Phone Number (Optional)
                          </label>
                          <input
                            type="tel"
                            placeholder="+966 5x xxx xxxx (Optional)"
                            value={inquiryPhoneNumber}
                            onChange={(e) => setInquiryPhoneNumber(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
                          />
                        </div>

                        {/* Inquiry text details with English or Arabic typing toggles */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <label className="text-xs font-semibold text-slate-300">Inquiry Details <span className="text-rose-400 font-extrabold">*</span></label>
                            
                            {/* Direction toggle options for Arabic/English */}
                            <div className="flex items-center gap-1 bg-white/5 backdrop-blur-xl border border-white/10 p-0.5 rounded-lg text-[10px]">
                              <button
                                type="button"
                                onClick={() => setInquiryLanguageDir('auto')}
                                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${inquiryLanguageDir === 'auto' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-100'}`}
                                title="Auto Detect Language Direction"
                              >
                                Auto 🌐
                              </button>
                              <button
                                type="button"
                                onClick={() => setInquiryLanguageDir('ltr')}
                                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${inquiryLanguageDir === 'ltr' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-100'}`}
                                title="Force English Mode (LTR)"
                              >
                                English 🇺🇸
                              </button>
                              <button
                                type="button"
                                onClick={() => setInquiryLanguageDir('rtl')}
                                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${inquiryLanguageDir === 'rtl' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-100'}`}
                                title="Force Arabic Mode (RTL)"
                              >
                                العربية 🇸🇦
                              </button>
                            </div>
                          </div>
                          
                          <textarea
                            value={inquiryText}
                            onChange={(e) => setInquiryText(e.target.value)}
                            placeholder={inquiryLanguageDir === 'rtl' ? "اكتب استفسارك بالتفصيل باللغة العربية هنا..." : "Describe your inquiry or case in detail (Type in English or Arabic)..."}
                            rows={4}
                            dir={inquiryLanguageDir}
                            className={`w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans placeholder-slate-500 resize-none ${inquiryLanguageDir === 'rtl' ? 'text-right' : 'text-left'}`}
                          />
                        </div>

                        {/* Photos Upload & URLs Section */}
                        {currentUser?.role !== 'agent' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-300">Attach Photos / Screenshots</label>
                            <span className="text-[10px] text-slate-500">Max size 2MB</span>
                          </div>
                          
                          {/* Drag and Drop or File Upload block */}
                          <div className="relative border border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl p-4 bg-black/20 text-center transition-all group">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handlePhotoFileUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-all" />
                              <p className="text-xs font-medium text-slate-300">Choose Image or drag here</p>
                              <p className="text-[9px] text-slate-500">Supports JPG, PNG, WebP</p>
                            </div>
                          </div>

                          {/* Manual Image URL Paste */}
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <ImageIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Or paste external image URL..."
                                value={tempPhotoUrlInput}
                                onChange={(e) => setTempPhotoUrlInput(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAddPhotoUrl}
                              className="px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-xs font-bold rounded-lg transition-all active:scale-95"
                            >
                              Add
                            </button>
                          </div>

                          {/* Photo Previews list */}
                          {inquiryPhotos.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 pt-1">
                              {inquiryPhotos.map((photo, index) => (
                                <div key={index} className="relative group aspect-square rounded-lg border border-white/10 overflow-hidden bg-black/40">
                                  <img referrerPolicy="no-referrer" src={photo} alt="Attached" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(index)}
                                    className="absolute inset-0 bg-red-600/80 text-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[10px] font-bold"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        )}

                        {/* Links Section */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-300 block">Attach Links</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Link className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="e.g. ticket link, reference..."
                                value={tempLinkInput}
                                onChange={(e) => setTempLinkInput(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAddLink}
                              className="px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-xs font-bold rounded-lg transition-all active:scale-95"
                            >
                              Add
                            </button>
                          </div>

                          {/* Links preview list */}
                          {inquiryLinks.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {inquiryLinks.map((linkStr, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-xs">
                                  <span className="text-indigo-300 underline font-mono truncate max-w-[150px]">{linkStr}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLink(index)}
                                    className="text-red-400 hover:text-red-300 text-[10px] font-medium transition-all"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Submit Action */}
                        <button
                          type="submit"
                          disabled={isFormSubmitting}
                          className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 ${isFormSubmitting ? 'bg-indigo-800 pointer-events-none opacity-60' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/10 active:scale-[0.98]'}`}
                        >
                          {isFormSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Submitting Inquiry...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Submit Inquiry to TLs
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Inquiry Logs and Progress (Right Side / Col Span 2) */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 mb-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-100 font-display">My Submission Timeline</h3>
                            <p className="text-xs text-slate-400">View states and answers to all inquiries you have submitted.</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-400">Total:</span>
                            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/15 text-indigo-300 font-bold rounded">
                              {inquiries.filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase()).length}
                            </span>
                          </div>
                        </div>

                        {/* Inquiries List */}
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                          {inquiries.filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase()).length === 0 ? (
                            <div className="text-center py-12">
                              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-2.5 animate-pulse" />
                              <p className="text-xs text-slate-400 italic">No inquiries submitted yet. Submit a case above to get started!</p>
                            </div>
                          ) : (
                            inquiries
                              .filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase())
                              .map(inq => {
                                let statusColor = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse";
                                let statusText = "Submitted to TL";
                                if (inq.status === 'sent') {
                                  statusColor = "bg-orange-500/10 border-orange-500/20 text-orange-400";
                                  statusText = "Sent to Client / Actioned";
                                } else if (inq.status === 'answered') {
                                  statusColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                                  statusText = "Answered";
                                }

                                return (
                                  <div key={inq.id} className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl space-y-3 hover:border-white/10 transition-all relative">
                                    {/* Top Info row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg uppercase tracking-wide shrink-0 ${statusColor}`}>
                                          {statusText}
                                        </span>
                                        {inq.clinicName && (
                                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 border border-indigo-500/30 rounded-lg font-bold flex items-center gap-1">
                                            🏥 {inq.clinicName}
                                          </span>
                                        )}
                                        {inq.phoneNumber && (
                                          <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2.5 py-0.5 border border-sky-500/20 rounded-lg font-mono flex items-center gap-1">
                                            📞 {inq.phoneNumber}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-slate-400">{new Date(inq.createdAt).toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center gap-2.5">
                                        {(!inq.seenByAgent && (inq.status === 'sent' || inq.status === 'answered')) && (
                                          <button
                                            onClick={() => handleMarkInquirySeen(inq.id)}
                                            className="text-[10px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-bold px-2 py-0.5 rounded-md hover:bg-indigo-500/20 transition-all"
                                          >
                                            Mark Read
                                          </button>
                                        )}
                                        {isSuperAdmin && (
                                          <button
                                            onClick={() => handleDeleteInquiry(inq.id)}
                                            className="text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1 rounded-md transition-all shrink-0 font-sans"
                                            title="Delete Inquiry"
                                          >
                                            Delete
                                          </button>
                                        )}
                                        {isWithinFiveMinutes(inq.createdAt) && (
                                          <button
                                            onClick={() => setEditingItem({ type: 'inquiry', id: inq.id, data: { ...inq } })}
                                            className="text-[10px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-bold px-2 py-0.5 rounded-md hover:bg-emerald-500/20 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                                            title={`Edit inquiry (${getRemainingEditTimeStr(inq.createdAt)})`}
                                          >
                                            <Pencil className="w-2.5 h-2.5" /> Edit ({getRemainingEditTimeStr(inq.createdAt)})
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Content block */}
                                    <div className="space-y-3 font-sans">
                                      <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">{inq.text}</p>
                                      
                                      {/* Display Photos */}
                                      {inq.photos && inq.photos.length > 0 && (
                                        <div className="space-y-1">
                                          <span className="text-[10px] text-slate-400 font-mono block">Attached Screenshots ({inq.photos.length}):</span>
                                          <div className="flex flex-wrap gap-2">
                                            {inq.photos.map((photo, pIdx) => (
                                              <a
                                                key={pIdx}
                                                href={photo}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-indigo-500 transition-all bg-black/55 shrink-0"
                                                title="View Image"
                                              >
                                                <img referrerPolicy="no-referrer" src={photo} alt="screenshot" className="w-full h-full object-cover" />
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Display Links */}
                                      {inq.links && inq.links.length > 0 && (
                                        <div className="space-y-1">
                                          <span className="text-[10px] text-slate-400 font-mono block">References & Tickets:</span>
                                          <div className="flex flex-col gap-1">
                                            {inq.links.map((link, lIdx) => (
                                              <a
                                                key={lIdx}
                                                href={link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 hover:underline truncate"
                                              >
                                                <ExternalLink className="w-3 h-3 text-indigo-500 shrink-0" />
                                                <span className="truncate">{link}</span>
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* TL Actions details */}
                                    {inq.status === 'sent' && (
                                      <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-1">
                                        <div className="flex justify-between items-center">
                                          <p className="text-[10px] font-mono font-bold text-orange-400 flex items-center gap-1">
                                            <Send className="w-3 h-3 animate-pulse" />
                                            Forwarded to Client Partner
                                          </p>
                                          <span className="text-[9px] text-slate-500">{new Date(inq.sentAt || '').toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-300 font-sans">
                                          Leader <strong>{inq.sentBy}</strong> has sent this inquiry forward to client partners for resolution. Please wait while they formulate a response.
                                        </p>
                                      </div>
                                    )}

                                    {inq.status === 'answered' && (
                                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-1.5">
                                        <div className="flex justify-between items-center border-b border-emerald-500/10 pb-1.5">
                                          <p className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            INQUIRY ANSWERED
                                          </p>
                                          <span className="text-[9px] text-slate-500">{new Date(inq.answeredAt || '').toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-emerald-200 font-semibold italic leading-relaxed font-sans">
                                          "{inq.answer}"
                                        </div>
                                        <p className="text-[9px] text-slate-400 text-right">
                                          Answered by Leader <strong>{inq.answeredBy}</strong>
                                        </p>
                                      </div>
                                    )}

                                    {/* Customer Contacted Status Dropdown */}
                                    <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-white/5">
                                      <span className="text-[11px] text-slate-400 font-medium">Customer Contact Status:</span>
                                      <select
                                        value={inq.customerContacted || 'not_contacted'}
                                        onChange={(e) => handleUpdateContactedStatus(inq.id, e.target.value as any)}
                                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-100 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
                                      >
                                        <option value="not_contacted" className="bg-slate-800 text-slate-100 backdrop-blur-lg  font-sans">❌ Not Contacted</option>
                                        <option value="contacted" className="bg-slate-800 text-slate-100 backdrop-blur-lg  font-sans">📞 Contacted</option>
                                        <option value="attempted" className="bg-slate-800 text-slate-100 backdrop-blur-lg  font-sans">⏳ Contact Attempted</option>
                                      </select>
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Clocking & Activities View */}
              {activeTab === 'clocking' && currentUser && currentUser.role === 'agent' && (
                <div id="agent-clocking-view-root" className="space-y-6 animate-fade-in col-span-1">
                  
                  {/* Title Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-100 font-display">Time Card & Clock Desk</h2>
                      <p className="text-slate-400 text-sm font-sans">Clock in your shift, log your break, lunch, or restroom visits in real-time</p>
                    </div>
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md/80 border border-white/5 rounded-2xl flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span className="text-xs text-slate-300 font-mono font-semibold">
                        System Year Context: {systemTime.getFullYear()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left & Middle Column (Main Control Desk) */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Live Desk Console Panel */}
                      <div className="p-6 sm:p-8 bg-white/5 border border-white/10 rounded-3xl shadow-sm text-slate-100 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-6">
                        
                        {/* Pulse glow background ornament */}
                        <div className="absolute top-10 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full -z-10 animate-pulse"></div>

                        {/* Top live digital clock display */}
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold font-mono">Current Live Time</p>
                          <p className="text-5xl font-black text-slate-100 font-mono tracking-tight drop-shadow-md">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                          </p>
                          <p className="text-xs text-indigo-300 font-medium font-sans">
                            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>

                        {/* Dynamic Active Status Badge and Description */}
                        {(() => {
                          const active = getActiveTimeLog(currentUser.name);
                          const status = active ? active.status : 'clocked_out';
                          
                          let statusLabel = "Not Clocked In";
                          let ringStyle = "border-slate-800 bg-transparent/60";
                          let textStyle = "text-slate-400";
                          let dotStyle = "bg-rose-500";
                          
                          if (status === 'working') {
                            statusLabel = "On Shift (Active Working)";
                            ringStyle = "border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/5";
                            textStyle = "text-emerald-400";
                            dotStyle = "bg-emerald-500 animate-pulse";
                          } else if (status === 'break') {
                            statusLabel = "On 15-Minute Break";
                            ringStyle = "border-amber-500/30 bg-amber-500/5 shadow-lg shadow-amber-500/5";
                            textStyle = "text-amber-400";
                            dotStyle = "bg-amber-500 animate-pulse";
                          } else if (status === 'lunch') {
                            statusLabel = "On 30-Minute Lunch";
                            ringStyle = "border-pink-500/30 bg-pink-500/5 shadow-lg shadow-pink-500/5";
                            textStyle = "text-pink-400";
                            dotStyle = "bg-pink-500 animate-pulse";
                          } else if (status === 'restroom') {
                            statusLabel = "At Restroom";
                            ringStyle = "border-indigo-500/30 bg-indigo-500/5 shadow-lg shadow-indigo-500/5";
                            textStyle = "text-indigo-400";
                            dotStyle = "bg-indigo-500 animate-pulse";
                          }

                          return (
                            <div className={`px-6 py-4 border rounded-2xl max-w-sm w-full transition-all flex items-center justify-center gap-3 ${ringStyle}`}>
                              <span className={`w-3 h-3 rounded-full ${dotStyle}`}></span>
                              <span className={`text-sm font-bold tracking-wide uppercase ${textStyle}`}>
                                {statusLabel}
                              </span>
                            </div>
                          );
                        })()}

                        {/* If in active Break/Lunch/Restroom - Show progress loop and timers */}
                        {(() => {
                          const active = getActiveTimeLog(currentUser.name);
                          if (!active || active.status === 'working' || active.status === 'clocked_out') return null;

                          const labelMap: Record<string, { limit: number; name: string; barColor: string }> = {
                            break: { limit: 15, name: 'Break', barColor: 'bg-amber-500' },
                            lunch: { limit: 30, name: 'Lunch', barColor: 'bg-pink-500' },
                            restroom: { limit: 10, name: 'Restroom Break', barColor: 'bg-indigo-500' },
                            meeting: { limit: 60, name: 'Team Meeting', barColor: 'bg-cyan-500' },
                            one_on_one: { limit: 30, name: '1:1 Session', barColor: 'bg-violet-500' },
                            personal: { limit: 15, name: 'Personal Break', barColor: 'bg-emerald-500' }
                          };

                          const conf = labelMap[active.status];
                          if (!conf) return null;

                          const currentAct = active.activities.find(a => !a.endTime && a.type === active.status);
                          if (!currentAct) return null;

                          const diffMs = currentTime.getTime() - new Date(currentAct.startTime).getTime();
                          const totalSecs = Math.floor(diffMs / 1000);
                          const mins = Math.floor(totalSecs / 60);
                          const secs = totalSecs % 60;
                          
                          let progressPercentage = 0;
                          if (conf.limit > 0) {
                            progressPercentage = Math.min(100, (totalSecs / (conf.limit * 60)) * 100);
                          }

                          return (
                            <div className="w-full max-w-md p-5 bg-white/5 border border-white/10 rounded-2xl text-left space-y-3 relative overflow-hidden">
                              <div className="flex justify-between items-center font-sans">
                                <span className="text-xs font-semibold text-slate-300">Elapsed {conf.name} Time:</span>
                                <span className="text-xs font-bold font-mono text-slate-100">
                                  {mins.toString().padStart(2, '0')}m {secs.toString().padStart(2, '0')}s
                                  {conf.limit > 0 ? ` / ${conf.limit}m` : ''}
                                </span>
                              </div>

                              {conf.limit > 0 && (
                                <div className="space-y-1">
                                  <div className="w-full bg-white/10 backdrop-blur-md rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-1000 ${conf.barColor}`}
                                      style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                    <span>Started at {new Date(currentAct.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span>{!isNaN(Math.round(progressPercentage)) ? Math.round(progressPercentage) : 0}% Used</span>
                                  </div>
                                </div>
                              )}
                              
                              {conf.limit > 0 && progressPercentage >= 100 && (
                                <p className="text-[10px] text-rose-400 font-bold animate-pulse text-center font-sans">
                                  ⚠️ Overtime! You have exceeded your allocated {conf.limit}-minute {conf.name.toLowerCase()} limit.
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {/* Interactive Large Desktop Action Controller Board */}
                        <div className="w-full max-w-md pt-4">
                          {(() => {
                            const active = getActiveTimeLog(currentUser.name);
                            const status = active ? active.status : 'clocked_out';

                            if (status === 'clocked_out') {
                              return (
                                <button
                                  onClick={handleClockIn}
                                  className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-100 font-black text-base tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer font-display flex items-center justify-center gap-3 uppercase animate-pulse"
                                >
                                  <CheckCircle2 className="w-5 h-5 text-slate-100 shrink-0" />
                                  Clock In For Shift
                                </button>
                              );
                            }

                            return (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black font-mono">
                                    Active Controllers
                                  </p>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${
                                    status === 'working' 
                                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                      : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 animate-pulse'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${status === 'working' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                                    {status === 'working' ? 'Active Work Duty' : `On ${status.replace('_', ' ').toUpperCase()}`}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                  <button
                                    onClick={() => handleStartActivity('break')}
                                    className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer text-xs font-bold border ${
                                      status === 'break'
                                        ? 'bg-amber-500/25 border-amber-400 text-slate-100 shadow-lg shadow-amber-500/15 scale-[1.03]'
                                        : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-300 hover:scale-[1.03]'
                                    }`}
                                  >
                                    <Coffee className="w-4 h-4 text-amber-400" />
                                    <span>15m Break</span>
                                  </button>

                                  <button
                                    onClick={() => handleStartActivity('lunch')}
                                    className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer text-xs font-bold border ${
                                      status === 'lunch'
                                        ? 'bg-pink-500/25 border-pink-400 text-slate-100 shadow-lg shadow-pink-500/15 scale-[1.03]'
                                        : 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20 text-pink-300 hover:scale-[1.03]'
                                    }`}
                                  >
                                    <Utensils className="w-4 h-4 text-pink-400" />
                                    <span>30m Lunch</span>
                                  </button>

                                  <button
                                    onClick={() => handleStartActivity('restroom')}
                                    className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer text-xs font-bold border ${
                                      status === 'restroom'
                                        ? 'bg-indigo-500/25 border-indigo-400 text-white shadow-lg shadow-indigo-500/15 scale-[1.03]'
                                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-300 hover:scale-[1.03]'
                                    }`}
                                  >
                                    <UserIcon className="w-4 h-4 text-indigo-400" />
                                    <span>Restroom</span>
                                  </button>

                                  <button
                                    onClick={() => handleStartActivity('meeting')}
                                    className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer text-xs font-bold border ${
                                      status === 'meeting'
                                        ? 'bg-cyan-500/25 border-cyan-400 text-slate-100 shadow-lg shadow-cyan-500/15 scale-[1.03]'
                                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-300 hover:scale-[1.03]'
                                    }`}
                                  >
                                    <Users className="w-4 h-4 text-cyan-400" />
                                    <span>Team Meeting</span>
                                  </button>

                                  <button
                                    onClick={() => handleStartActivity('one_on_one')}
                                    className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer text-xs font-bold border ${
                                      status === 'one_on_one'
                                        ? 'bg-violet-500/25 border-violet-400 text-slate-100 shadow-lg shadow-violet-500/15 scale-[1.03]'
                                        : 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20 text-violet-300 hover:scale-[1.03]'
                                    }`}
                                  >
                                    <MessageSquare className="w-4 h-4 text-violet-400" />
                                    <span>1:1 Session</span>
                                  </button>

                                  <button
                                    onClick={() => handleStartActivity('personal')}
                                    className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer text-xs font-bold border ${
                                      status === 'personal'
                                        ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-lg shadow-emerald-500/15 scale-[1.03]'
                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-300 hover:scale-[1.03]'
                                    }`}
                                  >
                                    <Sparkles className="w-4 h-4 text-emerald-400" />
                                    <span>Pers. Break</span>
                                  </button>
                                </div>

                                {status !== 'working' && (
                                  <div className="pt-2 animate-fade-in">
                                    <button
                                      onClick={handleEndActivity}
                                      className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-slate-100 font-black text-xs tracking-wider rounded-xl shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 uppercase font-display"
                                    >
                                      <ArrowRight className="w-4 h-4 text-slate-100" />
                                      End AUX & Resume Active Work
                                    </button>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-white/5 flex gap-3">
                                  <button
                                    onClick={handleClockOut}
                                    className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 font-bold text-xs tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 uppercase font-sans"
                                  >
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                    Clock Out Shift
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Display basic shift coverage information */}
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-slate-400 leading-relaxed font-sans">
                        <p className="font-semibold text-slate-100 mb-1 flex items-center gap-1.5 font-display"><Info className="w-4 h-4 text-indigo-400 shrink-0" /> Time-Tracking Rules & Compliance Policy</p>
                        Your shift attendance logs, break duration accuracy, and restroom usage are logged contextually to verify real-time coverage. Overstaying lunch limits (30 min) or break periods (15 min) flags an alarm notification to Team Leaders. Please clock out correctly at the end of every daily session.
                      </div>
                    </div>

                    {/* Right Column (My Today's Stats & chronological History Log) */}
                    <div className="space-y-6">
                      
                      {/* Daily aggregates */}
                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                        <h3 className="font-bold text-slate-100 text-sm font-display border-b border-white/5 pb-2">Shift Aggregates (Today)</h3>
                        
                        {(() => {
                          const stats = getAgentTodayStats(currentUser.name);
                          
                          const clockInLabel = stats.clockIn ? new Date(stats.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Clocked In Yet';
                          const clockOutLabel = stats.clockOut ? new Date(stats.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (stats.clockIn ? 'Active Shift Running' : 'Pending Out');

                          return (
                            <div className="space-y-3 text-xs leading-normal font-sans">
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-slate-400 font-medium">Clock-In Time:</span>
                                <span className="font-bold text-slate-100 font-mono">{clockInLabel}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-slate-400 font-medium">Clock-Out Time:</span>
                                <span className="font-bold text-slate-100 font-mono">{clockOutLabel}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-slate-400 font-medium">Total Breaks:</span>
                                <span className={`font-bold font-mono ${stats.breakMins > 15 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                                  {stats.breakMins.toFixed(2)}ins used / 15m max
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-slate-400 font-medium">Total Lunch:</span>
                                <span className={`font-bold font-mono ${stats.lunchMins > 30 ? 'text-rose-400 animate-pulse' : 'text-pink-300'}`}>
                                  {stats.lunchMins.toFixed(2)}ins used / 30m max
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-slate-400 font-medium">Restroom Total:</span>
                                <span className="font-bold text-indigo-300 font-mono">
                                  {stats.restroomMins.toFixed(2)}ins used
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-slate-400 font-medium">Restroom Sessions:</span>
                                <span className="font-bold text-indigo-400 font-mono">
                                  {stats.restroomCount} visits
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-slate-400 font-medium">Team Meeting:</span>
                                <span className={`font-bold font-mono ${stats.meetingMins > 60 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                                  {stats.meetingMins.toFixed(2)}ins used / 60m max
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-slate-400 font-medium">1:1 Session:</span>
                                <span className={`font-bold font-mono ${stats.oneOnOneMins > 30 ? 'text-rose-400 animate-pulse' : 'text-violet-300'}`}>
                                  {stats.oneOnOneMins.toFixed(2)}ins used / 30m max
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5">
                                <span className="text-slate-400 font-medium">Personal Break:</span>
                                <span className={`font-bold font-mono ${stats.personalMins > 15 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
                                  {stats.personalMins.toFixed(2)}ins used / 15m max
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Personal historical activities listing */}
                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-4 max-h-[400px] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <h3 className="font-bold text-slate-100 text-sm font-display">Time Card Sessions</h3>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Personal Feed</span>
                        </div>

                        {(() => {
                          const myLogs = timeLogs.filter(l => l.agentName?.toLowerCase() === currentUser?.name?.toLowerCase());
                          if (myLogs.length === 0) {
                            return (
                              <p className="text-center py-10 text-xs text-slate-500 italic font-sans">No historical activities found.</p>
                            );
                          }
                          return (
                            <div className="space-y-4 font-sans">
                              {myLogs.map(log => (
                                <div key={log.id} className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl space-y-2 text-xs">
                                  <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1 font-mono">
                                    <span className="text-indigo-300 font-bold">{log.date}</span>
                                    <span className={`px-1.5 py-0.5 rounded ${log.status === 'clocked_out' ? 'bg-white/10 backdrop-blur-md text-slate-400' : 'bg-emerald-500/15 text-emerald-300'}`}>
                                      {log.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-slate-300 leading-normal">
                                    <p>Shift Clock In: <span className="text-slate-100 font-semibold font-mono">{log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span></p>
                                    {log.clockOut && <p>Shift Clock Out: <span className="text-slate-100 font-semibold font-mono">{new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>}
                                    
                                    {log.activities.length > 0 && (
                                      <div className="pt-1.5 space-y-1">
                                        <p className="text-[10px] text-slate-500 uppercase font-black font-mono">Logged Sub-Sessions ({log.activities.length}):</p>
                                        <div className="pl-2 border-l border-white/10 space-y-1 text-[11px] font-mono">
                                          {log.activities.map(act => (
                                            <p key={act.id} className="text-slate-400">
                                              &bull; <span className="font-medium capitalize text-slate-300 font-sans">{act.type}</span>:&nbsp;
                                              {new Date(act.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {act.endTime ? new Date(act.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                                              {act.durationMinutes !== undefined && <span className="text-indigo-300 font-mono font-bold"> ({isNaN(act.durationMinutes as any) ? '-' : act.durationMinutes}m)</span>}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Team Leader Inquiries Dashboard */}
              {currentUser.role === 'tl' && activeTab === 'inquiries' && (
                <div id="tl-inquiries-tab" className="space-y-6 animate-fade-in">
                  {/* Page Title */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-100 font-display">Inquiries Analytics & Command Center</h2>
                      <p className="text-slate-400 text-sm font-sans font-normal">Track live resolution, clinic load distributions, and download historical reports.</p>
                    </div>

                    <button
                      onClick={handleDownloadInquiriesReport}
                      className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto"
                    >
                      <Download className="w-4 h-4" />
                      Download Inquiries CSV Report
                    </button>
                  </div>

                  {/* Dynamic Analytics & Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Panel 1: Status Distribution Donut Chart */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 font-display mb-1 flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-indigo-400" />
                          Inquiries Status Ratio
                        </h3>
                        <p className="text-[11px] text-slate-400 mb-4">Proportion of pending versus fully resolved client responses.</p>
                      </div>

                      <div className="flex items-center justify-around py-2 gap-4">
                        {/* Custom SVG Donut chart */}
                        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                            {/* Background track circle */}
                            <circle cx="40" cy="40" r="30" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6.5" />
                            
                            {/* Slice 1: Answered (emerald) */}
                            <circle
                              cx="40" cy="40" r="30"
                              fill="transparent"
                              stroke="#10b981"
                              strokeWidth="7"
                              strokeDasharray="188.5"
                              strokeDashoffset={
                                188.5 - ((inquiries.filter(i => i.status === 'answered').length) / (inquiries.length || 1)) * 188.5
                              }
                              className="transition-all duration-1000"
                            />

                            {/* Slice 2: Sent to Client (orange) */}
                            <circle
                              cx="40" cy="40" r="30"
                              fill="transparent"
                              stroke="#f97316"
                              strokeWidth="7"
                              strokeDasharray="188.5"
                              strokeDashoffset={
                                188.5 - ((inquiries.filter(i => i.status === 'sent').length) / (inquiries.length || 1)) * 188.5
                              }
                              style={{
                                transform: `rotate(${(inquiries.filter(i => i.status === 'answered').length / (inquiries.length || 1)) * 360}deg)`,
                                transformOrigin: 'center'
                              }}
                              className="transition-all duration-1000"
                            />

                            {/* Slice 3: Submitted / Unresolved (yellow) */}
                            <circle
                              cx="40" cy="40" r="30"
                              fill="transparent"
                              stroke="#eab308"
                              strokeWidth="7"
                              strokeDasharray="188.5"
                              strokeDashoffset={
                                188.5 - ((inquiries.filter(i => i.status === 'submitted').length) / (inquiries.length || 1)) * 188.5
                              }
                              style={{
                                transform: `rotate(${((inquiries.filter(i => i.status === 'answered').length + inquiries.filter(i => i.status === 'sent').length) / (inquiries.length || 1)) * 360}deg)`,
                                transformOrigin: 'center'
                              }}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute text-center select-none">
                            <p className="text-xl font-black text-slate-100">{inquiries.length}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Total</p>
                          </div>
                        </div>

                        {/* Chart Legend */}
                        <div className="space-y-2 text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
                            <span className="text-slate-300">Answered ({inquiries.filter(i => i.status === 'answered').length})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></span>
                            <span className="text-slate-300">Sent ({inquiries.filter(i => i.status === 'sent').length})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-sm"></span>
                            <span className="text-slate-300">Submitted ({inquiries.filter(i => i.status === 'submitted').length})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Panel 2: Clinic Volume Breakdown */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 font-display mb-1 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-emerald-400" />
                          Clinic Load Analysis & Distribution Chart
                        </h3>
                        <p className="text-[11px] text-slate-400 mb-4">Total inquiries incoming from each of the five mandatory medical clinics.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-2">
                        {[
                          { key: 'dermadent', display: 'Dermadent', color: 'from-blue-400 to-indigo-500', textCol: 'text-blue-300' },
                          { key: 'onetouch_mo3tred', display: 'One Touch Mo3tred', color: 'from-teal-400 to-emerald-500', textCol: 'text-emerald-300' },
                          { key: 'onetouch_merkhnya', display: 'One Touch Merkhnya', color: 'from-cyan-400 to-cyan-500', textCol: 'text-cyan-300' },
                          { key: 'welltouch', display: 'WellTouch', color: 'from-pink-500 to-rose-500', textCol: 'text-rose-300' },
                          { key: 'newedge', display: 'New Edge', color: 'from-amber-400 to-orange-500', textCol: 'text-amber-300' }
                        ].map((clin) => {
                          const count = inquiries.filter(i => (i.clinicName || '').toLowerCase() === clin.key.toLowerCase()).length;
                          const pct = inquiries.length > 0 ? (count / inquiries.length) * 100 : 0;
                          return (
                            <div key={clin.key} className="bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all select-none">
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{clin.display}</p>
                                <p className="text-2xl font-black text-slate-100 mt-1">{count}</p>
                              </div>

                              <div className="mt-4">
                                <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold mb-1">
                                  <span>Ratio</span>
                                  <span className={clin.textCol}>{pct.toFixed(0)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${clin.color} transition-all duration-1000`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Search & Filters */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by agent name, LOB, text or answer values..."
                        value={inquirySearchQuery}
                        onChange={(e) => setInquirySearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans"
                      />
                    </div>
                    <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto select-none py-1 md:py-0">
                      {['all', 'submitted', 'sent', 'answered'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setInquiryStatusFilter(st === 'all' ? '' : st)}
                          className={`px-3.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 ${
                            (st === 'all' && inquiryStatusFilter === '') || inquiryStatusFilter === st
                              ? 'bg-indigo-600/20 border-indigo-500/30 text-white shadow shadow-indigo-500/5 font-extrabold'
                              : 'border-white/5 text-slate-400 bg-black/20 hover:text-slate-100'
                          }`}
                        >
                          {st === 'submitted' ? 'Submitted (Unresolved)' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inquiries Records display */}
                  <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl space-y-4">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-base font-bold text-slate-100 font-display">Inquiry Record Pipeline</h3>
                      <p className="text-xs text-slate-400">Total matched cases waiting in queue: {
                        inquiries.filter(i => {
                          const matchesSearch = i.agentName?.toLowerCase().includes(inquirySearchQuery.toLowerCase()) || 
                                                i.text.toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                                                getAgentLOB(i.agentName).toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                                                (i.clinicName && i.clinicName.toLowerCase().includes(inquirySearchQuery.toLowerCase())) ||
                                                (i.answer && i.answer.toLowerCase().includes(inquirySearchQuery.toLowerCase()));
                          const matchesStatus = inquiryStatusFilter === '' || i.status === inquiryStatusFilter;
                          return matchesSearch && matchesStatus;
                        }).length
                      }</p>
                    </div>

                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                      {inquiries.filter(i => {
                        const matchesSearch = i.agentName?.toLowerCase().includes(inquirySearchQuery.toLowerCase()) || 
                                              i.text.toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                                              getAgentLOB(i.agentName).toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                                              (i.clinicName && i.clinicName.toLowerCase().includes(inquirySearchQuery.toLowerCase())) ||
                                              (i.answer && i.answer.toLowerCase().includes(inquirySearchQuery.toLowerCase()));
                        const matchesStatus = inquiryStatusFilter === '' || i.status === inquiryStatusFilter;
                        return matchesSearch && matchesStatus;
                      }).length === 0 ? (
                        <div className="text-center py-16">
                          <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs text-slate-400 italic">No inquiries match the search filters or the queue is currently empty.</p>
                        </div>
                      ) : (
                        inquiries
                          .filter(i => {
                            const matchesSearch = i.agentName?.toLowerCase().includes(inquirySearchQuery.toLowerCase()) || 
                                                  i.text.toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                                                  getAgentLOB(i.agentName).toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                                                  (i.clinicName && i.clinicName.toLowerCase().includes(inquirySearchQuery.toLowerCase())) ||
                                                  (i.answer && i.answer.toLowerCase().includes(inquirySearchQuery.toLowerCase()));
                            const matchesStatus = inquiryStatusFilter === '' || i.status === inquiryStatusFilter;
                            return matchesSearch && matchesStatus;
                          })
                          .map(inq => {
                            let statusColor = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse";
                            let statusText = "Submitted";
                            if (inq.status === 'sent') {
                              statusColor = "bg-orange-500/10 border-orange-500/20 text-orange-400";
                              statusText = "Sent to Client";
                            } else if (inq.status === 'answered') {
                              statusColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                              statusText = "Answered";
                            }

                            return (
                              <div key={inq.id} className="p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/10 transition-all space-y-4 relative">
                                {/* Agent info, LOB and date */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8.5 h-8.5 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-xs shadow">
                                      {inq.agentName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">{inq.agentName}</span>
                                        <span className="text-[10px] text-slate-400 lowercase tracking-wide bg-white/5 border border-white/5 px-2 py-0.5 rounded font-sans">{getAgentLOB(inq.agentName)}</span>
                                        {inq.clinicName && (
                                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 border border-indigo-500/30 rounded font-sans font-bold flex items-center gap-1">
                                            🏥 {inq.clinicName}
                                          </span>
                                        )}
                                        {inq.phoneNumber && (
                                          <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 border border-sky-500/20 rounded font-mono font-bold flex items-center gap-1">
                                            📞 {inq.phoneNumber}
                                          </span>
                                        )}
                                        {inq.customerContacted === 'contacted' && (
                                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 border border-emerald-500/30 rounded font-sans font-bold flex items-center gap-1" title="Customer is Contacted">
                                            📞 Contacted
                                          </span>
                                        )}
                                        {inq.customerContacted === 'attempted' && (
                                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/30 rounded font-sans font-bold flex items-center gap-1" title="Contact has been Attempted">
                                            ⏳ Contact Attempted
                                          </span>
                                        )}
                                        {(inq.customerContacted === 'not_contacted' || !inq.customerContacted) && (
                                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 border border-rose-500/30 rounded font-sans font-bold flex items-center gap-1" title="Customer not contacted yet">
                                            ❌ Not Contacted
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[9px] text-slate-500 font-mono">{new Date(inq.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const details = `*Agent Name:* ${inq.agentName}
*Clinic:* ${inq.clinicName || 'N/A'}
*Inquiry:*
_ ${inq.text} _
*Answer:*
_ ${inq.answer || 'No answer yet'} _`;
                                        navigator.clipboard.writeText(details);
                                        toast.success('Inquiry details copied!');
                                      }}
                                      className="p-1 hover:bg-white/10 text-slate-300 hover:text-slate-100 rounded-md transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                                      title="Copy Inquiry Details"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg uppercase tracking-wider shrink-0 ${statusColor}`}>
                                      {statusText}
                                    </span>
                                    {isSuperAdmin && (
                                      <button
                                        onClick={() => handleDeleteInquiry(inq.id)}
                                        className="text-stone-400 hover:text-rose-400 p-1 rounded-md transition-all shrink-0 ml-1.5"
                                        title="Delete Inquiry"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Question body */}
                                <div className="space-y-3 font-sans">
                                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{inq.text}</p>

                                  {/* Render attachments */}
                                  {inq.photos && inq.photos.length > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-slate-400 font-mono block">Screenshots / Attachments ({inq.photos.length}):</span>
                                      <div className="flex flex-wrap gap-2">
                                        {inq.photos.map((photo, pIdx) => (
                                          <a
                                            key={pIdx}
                                            href={photo}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-indigo-400 transition-all bg-black/55 shrink-0"
                                            title="View Full Screenshot in new tab"
                                          >
                                            <img referrerPolicy="no-referrer" src={photo} alt="screenshot" className="w-full h-full object-cover" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Link index references */}
                                  {inq.links && inq.links.length > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-slate-400 font-mono block">Agent Reference Links ({inq.links.length}):</span>
                                      <div className="flex flex-col gap-1">
                                        {inq.links.map((link, lIdx) => (
                                          <a
                                            key={lIdx}
                                            href={link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 hover:underline truncate"
                                          >
                                            <ExternalLink className="w-3 h-3 text-indigo-500 shrink-0" />
                                            <span className="truncate">{link}</span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Update and input tools */}
                                <div className="pt-2 border-t border-white/5 space-y-3">
                                  {/* Default action stage button rows */}
                                  {inq.status === 'submitted' && (
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() => handleSetInquirySent(inq.id)}
                                        className="px-3.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        Mark as Sent
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAnsweringInquiryId(inq.id);
                                          setCurrentAnswerText(inq.answer || '');
                                        }}
                                        className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Inquiry Answered
                                      </button>
                                    </div>
                                  )}

                                  {inq.status === 'sent' && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-orange-400 uppercase">
                                        <Send className="w-3.5 h-3.5 animate-pulse" />
                                        <span>Sent to partner by {inq.sentBy} on {new Date(inq.sentAt || '').toLocaleString()}</span>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setAnsweringInquiryId(inq.id);
                                          setCurrentAnswerText(inq.answer || '');
                                        }}
                                        className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Inquiry Answered
                                      </button>
                                    </div>
                                  )}

                                  {inq.status === 'answered' && (
                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-emerald-500/5 pb-1 max-sm:flex-wrap gap-1">
                                        <span className="text-emerald-400 font-bold font-sans uppercase">✓ Answered by {inq.answeredBy}</span>
                                        <span>{new Date(inq.answeredAt || '').toLocaleString()}</span>
                                      </div>
                                      <p className="text-xs text-emerald-200 italic font-medium leading-relaxed font-sans">
                                        "{inq.answer}"
                                      </p>
                                      <button
                                        onClick={() => {
                                          setAnsweringInquiryId(inq.id);
                                          setCurrentAnswerText(inq.answer || '');
                                        }}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold block"
                                      >
                                        Edit Response
                                      </button>
                                    </div>
                                  )}

                                  {/* Reassign Agent Option */}
                                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                      👤 Reassign Agent:
                                    </span>
                                    <select
                                      value={inq.agentName}
                                      onChange={(e) => handleReassignInquiry(inq.id, e.target.value)}
                                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-100 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
                                    >
                                      {agentsList.map(aName => (
                                        <option key={aName} value={aName} className="bg-slate-800 text-slate-100 backdrop-blur-lg  font-sans">
                                          {aName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Dialog for answering inside pipeline cards */}
                                  {answeringInquiryId === inq.id && (
                                    <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl space-y-3 animate-fade-in text-left">
                                      <div className="flex justify-between items-center pb-1">
                                        <h4 className="text-xs font-bold text-slate-100 font-display">Feed Back / System Answer Details</h4>
                                        <button
                                          onClick={() => {
                                            setAnsweringInquiryId(null);
                                            setCurrentAnswerText('');
                                          }}
                                          className="text-slate-400 text-xs hover:text-slate-100"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                      <textarea
                                        placeholder="Type the response/answer details clearly..."
                                        value={currentAnswerText}
                                        onChange={(e) => setCurrentAnswerText(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-all font-sans resize-none"
                                      />
                                      <button
                                        onClick={() => handleSetInquiryAnswered(inq.id, currentAnswerText)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-all active:scale-95 text-center block w-max"
                                      >
                                        Submit Final Answer
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Team Leader Time Logs Review panel */}
            {activeTab === 'time-logs' && currentUser.role === 'tl' && (
                <div id="tl-timelog-view-root" className="space-y-6 animate-fade-in col-span-1 border border-white/5 p-2 bg-transparent/20 rounded-3xl">
                  
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-2">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-100 font-display">Your RTM (Real-Time Monitoring) Command Center</h2>
                      <p className="text-slate-400 text-sm font-sans">Command center to track shift times, restroom visits, or live-status breaks</p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 self-stretch md:self-auto">
                      <button
                        onClick={handleCopyCSVReport}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 font-sans"
                      >
                        <Download className="w-4 h-4 text-indigo-200" />
                        Export CSV Report
                      </button>

                      <button
                        onClick={() => setTlIsPrintMode(!tlIsPrintMode)}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/10 backdrop-blur-md hover:bg-slate-700 backdrop-blur-xl border border-white/20 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                      >
                        <Printer className="w-4 h-4 text-slate-400" />
                        {tlIsPrintMode ? 'Close Print Layout' : 'Open Printable Report'}
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => {
                            const doubleVal = window.confirm('Are you absolutely sure you want to delete all historical logs? This cannot be undone.');
                            if (doubleVal) {
                              setTimeLogs([]);
                              setStorageItem('sched_time_logs', []);
                              toast.success('Successfully purged all agent time card logs.');
                            }
                          }}
                          className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                        >
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          Purge All Logs
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Print Overlay Preview Layout */}
                  {(() => {
                    let activeAgentsForUI = [...agentsList];
                    timeLogs.forEach(log => {
                        if (log.clockIn && (new Date(log.clockIn).toDateString() === new Date().toDateString() || !['clocked_out', 'day_off', 'casual', 'annual', 'no_show'].includes(log.status))) {
                            if (!activeAgentsForUI.some(a => a?.toLowerCase() === log.agentName?.toLowerCase())) {
                                activeAgentsForUI.push(log.agentName);
                            }
                        }
                    });
                    
                    if (tlIsPrintMode) {
                      return (
                    <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl space-y-6 animate-fade-in text-slate-100 print:p-0 print:bg-slate-800 print:text-black">
                      <div className="flex justify-between items-center border-b border-white/10 pb-4 print:border-black">
                        <div>
                          <h3 className="text-xl font-extrabold font-display uppercase tracking-wider">DAILY MASTER ATTENDANCE & TIMECARD REPORT</h3>
                          <p className="text-xs text-slate-400 font-mono print:text-black mt-1">Generated: {currentTime.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => window.print()}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 print:hidden"
                        >
                          <Printer className="w-4 h-4" /> Trigger Browser Print
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans print:gap-2">
                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl print:border-black print:bg-transparent print:text-black">
                          <p className="text-[10px] text-slate-400 uppercase font-bold font-mono">Date Context</p>
                          <p className="text-sm font-bold mt-0.5">{currentTime.toLocaleDateString()}</p>
                        </div>
                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl print:border-black print:bg-transparent print:text-black">
                          <p className="text-[10px] text-slate-400 uppercase font-bold font-mono">Total Agents on Duty</p>
                          <p className="text-sm font-bold mt-0.5">{activeAgentsForUI.filter(a => getActiveTimeLog(a)).length} of {activeAgentsForUI.length}</p>
                        </div>
                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl print:border-black print:bg-transparent print:text-black">
                          <p className="text-[10px] text-slate-400 uppercase font-bold font-mono">Active on Break/Lunch</p>
                          <p className="text-sm font-bold mt-0.5">
                            {activeAgentsForUI.filter(a => {
                              const active = getActiveTimeLog(a);
                              return active && (active.status === 'break' || active.status === 'lunch');
                            }).length} agents
                          </p>
                        </div>
                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl print:border-black print:bg-transparent print:text-black">
                          <p className="text-[10px] text-slate-400 uppercase font-bold font-mono">Compliance Warnings</p>
                          <p className="text-sm font-bold text-rose-400 mt-0.5 print:text-black">
                            {activeAgentsForUI.filter(a => {
                              const stats = getAgentTodayStats(a);
                              return stats.breakMins > 15 || stats.lunchMins > 30;
                            }).length} overtime flags
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-white/10 rounded-2xl print:border-black">
                        <table className="w-full text-left border-collapse text-xs print:text-black">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-[10px] font-bold text-slate-300 font-mono print:border-black print:bg-transparent print:text-black">
                              <th className="px-4 py-3">Agent Name</th>
                              <th className="px-4 py-3">Timesheet Status</th>
                              <th className="px-3 py-3 font-mono">Shift Clock-In</th>
                              <th className="px-3 py-3 font-mono">Shift Clock-Out</th>
                              <th className="px-3 py-3 font-mono">Total Break (Mins)</th>
                              <th className="px-3 py-3 font-mono">Total Lunch (Mins)</th>
                              <th className="px-4 py-3 font-mono">Restroom Usage</th>
                              <th className="px-3 py-3 font-mono">Team Meeting (Mins)</th>
                              <th className="px-3 py-3 font-mono">1:1 Session (Mins)</th>
                              <th className="px-3 py-3 font-mono">Personal Break (Mins)</th>
                              <th className="px-4 py-3 text-right">Compliance Alert</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 print:divide-black">
                            {activeAgentsForUI.map(agent => {
                              const stats = getAgentTodayStats(agent);
                              const active = getActiveTimeLog(agent);
                              const statusText = active ? (active.status === 'working' ? 'Shift On-Duty' : active.status.toUpperCase()) : 'Clocked Out / Offline';
                              
                              let compliance = "✅ Compliant";
                              if (stats.breakMins > 15) {
                                compliance = `⚠️ Exceed Break (+${(stats.breakMins - 15).toFixed(1)}m)`;
                              } else if (stats.lunchMins > 30) {
                                compliance = `⚠️ Exceed Lunch (+${(stats.lunchMins - 30).toFixed(1)}m)`;
                              } else if (stats.restroomMins > 10) {
                                compliance = `⚠️ Exceed Restroom (+${(stats.restroomMins - 10).toFixed(1)}m)`;
                              } else if (stats.meetingMins > 60) {
                                compliance = `⚠️ Exceed Meeting (+${(stats.meetingMins - 60).toFixed(1)}m)`;
                              } else if (stats.oneOnOneMins > 30) {
                                compliance = `⚠️ Exceed 1:1 (+${(stats.oneOnOneMins - 30).toFixed(1)}m)`;
                              } else if (stats.personalMins > 15) {
                                compliance = `⚠️ Exceed Personal (+${(stats.personalMins - 15).toFixed(1)}m)`;
                              }

                              return (
                                <tr key={agent} className="print:text-black hover:bg-slate-700 transition-all">
                                  <td className="px-4 py-3 font-bold uppercase">
                                    {agent} <span className="text-[10px] text-slate-400 font-normal lowercase bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded ml-2 font-sans">{getAgentLOB(agent)}</span>
                                  </td>
                                  <td className="px-4 py-3 font-mono">
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                      statusText === 'Shift On-Duty' ? 'bg-emerald-500/10 text-emerald-400' :
                                      statusText.includes('BREAK') ? 'bg-amber-500/10 text-amber-400' :
                                      statusText.includes('LUNCH') ? 'bg-pink-500/10 text-pink-400' :
                                      statusText.includes('RESTROOM') ? 'bg-indigo-500/10 text-indigo-400' :
                                      statusText.includes('MEETING') ? 'bg-cyan-500/10 text-cyan-400' :
                                      statusText.includes('ONE') ? 'bg-violet-500/10 text-violet-400' :
                                      statusText.includes('PERSONAL') ? 'bg-emerald-500/10 text-emerald-400' :
                                      'bg-slate-500/10 text-slate-400'
                                    }`}>
                                      {statusText}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 font-mono">{stats.clockIn ? new Date(stats.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                  <td className="px-3 py-3 font-mono">{stats.clockOut ? new Date(stats.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (stats.clockIn ? 'Active Running' : '--:--')}</td>
                                  <td className="px-3 py-3 font-mono">{stats.breakMins.toFixed(1)}</td>
                                  <td className="px-3 py-3 font-mono">{stats.lunchMins.toFixed(1)}</td>
                                  <td className="px-4 py-3 font-mono">{stats.restroomMins.toFixed(1)} ({stats.restroomCount}x)</td>
                                  <td className="px-3 py-3 font-mono text-cyan-400">{stats.meetingMins.toFixed(1)}</td>
                                  <td className="px-3 py-3 font-mono text-violet-400">{stats.oneOnOneMins.toFixed(1)}</td>
                                  <td className="px-3 py-3 font-mono text-emerald-400">{stats.personalMins.toFixed(1)}</td>
                                  <td className="px-4 py-3 text-right font-semibold">
                                    <span className={compliance.startsWith('✅') ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}>
                                      {compliance}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end pr-2 pt-4">
                        <button
                          onClick={() => setTlIsPrintMode(false)}
                          className="px-4 py-2 bg-white/10 backdrop-blur-md text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-900/40/20 backdrop-blur-md cursor-pointer print:hidden"
                        >
                          &larr; Exit Roster View
                        </button>
                      </div>
                    </div>
                      );
                    } else {
                      return (
                    <>
                      {/* Active Roster Live Summary In or Out counters with list of names */}
                      {(() => {
                        let filteredAgents = activeAgentsForUI;
                        if (rtmSearch.trim()) {
                          filteredAgents = filteredAgents.filter(a => a?.toLowerCase().includes(rtmSearch.toLowerCase()));
                        }

                        // Status definitions
                        const statuses = [
                          { id: 'working', label: 'Online / On Duty', count: 0, agents: [] as string[], bgClass: 'bg-emerald-950/20', borderClass: 'border-emerald-500/20', textClass: 'text-emerald-50', badgeColor: 'bg-emerald-500', headerText: 'text-emerald-300', countText: 'text-emerald-400', cardBg: 'bg-emerald-900/10', cardBorder: 'border-emerald-500/20', cardText: 'text-emerald-100', cardHover: 'hover:bg-emerald-900/30', lobText: 'text-emerald-400' },
                          { id: 'break', label: 'On Break', count: 0, agents: [] as string[], bgClass: 'bg-amber-950/20', borderClass: 'border-amber-500/20', textClass: 'text-amber-50', badgeColor: 'bg-amber-500', headerText: 'text-amber-300', countText: 'text-amber-400', cardBg: 'bg-amber-900/10', cardBorder: 'border-amber-500/20', cardText: 'text-amber-100', cardHover: 'hover:bg-amber-900/30', lobText: 'text-amber-400' },
                          { id: 'lunch', label: 'On Lunch', count: 0, agents: [] as string[], bgClass: 'bg-pink-950/20', borderClass: 'border-pink-500/20', textClass: 'text-pink-50', badgeColor: 'bg-pink-500', headerText: 'text-pink-300', countText: 'text-pink-400', cardBg: 'bg-pink-900/10', cardBorder: 'border-pink-500/20', cardText: 'text-pink-100', cardHover: 'hover:bg-pink-900/30', lobText: 'text-pink-400' },
                          { id: 'restroom', label: 'Restroom', count: 0, agents: [] as string[], bgClass: 'bg-indigo-950/20', borderClass: 'border-indigo-500/20', textClass: 'text-indigo-50', badgeColor: 'bg-indigo-500', headerText: 'text-indigo-300', countText: 'text-indigo-400', cardBg: 'bg-indigo-900/10', cardBorder: 'border-indigo-500/20', cardText: 'text-indigo-100', cardHover: 'hover:bg-indigo-900/30', lobText: 'text-indigo-400' },
                          { id: 'meeting', label: 'In Meeting', count: 0, agents: [] as string[], bgClass: 'bg-cyan-950/20', borderClass: 'border-cyan-500/20', textClass: 'text-cyan-50', badgeColor: 'bg-cyan-500', headerText: 'text-cyan-300', countText: 'text-cyan-400', cardBg: 'bg-cyan-900/10', cardBorder: 'border-cyan-500/20', cardText: 'text-cyan-100', cardHover: 'hover:bg-cyan-900/30', lobText: 'text-cyan-400' },
                          { id: 'one_on_one', label: '1:1 Session', count: 0, agents: [] as string[], bgClass: 'bg-violet-950/20', borderClass: 'border-violet-500/20', textClass: 'text-violet-50', badgeColor: 'bg-violet-500', headerText: 'text-violet-300', countText: 'text-violet-400', cardBg: 'bg-violet-900/10', cardBorder: 'border-violet-500/20', cardText: 'text-violet-100', cardHover: 'hover:bg-violet-900/30', lobText: 'text-violet-400' },
                          { id: 'personal', label: 'Personal Time', count: 0, agents: [] as string[], bgClass: 'bg-blue-950/20', borderClass: 'border-blue-500/20', textClass: 'text-blue-50', badgeColor: 'bg-blue-500', headerText: 'text-blue-300', countText: 'text-blue-400', cardBg: 'bg-blue-900/10', cardBorder: 'border-blue-500/20', cardText: 'text-blue-100', cardHover: 'hover:bg-blue-900/30', lobText: 'text-blue-400' },
                          { id: 'offline', label: 'Offline / Clocked Out', count: 0, agents: [] as string[], bgClass: 'bg-white/5', borderClass: 'border-white/5', textClass: 'text-slate-400', badgeColor: 'bg-slate-600', headerText: 'text-slate-500', countText: 'text-slate-600', cardBg: 'bg-black/30', cardBorder: 'border-white/5', cardText: 'text-slate-500', cardHover: '', lobText: 'text-slate-500 opacity-50' }
                        ];

                        filteredAgents.forEach(agent => {
                          const active = getActiveTimeLog(agent);
                          let statusId = 'offline';
                          if (active) {
                            statusId = active.status === 'working' ? 'working' : active.status;
                          }
                          const group = statuses.find(s => s.id === statusId);
                          if (group) {
                            group.count++;
                            group.agents.push(agent);
                          } else {
                             // Fallback
                             statuses[7].count++;
                             statuses[7].agents.push(agent);
                          }
                        });
                        
                        const activeAgentsCount = statuses.reduce((acc, curr) => curr.id !== 'offline' ? acc + curr.count : acc, 0);

                        return (
                          <div className="space-y-6">
                            
                            {/* Control Bar */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 border border-white/5 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="font-display font-medium text-slate-100">Currently Active: <span className="font-bold text-emerald-400 font-mono">{activeAgentsCount}</span> / {agentsList.length}</span>
                              </div>
                              <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                  value={rtmSearch}
                                  onChange={(e) => setRtmSearch(e.target.value)}
                                  placeholder="Search agents by name..." 
                                  className="w-full pl-9 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm focus:border-indigo-500 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:bg-black/70"
                                />
                              </div>
                            </div>

                            {/* Roster Grid */}
                            <div className="flex flex-col gap-6">
                              {statuses.filter(s => s.count > 0).map(group => (
                                <div key={group.id} className={`p-5 rounded-2xl border ${group.bgClass} ${group.borderClass} ${group.textClass}`}>
                                  <div className={`flex justify-between items-center mb-4 border-b pb-3 ${group.id === 'offline' ? 'border-white/5' : group.borderClass}`}>
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${group.id === 'offline' ? 'bg-slate-600' : `${group.badgeColor} animate-pulse`}`}></span>
                                      <h4 className={`text-sm font-bold uppercase tracking-wider font-display ${group.headerText}`}>
                                        {group.label}
                                      </h4>
                                    </div>
                                    <span className={`text-lg font-black font-mono ${group.countText}`}>{group.count}</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {group.agents.map(agent => {
                                      const active = getActiveTimeLog(agent);
                                      const currentAct = active?.activities.find(a => !a.endTime && a.type === active?.status);
                                      
                                      // Determine timer start: current activity start time, or clockIn time if just 'working' without current activity
                                      let timerStart = currentAct?.startTime;
                                      if (active?.status === 'working') {
                                        // find the most recent activity end time if they just came back
                                        const lastAct = active.activities.slice().reverse().find(a => a.endTime);
                                        timerStart = lastAct?.endTime || active.clockIn;
                                      } else if (!timerStart) {
                                        timerStart = active?.clockIn;
                                      }

                                      const isSelected = rtmSelectedAgent === agent;

                                      return (
                                        <div 
                                          key={agent} 
                                          onClick={() => isMasterAdmin && setRtmSelectedAgent(isSelected ? null : agent)}
                                          className={`relative p-2.5 rounded-xl border flex flex-col justify-between gap-1 shadow-sm ${group.cardBg} ${group.cardBorder} ${group.cardText} ${isMasterAdmin ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:-translate-y-0.5' : 'cursor-default'} ${group.cardHover} transition-all`}
                                        >
                                          <div className="flex justify-between items-start w-full gap-2">
                                            <div className="flex flex-col w-full min-w-0">
                                              <span className="font-bold text-xs truncate whitespace-nowrap overflow-hidden" title={agent}>{agent}</span>
                                              <span className={`text-[9px] uppercase font-mono mt-0.5 font-semibold ${group.lobText}`}>{getAgentLOB(agent)}</span>
                                            </div>
                                          </div>
                                          
                                          {timerStart && group.id !== 'offline' && (
                                            <div className={`flex items-center gap-1 mt-1 text-[10px] font-mono opacity-80 border-t ${group.cardBorder} pt-1.5`}>
                                              <Clock className="w-3 h-3" />
                                              <ActiveTimer startTime={timerStart} />
                                            </div>
                                          )}

                                          {isSelected && isMasterAdmin && (
                                            <div className={`mt-2 pt-2 border-t ${group.cardBorder}`} onClick={e => e.stopPropagation()}>
                                              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 font-sans">Set Agent AUX</p>
                                              <select 
                                                value={group.id}
                                                onChange={(e) => {
                                                  handleTLOverrideAgentStatus(agent, e.target.value as any);
                                                  setRtmSelectedAgent(null);
                                                }}
                                                className="w-full bg-black/50 border border-white/10 rounded text-[10px] text-slate-200 px-1 py-1 flex items-center justify-center focus:outline-none focus:border-indigo-500 font-medium font-sans"
                                              >
                                                <option value="working" className="bg-slate-800">Online / On Duty</option>
                                                <option value="break" className="bg-slate-800">On Break</option>
                                                <option value="lunch" className="bg-slate-800">On Lunch</option>
                                                <option value="restroom" className="bg-slate-800">Restroom</option>
                                                <option value="meeting" className="bg-slate-800">In Meeting</option>
                                                <option value="one_on_one" className="bg-slate-800">1:1 Session</option>
                                                <option value="personal" className="bg-slate-800">Personal Time</option>
                                                <option value="clocked_out" className="bg-slate-800 text-rose-300">Force Clock Out</option>
                                              </select>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                              
                              {filteredAgents.length === 0 && (
                                <div className="p-10 border border-white/5 rounded-2xl text-center text-slate-500 flex flex-col items-center justify-center">
                                  <Users className="w-10 h-10 mb-3 opacity-20" />
                                  <p>No agents matched "{rtmSearch}"</p>
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })()}

                      {/* Live Compliance Alerts Panel */}
                      {(() => {
                        const complianceViolations: {
                          agentName: string;
                          lob: string;
                          violations: {
                            type: string;
                            limit: number;
                            actual: number;
                            exceededBy: number;
                            isCurrentlyActive: boolean;
                          }[];
                        }[] = [];

                        activeAgentsForUI.forEach(agent => {
                          const stats = getAgentTodayStats(agent);
                          const active = getActiveTimeLog(agent);
                          const activeElapsed = getActiveActivityElapsed(agent);

                          const agentViolations: {
                            type: string;
                            limit: number;
                            actual: number;
                            exceededBy: number;
                            isCurrentlyActive: boolean;
                          }[] = [];

                          // Check break (limit 15)
                          if (stats.breakMins > 15) {
                            agentViolations.push({
                              type: 'Break',
                              limit: 15,
                              actual: stats.breakMins,
                              exceededBy: stats.breakMins - 15,
                              isCurrentlyActive: active?.status === 'break'
                            });
                          }
                          // Check lunch (limit 30)
                          if (stats.lunchMins > 30) {
                            agentViolations.push({
                              type: 'Lunch',
                              limit: 30,
                              actual: stats.lunchMins,
                              exceededBy: stats.lunchMins - 30,
                              isCurrentlyActive: active?.status === 'lunch'
                            });
                          }
                          // Check restroom (limit 10)
                          if (stats.restroomMins > 10) {
                            agentViolations.push({
                              type: 'Restroom',
                              limit: 10,
                              actual: stats.restroomMins,
                              exceededBy: stats.restroomMins - 10,
                              isCurrentlyActive: active?.status === 'restroom'
                            });
                          }
                          // Check meeting (limit 60)
                          if (stats.meetingMins > 60) {
                            agentViolations.push({
                              type: 'Meeting',
                              limit: 60,
                              actual: stats.meetingMins,
                              exceededBy: stats.meetingMins - 60,
                              isCurrentlyActive: active?.status === 'meeting'
                            });
                          }
                          // Check 1:1 session (limit 30)
                          if (stats.oneOnOneMins > 30) {
                            agentViolations.push({
                              type: '1:1 Session',
                              limit: 30,
                              actual: stats.oneOnOneMins,
                              exceededBy: stats.oneOnOneMins - 30,
                              isCurrentlyActive: active?.status === 'one_on_one'
                            });
                          }
                          // Check personal break (limit 15)
                          if (stats.personalMins > 15) {
                            agentViolations.push({
                              type: 'Personal Break',
                              limit: 15,
                              actual: stats.personalMins,
                              exceededBy: stats.personalMins - 15,
                              isCurrentlyActive: active?.status === 'personal'
                            });
                          }

                          // Also check active session threshold
                          if (activeElapsed && activeElapsed.exceeded) {
                            const alreadyListed = agentViolations.find(v => v.type.toLowerCase() === activeElapsed.type.toLowerCase() || (v.type === '1:1 Session' && activeElapsed.type === 'one_on_one') || (v.type === 'Personal Break' && activeElapsed.type === 'personal'));
                            if (!alreadyListed) {
                              agentViolations.push({
                                type: activeElapsed.type === 'one_on_one' ? '1:1 Session' : (activeElapsed.type === 'personal' ? 'Personal Break' : activeElapsed.type.toUpperCase()),
                                limit: activeElapsed.limit,
                                actual: activeElapsed.duration,
                                exceededBy: activeElapsed.exceededBy,
                                isCurrentlyActive: true
                              });
                            }
                          }

                          if (agentViolations.length > 0) {
                            complianceViolations.push({
                              agentName: agent,
                              lob: getAgentLOB(agent),
                              violations: agentViolations
                            });
                          }
                        });

                        return (
                          <div id="compliance-alerts-panel" className="p-6 bg-[#180d14]/80 border border-rose-500/20 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-500/10 pb-3">
                              <div className="space-y-1">
                                <h4 className="text-sm font-black text-rose-300 flex items-center gap-2 font-display uppercase tracking-wider">
                                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                                  Live Compliance Alerts & Aux Watch
                                </h4>
                                <p className="text-[11px] text-slate-400 font-sans">
                                  Real-time tracker displaying active and cumulative aggregate daily auxiliary limit violations per agent.
                                </p>
                              </div>
                              <span className={`px-2.5 py-1 text-[10px] font-black rounded-xl border uppercase tracking-wider ${
                                complianceViolations.length > 0 
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-mono animate-pulse' 
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}>
                                {complianceViolations.length} Active Breach{complianceViolations.length !== 1 ? 'es' : ''} Today
                              </span>
                            </div>

                            {complianceViolations.length === 0 ? (
                              <div className="flex items-center gap-3.5 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
                                <span className="flex h-6 w-6 shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full items-center justify-center font-bold text-xs select-none">✓</span>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-emerald-300 font-sans">All Agents are 100% Compliant</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans">No active alarm status logs or cumulative auxiliary overtime events detected under today's schedule.</p>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                                {complianceViolations.map(entry => (
                                  <div key={entry.agentName} className="p-4 bg-black/40 border border-rose-500/15 rounded-2xl flex flex-col justify-between gap-3 text-left relative overflow-hidden group hover:border-rose-500/25 transition-all">
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="text-xs font-black text-slate-100 uppercase tracking-wide font-display">{entry.agentName}</p>
                                          <span className="inline-block text-[8px] font-extrabold uppercase text-rose-300 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md mt-1 font-sans">
                                            LOB: {entry.lob}
                                          </span>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end">
                                          {entry.violations.some(v => v.isCurrentlyActive) && (
                                            <span className="flex items-center gap-1.5 text-[8px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse font-sans">
                                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 block"></span>
                                              Overtime Now
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-1.5 mt-2">
                                        {entry.violations.map((violation, idx) => (
                                          <div key={idx} className="flex flex-col gap-1 p-2 bg-white/5 border border-white/5 rounded-xl text-[11px] font-sans">
                                            <div className="flex items-center justify-between font-bold">
                                              <span className="text-slate-200">
                                                {violation.type} Limit:
                                              </span>
                                              <span className="text-rose-400 font-mono font-black">
                                                +{violation.exceededBy.toFixed(1)}Over
                                              </span>
                                            </div>
                                            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                                              <span>Allotted: {violation.limit}m</span>
                                              <span className="font-mono">Logged: {violation.actual.toFixed(1)}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const violationTypes = entry.violations.map(v => v.type).join(', ');
                                        addSystemNotification(
                                          "🚨 Compliance Warning: Auxiliary Limit Exceeded",
                                          `Hello ${entry.agentName}. Your daily total or session threshold for ${violationTypes} has exceeded allowed limits. Please coordinate with your Team Leader immediately.`,
                                          "compliance",
                                          entry.agentName
                                        );
                                        toast.success(`Direct compliance warning notification dispatched dynamically to ${entry.agentName}!`);
                                      }}
                                      className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-[9px] uppercase font-bold tracking-wider hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all flex items-center justify-center gap-1.5 font-sans"
                                    >
                                      <Bell className="w-3.5 h-3.5" />
                                      Send Direct Compliance Ping
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Real-time filters and search control */}
                      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                        <div className="sm:col-span-2 relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            <Search className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            value={tlSearchQuery}
                            onChange={(e) => setTlSearchQuery(e.target.value)}
                            placeholder="Filter status table by agent name..."
                            className="w-full pl-9 pr-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-2">
                          <span className="text-xs text-slate-400 whitespace-nowrap">Filter Status:</span>
                          <select
                            value={tlStatusFilter}
                            onChange={(e) => setTlStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="all" className="bg-slate-800 text-slate-100 ">All Agents</option>
                            <option value="in" className="bg-slate-800 text-slate-100 ">Clocked In (IN)</option>
                            <option value="out" className="bg-slate-800 text-slate-100 ">Clocked Out (OUT)</option>
                            <option value="break_lunch" className="bg-slate-800 text-slate-100 ">On Break / Lunch Activity</option>
                            <option value="overtime" className="bg-slate-800 text-slate-100 ">Warning / Overtime Limit Exceeded</option>
                          </select>
                        </div>
                      </div>

                      {/* Live station usage & totals board */}
                      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <h3 className="font-bold text-slate-100 text-base font-display">Daily Presence & Break Report Sheet</h3>
                            <p className="text-xs text-slate-400 font-sans">Comprehensive view of today’s logs, break, lunch, and restroom statistics per agent</p>
                          </div>
                        </div>

                        {(() => {
                          const roster = agentsList.map(agent => {
                            const stats = getAgentTodayStats(agent);
                            const active = getActiveTimeLog(agent);
                            const todayLog = getTodayLog(agent);
                            const activityElapsed = getActiveActivityElapsed(agent);
                            
                            // Determine overall status
                            let statusVal = 'clocked_out';
                            if (active) {
                              statusVal = active.status;
                            } else if (todayLog) {
                              statusVal = todayLog.status;
                            }

                            return {
                              name: agent,
                              isActive: !!active,
                              activeStatus: statusVal, // updated
                              stats,
                              exceededLimit: false, // will map logic below
                              exceededText: "Compliant",
                              exceededTypeStr: "",
                              exceedVal: 0,
                              isCurrentlyExceeded: activityElapsed?.exceeded || false,
                              currentExceedType: activityElapsed?.type || null,
                              currentExceedBy: activityElapsed?.exceededBy || 0
                            };
                          }).map(entry => {
                            // Determine overall exceed condition
                            if (entry.stats.breakMins > 15) {
                              entry.exceededLimit = true;
                              entry.exceededTypeStr = "Break";
                              entry.exceedVal = entry.stats.breakMins - 15;
                              entry.exceededText = `Exceeded Break (+${entry.exceedVal.toFixed(1)}m)`;
                            } else if (entry.stats.lunchMins > 30) {
                              entry.exceededLimit = true;
                              entry.exceededTypeStr = "Lunch";
                              entry.exceedVal = entry.stats.lunchMins - 30;
                              entry.exceededText = `Exceeded Lunch (+${entry.exceedVal.toFixed(1)}m)`;
                            }
                            return entry;
                          }).filter(entry => {
                            // 1. Filter by Search Query
                            const matchesSearch = entry.name.toLowerCase().includes(tlSearchQuery.toLowerCase());
                            if (!matchesSearch) return false;

                            // 2. Filter by Status select
                            if (tlStatusFilter === 'all') return true;
                            if (tlStatusFilter === 'in') return entry.isActive;
                            if (tlStatusFilter === 'out') return !entry.isActive;
                            if (tlStatusFilter === 'break_lunch') return entry.activeStatus === 'break' || entry.activeStatus === 'lunch';
                            if (tlStatusFilter === 'overtime') return entry.exceededLimit || entry.isCurrentlyExceeded;

                            return true;
                          });
                          
                          if (roster.length === 0) {
                            return (
                              <p className="text-center py-16 text-xs text-slate-400 italic">No agent matching filters today.</p>
                            );
                          }

                          return (
                            <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/45 overflow-visible">
                              <table className="w-full text-left border-collapse min-w-[750px]">
                                <thead>
                                  <tr className="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                                    <th className="px-5 py-3">Agent Name</th>
                                    <th className="px-3 py-3 font-medium">TL Status Override</th>
                                    <th className="px-3 py-3 font-medium">Shift Log</th>
                                    <th className="px-4 py-3 text-amber-300 font-medium">Total Break (15m limit)</th>
                                    <th className="px-4 py-3 text-pink-300 font-medium">Total Lunch (30m limit)</th>
                                    <th className="px-4 py-3 text-indigo-300 font-medium">Restroom (Total Mins)</th>
                                    <th className="px-5 py-3 text-right font-medium">Today's Compliance</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-sans">
                                  {roster.map(entry => {
                                    const { name, activeStatus, stats, exceededLimit, exceededText, exceedVal, isCurrentlyExceeded, currentExceedBy } = entry;
                                    
                                    // Calculate status colors
                                    let statusDot = 'bg-slate-500';
                                    if (['working', 'in'].includes(activeStatus)) statusDot = 'bg-emerald-500';
                                    if (activeStatus === 'break') statusDot = 'bg-amber-500 animate-pulse';
                                    if (activeStatus === 'lunch') statusDot = 'bg-pink-500 animate-pulse';
                                    if (activeStatus === 'restroom') statusDot = 'bg-indigo-500 animate-pulse';

                                    return (
                                      <tr key={name} className="hover:bg-slate-700 transition-all">
                                        {/* Name */}
                                        <td className="px-5 py-4 font-bold text-slate-100 font-display uppercase tracking-wide">
                                          <div>{name}</div>
                                          <div className="text-[9px] text-slate-400 font-normal lowercase tracking-wide bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg mt-1 w-max block">{getAgentLOB(name)}</div>
                                        </td>

                                        {/* Live status badge / select */}
                                        <td className="px-3 py-4">
                                          <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`}></span>
                                            <select 
                                              value={activeStatus}
                                              onChange={(e) => handleTLOverrideAgentStatus(name, e.target.value as any)}
                                              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-[10px] text-slate-100 px-2 py-1 focus:outline-none focus:border-indigo-500 font-bold uppercase cursor-pointer max-w-[120px]"
                                            >
                                              <option value="working" className="bg-slate-800 text-slate-100 ">On Shift (Working)</option>
                                              <option value="break" className="bg-slate-800 text-slate-100 ">On Break</option>
                                              <option value="lunch" className="bg-slate-800 text-slate-100 ">On Lunch</option>
                                              <option value="restroom" className="bg-slate-800 text-slate-100 ">In Restroom</option>
                                              <option value="clocked_out" className="bg-slate-800 text-slate-100 ">Clocked Out</option>
                                              <option value="day_off" className="bg-slate-800 text-slate-100 ">Day Off</option>
                                              <option value="casual" className="bg-slate-800 text-slate-100 ">Casual Leave</option>
                                              <option value="annual" className="bg-slate-800 text-slate-100 ">Annual Leave</option>
                                              <option value="no_show" className="bg-slate-800 text-slate-100 ">No Show</option>
                                            </select>
                                          </div>
                                        </td>

                                        {/* Shifts */}
                                        <td className="px-3 py-4 space-y-0.5">
                                          <p className="text-[10px] text-slate-400 font-mono">
                                            In: <span className="text-emerald-400 font-semibold">{stats.clockIn ? new Date(stats.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                          </p>
                                          <p className="text-[10px] text-slate-400 font-mono">
                                            Out: <span className="text-rose-400 font-semibold">{stats.clockOut ? new Date(stats.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (stats.clockIn ? 'Active shift' : '--:--')}</span>
                                          </p>
                                        </td>

                                        {/* Total Break */}
                                        <td className="px-4 py-4 space-y-1">
                                          <div className="flex justify-between text-[10px] font-mono">
                                            <span className={stats.breakMins > 15 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                              {stats.breakMins.toFixed(1)}ins
                                            </span>
                                            <span className="text-slate-500">of 15m</span>
                                          </div>
                                          <div className="w-full bg-white/10 backdrop-blur-md rounded-full h-1 relative">
                                            <div
                                              className={`h-1 rounded-full transition-all duration-300 ${stats.breakMins > 15 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}
                                              style={{ width: `${Math.min(100, (stats.breakMins / 15) * 100)}%` }}
                                            ></div>
                                          </div>
                                        </td>

                                        {/* Total Lunch */}
                                        <td className="px-4 py-4 space-y-1">
                                          <div className="flex justify-between text-[10px] font-mono">
                                            <span className={stats.lunchMins > 30 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                              {stats.lunchMins.toFixed(1)}ins
                                            </span>
                                            <span className="text-slate-500">of 30m</span>
                                          </div>
                                          <div className="w-full bg-white/10 backdrop-blur-md rounded-full h-1 relative">
                                            <div
                                              className={`h-1 rounded-full transition-all duration-300 ${stats.lunchMins > 30 ? 'bg-rose-500 animate-pulse' : 'bg-pink-400'}`}
                                              style={{ width: `${Math.min(100, (stats.lunchMins / 30) * 100)}%` }}
                                            ></div>
                                          </div>
                                        </td>

                                        {/* Restroom */}
                                        <td className="px-4 py-4 leading-normal">
                                          <p className="text-indigo-300 font-semibold font-mono">{stats.restroomMins.toFixed(1)}ins</p>
                                          <p className="text-[10px] text-slate-500 font-sans">{stats.restroomCount} sessions logged</p>
                                        </td>

                                        {/* Compliance status banner */}
                                        <td className="px-5 py-4 text-right">
                                          {isCurrentlyExceeded && (
                                            <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[9px] uppercase tracking-wide select-none animate-pulse block text-center max-w-[130px] ml-auto">
                                              🚨 Overtime Now (+{currentExceedBy.toFixed(1)}m)
                                            </span>
                                          )}
                                          {!isCurrentlyExceeded && exceededLimit && (
                                            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300/80 font-bold text-[9px] uppercase tracking-wide block text-center max-w-[130px] ml-auto">
                                              ⚠️ Limit Exceeded
                                            </span>
                                          )}
                                          {!isCurrentlyExceeded && !exceededLimit && (
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-bold text-[9px] uppercase tracking-wide block text-center max-w-[130px] ml-auto">
                                              ✅ Compliant
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                      );
                    }
                  })()}
                </div>
              )}

              {/* Schedules View & Upload Panel */}
              {activeTab === 'schedules' && (
                <div id="schedules-view-root" className="space-y-6 animate-fade-in">
                  
                  {/* Title Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-pink-300 bg-clip-text font-display flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-indigo-400" />
                        Agent Schedule Roster
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">Browse shift coverage, find trade partners, and publish rosters</p>
                    </div>

                    {isSuperAdmin && (
                      <button
                        onClick={clearTargetSchedules}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/35 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-stretch md:self-auto justify-center"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        Clear Current Roster
                      </button>
                    )}
                  </div>

                  {/* Schedule Upload Module */}
{isSuperAdmin && (
   <div className="w-full">
     <ScheduleUpload 
        onSchedulesImported={(parsedSchedules) => {
           setTempSchedules(parsedSchedules as any);
           setUploadSuccess(`Successfully processed ${parsedSchedules.length} shifts.`);
        }} 
     />
     {tempSchedules.length > 0 && (
         <div className="mt-4 flex justify-end">
            <button onClick={commitSchedules} className="px-5 py-2 bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                <CheckCircle2 className="w-4 h-4" /> Save & Append Published Schedule ({tempSchedules.length} items)
            </button>
         </div>
     )}
   </div>
)}

{/* Roster Live Toggle Switch purely for Hesham & Amira */}
                  {isSuperAdmin && (
                    <div className="bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-blue-500/15 border border-indigo-500/30 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shadow-xl">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${isRosterPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider font-display">Schedule Roster Release Status</h3>
                        </div>
                        <p className="text-xs text-slate-300">
                          {isRosterPublished 
                            ? "Published & Released: Standard agents are allowed to view the complete schedule roster and trigger shift swap requests."
                            : "Draft Mode: Full schedule calendar views are restricted to Team Leaders & Administration. Agents see custom draft shift card previews only."
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase text-slate-400 font-mono">
                          {isRosterPublished ? '🟢 Published' : '🟡 Draft Only'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={isRosterPublished}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setIsRosterPublished(val);
                              setStorageItem('sched_roster_published', val);
                              if (val) {
                                addSystemNotification(
                                  "✨ New Schedule Published!",
                                  `The direct schedule roster has been published by ${currentUser?.name || 'Leadership'}! You can now view your active shifts in the Schedules tab and request shift swaps.`,
                                  "schedule",
                                  "all"
                                );
                              }
                              toast.success(`Schedule Roster ${val ? 'PUBLISHED & ACTIVE' : 'RETURNED TO DRAFT MODE'}!`);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-slate-800 after:border-slate-700 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 border border-white/10"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Manual Single-Shift Roster Submission Form */}
                  {isSuperAdmin && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl shadow-sm text-slate-100 p-6 shadow-2xl space-y-5 text-left">
                      <div>
                        <h3 className="font-extrabold text-slate-100 text-base font-display flex items-center gap-2">
                          <PlusCircle className="w-5 h-5 text-indigo-400" />
                          Individual Shift Assignment Submitter
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Manually program, assign, or override individual agent shift allocations with custom Notes</p>
                      </div>

                      <form onSubmit={handleManualRosterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1 space-y-1.5 font-sans">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">1. Choose Agent</label>
                          <select
                            value={manualRosterAgent}
                            onChange={(e) => setManualRosterAgent(e.target.value)}
                            className="w-full px-3 py-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-slate-100 outline-none cursor-pointer focus:border-indigo-500 font-sans"
                          >
                            <option value="">-- Choose Agent --</option>
                            {agentsList.map(name => (
                              <option className="bg-slate-800 text-slate-100 " key={name} value={name}>
                                {name} ({getAgentLOB(name)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-1 space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">2. Coverage Date</label>
                          <input
                            type="date"
                            value={manualRosterDate}
                            onChange={(e) => setManualRosterDate(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/45 border border-white/10 rounded-xl text-xs text-slate-100 outline-none focus:border-indigo-500 h-[42px]"
                          />
                        </div>

                        <div className="md:col-span-1 space-y-1.5 font-sans">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">3. Schedule Shift</label>
                          <select
                            value={manualRosterShift}
                            onChange={(e) => setManualRosterShift(e.target.value)}
                            className="w-full px-3 py-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-slate-100 outline-none cursor-pointer focus:border-indigo-500 font-sans"
                          >
                            {SHIFTS.map(s => (
                              <option className="bg-slate-800 text-slate-100 " key={s.id} value={s.label}>
                                {s.display} ({s.label})
                              </option>
                            ))}
                            <option className="bg-slate-800 text-slate-100 " value="Off">Rest Day (Off Day)</option>
                          </select>
                        </div>

                        <div className="md:col-span-1 block">
                          <button
                            type="submit"
                            className="w-full h-[42px] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer hover:scale-[1.02]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Submit Roster Shift
                          </button>
                        </div>

                        {/* Shift Notes Field spanning full width */}
                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">4. Roster Shift Notes (Saves to Shift details)</label>
                          <input
                            type="text"
                            placeholder="e.g. Approved temporary schedule override / Direct management assignment / Shift Notes..."
                            value={manualRosterNotes}
                            onChange={(e) => setManualRosterNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </form>
                    </div>
                  )}


                  {/* Informative coverage card indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Active Scheduled Days</p>
                      <p className="text-2xl font-black text-slate-100">
                        {allScheduleDates.length} Days Covered
                      </p>
                      <p className="text-[10px] text-indigo-300 mt-1">
                        {allScheduleDates.length > 0 
                          ? `${formatDateNice(allScheduleDates[0])} to ${formatDateNice(allScheduleDates[allScheduleDates.length - 1])}`
                          : 'Roster empty, using default rotation window'
                        }
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Coverage Scope</p>
                      <p className="text-2xl font-black text-slate-100">
                        {schedules.length} Assigned Shifts
                      </p>
                      <p className="text-[10px] text-emerald-300 mt-1">
                        Supporting standard rotation & manual uploads
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 font-mono">My Upcoming Shift</p>
                      {currentUser.role === 'agent' ? (
                        (() => {
                          const todayStr = getLocalISOString(systemTime);
                          const myShiftsArr = schedules.filter(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date >= todayStr);
                          if (myShiftsArr.length > 0) {
                            return (
                              <>
                                <p className="text-2xl font-black text-indigo-300 truncate">
                                  {myShiftsArr[0].shiftLabel}
                                </p>
                                <p className="text-[10px] text-indigo-200 mt-1">
                                  Next on: {formatDateNice(myShiftsArr[0].date)}
                                </p>
                              </>
                            );
                          }
                          return (
                            <>
                              <p className="text-2xl font-black text-slate-400">Rest / No Shift</p>
                              <p className="text-[10px] text-slate-500 mt-1">No upcoming scheduled shifts found</p>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <p className="text-2xl font-black text-amber-300">TL Supervision</p>
                          <p className="text-[10px] text-slate-400 mt-1">Roster upload and override controls enabled</p>
                        </>
                      )}
                    </div>
                  </div>

                  {false ? (
                    <div className="space-y-6">
                      <div className="p-12 text-center rounded-3xl border border-dashed border-indigo-500/30 bg-slate-800/[0.02] space-y-4 shadow-xl text-left">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                          <Shield className="w-8 h-8" />
                        </div>
                        <div className="space-y-2 text-center">
                          <h3 className="text-xl font-bold text-slate-100 tracking-wide font-display">Schedule Roster Draft Status</h3>
                          <p className="text-slate-400 text-sm max-w-md mx-auto">
                            The collective team schedule roster is currently under construction and edit by administration. Once released, the complete calendar tracker and trading capabilities will become active.
                          </p>
                        </div>
                        <div className="flex justify-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold uppercase text-[9px] tracking-wider font-mono mx-auto">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                            Roster Draft Stage
                          </div>
                        </div>
                      </div>

                      {/* Display personalized preview list */}
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 text-left">
                        <div className="border-b border-white/5 pb-3">
                          <h4 className="text-sm font-black text-indigo-300 uppercase tracking-widest font-mono">My Shift Coverage Preview</h4>
                          <p className="text-xs text-slate-400 mt-1">Below are your upcoming assigned shifts as current in the administrator blueprint:</p>
                        </div>

                        {(() => {
                          const todayStr = getLocalISOString(systemTime);
                          const myShiftsArr = schedules.filter(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date >= todayStr);
                          if (myShiftsArr.length === 0) {
                            return (
                              <div className="py-6 text-center text-xs text-slate-500 italic">
                                No upcoming scheduled shifts match your account name in this draft revision.
                              </div>
                            );
                          }
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {myShiftsArr.map(shift => {
                                const style = getShiftBadgeStyle(shift.shiftLabel);
                                return (
                                  <div key={shift.id} className="p-4 bg-slate-800/[0.02] border border-white/5 rounded-2xl flex items-center justify-between shadow">
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-mono font-medium">{formatDateNice(shift.date)}</p>
                                      <p className="text-xs font-bold text-slate-100 mt-1 uppercase tracking-wide">{shift.agentName}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded border uppercase tracking-wider ${style.bg}`}>
                                      {style.display}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Search, Filter, & Navigation Toolbar */}
                      <div className="p-4 bg-white/5 border border-white/10 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                      {/* Search bar */}
                      <input
                        type="text"
                        placeholder="Filter by Agent Name..."
                        value={scheduleFilterAgent}
                        onChange={(e) => setScheduleFilterAgent(e.target.value)}
                        className="px-4 py-2 bg-black/45 hover:bg-slate-700 backdrop-blur-xl border border-white/10 focus:border-indigo-500/85 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-100 placeholder-slate-400 outline-none transition-all w-full sm:w-64"
                      />

                      {/* View Mode */}
                      <div className="flex rounded-xl bg-black/45 p-1 border border-white/5">
                        <button
                          onClick={() => {
                            setScheduleViewMode('week');
                            setSchedulePageOffset(0);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            scheduleViewMode === 'week' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-100'
                          }`}
                        >
                          Week
                        </button>
                        <button
                          onClick={() => {
                            setScheduleViewMode('fortnight');
                            setSchedulePageOffset(0);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            scheduleViewMode === 'fortnight' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-100'
                          }`}
                        >
                          2-Weeks
                        </button>
                        <button
                          onClick={() => {
                            setScheduleViewMode('month');
                            setSchedulePageOffset(0);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            scheduleViewMode === 'month' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-100'
                          }`}
                        >
                          Full Month
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Paging Actions */}
                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Showing offsets: {safeOffset + 1} {Math.min(safeOffset + displayDaysCount, baseDatesList.length)}f {baseDatesList.length} dates
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={safeOffset === 0}
                          onClick={() => setSchedulePageOffset(prev => Math.max(0, prev - displayDaysCount))}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-100 disabled:opacity-30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          &larr; Prev
                        </button>
                        <button
                          disabled={safeOffset + displayDaysCount >= baseDatesList.length}
                          onClick={() => setSchedulePageOffset(prev => Math.min(baseDatesList.length - displayDaysCount, prev + displayDaysCount))}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-100 disabled:opacity-30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Next &rarr;
                        </button>
                      </div>

                          {currentUser.role === 'agent' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={syncShiftsToGoogleCalendar}
                                disabled={isSyncingCalendar}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                                title="Sync with Google Calendar"
                              >
                                {isSyncingCalendar ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Calendar className="w-3.5 h-3.5" />
                                )}
                                Sync Google
                              </button>
                              <button
                                onClick={downloadShiftsICS}
                                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-700/20"
                                title="Download .ics for Outlook/Apple Calendar"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Save Other
                              </button>
                            </div>
                          )}
                    </div>
                  </div>



                  {/* Active Schedule visual Matrix grid */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <h3 className="font-bold text-slate-100 text-base font-display"> Roster Coverage Planner</h3>
                      <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1.5 font-bold uppercase">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Active Database
                      </span>
                    </div>

                    {schedules.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 space-y-3">
                        <Calendar className="w-12 h-12 mx-auto text-indigo-400 opacity-40 animate-pulse" />
                        <div>
                          <p className="font-bold text-slate-100 text-base">Active schedule roster is empty</p>
                          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                            {currentUser.role === 'tl'
                              ? 'Please compile and upload a CSV weekly or monthly schedule file using the drag-and-drop panel above.'
                              : 'A Team Leader has not loaded the schedule roster yet. Initial dummy rotation is turned off.'
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Coverage Heatmap Gradient Section */}
                        {(() => {
                          const getCoverageForDate = (dateStr: string) => {
                            const dayShifts = schedules.filter(s => s.date === dateStr);
                            
                            const morningAgents = dayShifts.filter(s => {
                              const norm = s.shiftLabel.toLowerCase();
                              return norm.includes('07:00') || norm.includes('morning');
                            }).map(s => s.agentName);
                            
                            const afternoonAgents = dayShifts.filter(s => {
                              const norm = s.shiftLabel.toLowerCase();
                              return norm.includes('13:00') || norm.includes('afternoon');
                            }).map(s => s.agentName);
                            
                            const nightAgents = dayShifts.filter(s => {
                              const norm = s.shiftLabel.toLowerCase();
                              return norm.includes('22:00') || norm.includes('night');
                            }).map(s => s.agentName);

                            const totalCount = morningAgents.length + afternoonAgents.length + nightAgents.length;
                            const totalTarget = heatmapMorningTarget + heatmapAfternoonTarget + heatmapNightTarget;

                            return {
                              morning: { count: morningAgents.length, target: heatmapMorningTarget, agents: morningAgents },
                              afternoon: { count: afternoonAgents.length, target: heatmapAfternoonTarget, agents: afternoonAgents },
                              night: { count: nightAgents.length, target: heatmapNightTarget, agents: nightAgents },
                              total: { count: totalCount, target: totalTarget, agents: [...morningAgents, ...afternoonAgents, ...nightAgents] }
                            };
                          };

                          return (
                            <div className="bg-[#12121e]/85 border border-indigo-500/25 rounded-3xl p-5 space-y-4 mb-6 text-left shadow-2xl relative overflow-hidden backdrop-blur-xl">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-100 flex items-center gap-2 font-display">
                                    <span className="flex h-2.5 w-2.5 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    Roster Coverage Heatmap Analytics
                                  </h4>
                                  <p className="text-[11px] text-slate-400 font-sans">
                                    Live shift coverage matrix compared against custom targets. Hover on individual cells to inspect scheduled agents.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setHeatmapConfigureOpen(!heatmapConfigureOpen)}
                                  className="px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/25 text-indigo-300 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  {heatmapConfigureOpen ? 'Hide Staffing Targets' : 'Configure Staffing Targets'}
                                </button>
                              </div>

                              {/* Interactive Target Configurator Panel */}
                              {heatmapConfigureOpen && (
                                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left transition-all">
                                  <div className="space-y-2">
                                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-sans">
                                      🌅 Morning Shift Target (07-16)
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = Math.max(1, heatmapMorningTarget - 1);
                                          setHeatmapMorningTarget(val);
                                          setStorageItem('heatmap_morning_target', val);
                                        }}
                                        className="w-8 h-8 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-100 font-bold rounded-lg border border-white/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="w-10 text-center font-bold text-slate-100 text-sm font-mono">
                                        {heatmapMorningTarget}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = heatmapMorningTarget + 1;
                                          setHeatmapMorningTarget(val);
                                          setStorageItem('heatmap_morning_target', val);
                                        }}
                                        className="w-8 h-8 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-100 font-bold rounded-lg border border-white/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <p className="text-[8.5px] text-slate-500 font-sans">Ideal working agents on clock</p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-sans">
                                      ☀️ Afternoon Shift Target (13-22)
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = Math.max(1, heatmapAfternoonTarget - 1);
                                          setHeatmapAfternoonTarget(val);
                                          setStorageItem('heatmap_afternoon_target', val);
                                        }}
                                        className="w-8 h-8 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-100 font-bold rounded-lg border border-white/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="w-10 text-center font-bold text-slate-100 text-sm font-mono">
                                        {heatmapAfternoonTarget}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = heatmapAfternoonTarget + 1;
                                          setHeatmapAfternoonTarget(val);
                                          setStorageItem('heatmap_afternoon_target', val);
                                        }}
                                        className="w-8 h-8 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-100 font-bold rounded-lg border border-white/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <p className="text-[8.5px] text-slate-500 font-sans">Ideal working agents on clock</p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-sans">
                                      🌙 Night Shift Target (22-07)
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = Math.max(1, heatmapNightTarget - 1);
                                          setHeatmapNightTarget(val);
                                          setStorageItem('heatmap_night_target', val);
                                        }}
                                        className="w-8 h-8 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-100 font-bold rounded-lg border border-white/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="w-10 text-center font-bold text-slate-100 text-sm font-mono">
                                        {heatmapNightTarget}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = heatmapNightTarget + 1;
                                          setHeatmapNightTarget(val);
                                          setStorageItem('heatmap_night_target', val);
                                        }}
                                        className="w-8 h-8 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-100 font-bold rounded-lg border border-white/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <p className="text-[8.5px] text-slate-500 font-sans">Ideal working agents on clock</p>
                                  </div>
                                </div>
                              )}

                              {/* Heatmap Grid Matrix */}
                              <div className="overflow-x-auto pb-1 rounded-xl">
                                <div className="min-w-[850px] space-y-2">
                                  {/* Header row containing Dates */}
                                  <div className="flex">
                                    <div className="w-44 shrink-0 flex items-center pl-3 text-[10px] font-black uppercase text-indigo-300 tracking-wider font-display border-r border-white/5">
                                      Shift vs Date
                                    </div>
                                    <div className="flex-1 flex gap-1.5 pl-3">
                                      {activeDisplayDates.map(dateStr => {
                                        const d = new Date(dateStr);
                                        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                                        const dayNum = d.getDate();
                                        return (
                                          <div key={dateStr} className="flex-1 text-center bg-slate-900/30 py-1.5 rounded-xl border border-white/5 shadow-sm">
                                            <p className="text-[9px] text-indigo-300 uppercase font-black tracking-wider leading-none">{dayLabel}</p>
                                            <p className="text-xs font-black text-slate-200 mt-1">{dayNum}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Matrix rows */}
                                  {[
                                    { key: 'morning', label: '🌅 Morning Shift', target: heatmapMorningTarget, term: 'M' },
                                    { key: 'afternoon', label: '☀️ Afternoon Shift', target: heatmapAfternoonTarget, term: 'A' },
                                    { key: 'night', label: '🌙 Night Shift', target: heatmapNightTarget, term: 'N' },
                                    { key: 'total', label: '📊 Total Staff', target: heatmapMorningTarget + heatmapAfternoonTarget + heatmapNightTarget, term: 'All' }
                                  ].map(row => {
                                    return (
                                      <div key={row.key} className="flex items-stretch">
                                        {/* Left Row Title & Header */}
                                        <div className="w-44 shrink-0 flex flex-col justify-center text-left pl-3 py-1 bg-slate-900/30 border-r border-white/5 rounded-l-xl select-none">
                                          <p className="text-xs font-black text-slate-200 font-display">{row.label}</p>
                                          <p className="text-[8px] text-indigo-200/60 font-medium">Target: {row.target} Agent{row.target !== 1 ? 's' : ''}</p>
                                        </div>

                                        {/* Heatmap Cell Grids */}
                                        <div className="flex-1 flex gap-1.5 pl-3">
                                          {activeDisplayDates.map(dateStr => {
                                            // @ts-ignore
                                            const coverage = getCoverageForDate(dateStr)[row.key];
                                            const count = coverage.count;
                                            const target = row.target;
                                            const ratio = count / target;

                                            // Decide color gradient classes
                                            let cellStyle = "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-inner";
                                            let statusText = "Critically Understaffed";

                                            if (ratio >= 1.0) {
                                              cellStyle = "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/5";
                                              statusText = "Optimal Staffing";
                                            } else if (ratio >= 0.5) {
                                              cellStyle = "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30";
                                              statusText = "Sufficient";
                                            } else if (ratio > 0.0) {
                                              cellStyle = "bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30";
                                              statusText = "Understaffed";
                                            }

                                            return (
                                              <div
                                                key={dateStr}
                                                className={`flex-1 min-h-[44px] relative group flex flex-col items-center justify-center rounded-xl transition-all select-none duration-150 cursor-help ${cellStyle}`}
                                              >
                                                <span className="text-[11px] font-extrabold tracking-tight">{count}/{target}</span>
                                                <span className="text-[7.5px] uppercase tracking-widest leading-none font-bold opacity-60 mt-0.5">{row.term}</span>

                                                {/* Tooltip listing agents */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 hidden group-hover:block bg-slate-950 border border-indigo-500/30 text-slate-100 rounded-xl p-3 shadow-2xl z-50 text-[10px] leading-relaxed backdrop-blur-md">
                                                  <p className="font-extrabold text-indigo-300 border-b border-indigo-500/20 pb-0.5 mb-1.5 flex items-center justify-between">
                                                    <span>📋 Coverage Details</span>
                                                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono uppercase tracking-widest">{row.term}</span>
                                                  </p>
                                                  
                                                  <p className="text-slate-400 text-[9px] mb-1 font-sans">{statusText} ({count} of {target} agents scheduled)</p>
                                                  <p className="text-slate-500 text-[8.5px] uppercase tracking-wider font-extrabold pb-0.5 border-b border-white/5 mt-2">Active Agents:</p>
                                                  {coverage.agents.length === 0 ? (
                                                    <p className="text-slate-400 italic mt-1 font-mono">No agents scheduled</p>
                                                  ) : (
                                                    <div className="max-h-24 overflow-y-auto mt-1 space-y-0.5 font-mono">
                                                      {coverage.agents.map((name: string, idx2: number) => (
                                                        <div key={idx2} className="flex items-center gap-1 text-slate-300">
                                                          <span className="text-emerald-400">●</span>
                                                          <span className="font-bold">{name}</span>
                                                          <span className="text-[8px] text-slate-500">({getAgentLOB(name)})</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Quick Stats Insights Bar & Legend */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-white/5 text-[10px] text-slate-400">
                                {/* Heatmap Legend */}
                                <div className="flex flex-wrap gap-3 items-center">
                                  <span className="font-bold text-slate-300">Keys:</span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block text-[7px] text-center font-bold">✓</span>
                                    Optimal (100%+)
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded bg-amber-500/15 border border-amber-500/35 inline-block text-[7px] text-center font-bold">!</span>
                                    Sufficient (50%+)
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded bg-orange-500/15 border border-orange-500/35 inline-block text-[7px] text-center font-bold">⚠</span>
                                    Understaffed (&lt;50%)
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded bg-rose-500/10 border border-rose-500/30 inline-block text-[7px] text-center font-bold">✗</span>
                                    0 Coverage
                                  </span>
                                </div>

                                {/* Automated Warning Alert ticker */}
                                {(() => {
                                  const understaffedEntries: { date: string; label: string }[] = [];
                                  activeDisplayDates.forEach(d => {
                                    const cov = getCoverageForDate(d);
                                    if (cov.morning.count < cov.morning.target) understaffedEntries.push({ date: d, label: 'Morning' });
                                    if (cov.afternoon.count < cov.afternoon.target) understaffedEntries.push({ date: d, label: 'Afternoon' });
                                    if (cov.night.count < cov.night.target) understaffedEntries.push({ date: d, label: 'Night' });
                                  });

                                  if (understaffedEntries.length === 0) {
                                    return (
                                      <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-sans">
                                        ✓ Optimal Coverage Across Display Horizon
                                      </span>
                                    );
                                  }

                                  return (
                                    <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/5 border border-amber-500/15 px-2.5 py-1 rounded-xl max-w-sm truncate text-left font-sans" title={understaffedEntries.map(e => `${formatDateNice(e.date)} (${e.label})`).join(', ')}>
                                      ⚠️ Understaffed on {understaffedEntries.length} shift{understaffedEntries.length > 1 ? 's' : ''}! ({formatDateNice(understaffedEntries[0].date)}: {understaffedEntries[0].label})
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Desktop Matrix Grid View */}
                        <div className="hidden lg:block overflow-x-auto border border-white/5 rounded-2xl bg-black/45">
                          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-200 w-52 font-display bg-[#1e1e1e]/40 backdrop-blur-lg border-r border-white/5 shadow-md sticky left-0 z-10">
                                  Agent Name
                                </th>
                                {activeDisplayDates.map(dateStr => {
                                  // Parse date
                                  const d = new Date(dateStr);
                                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                                  const dayNum = d.getDate();
                                  const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                                  return (
                                    <th key={dateStr} className="px-3 py-3 text-center border-r border-white/5 min-w-[90px]">
                                      <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">{dayName}</p>
                                      <p className="text-base font-black text-slate-100">{dayNum}</p>
                                      <p className="text-[9px] text-slate-400">{monthName}</p>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {visibleAgents.length === 0 ? (
                                <tr>
                                  <td colSpan={activeDisplayDates.length + 1} className="text-center py-8 text-xs text-slate-400 italic">
                                    No agents match your filter criteria.
                                  </td>
                                </tr>
                              ) : (
                                visibleAgents.map(agentName => (
                                  <tr key={agentName} className="border-b border-white/5 hover:bg-slate-700 transition-all">
                                    <td className="px-5 py-3 text-xs font-bold text-slate-100 font-sans bg-[#1e1e1e]/40 backdrop-blur-lg border-r border-white/5 shadow-sm sticky left-0 z-10 truncate min-w-[140px]">
                                      {agentName}
                                      <span className="block text-[8px] text-slate-400 font-normal lowercase tracking-wide font-sans">{getAgentLOB(agentName)}</span>
                                    </td>
                                    {activeDisplayDates.map(dateStr => {
                                      const findShift = schedules.find(s => s && s.agentName && s.agentName?.toLowerCase() === (agentName || '').toLowerCase() && s.date === dateStr);
                                      const userProfile = registeredUsers.find(u => u && u.name && u?.name?.toLowerCase() === (agentName || '').toLowerCase());
                                      const profileShift = userProfile?.assignedShifts?.[dateStr];
                                      const label = findShift ? findShift.shiftLabel : (profileShift || 'Not Scheduled');
                                      const style = getShiftBadgeStyle(label);
                                      return (
                                        <td 
                                          key={dateStr} 
                                          onClick={() => {
                                            if (isSuperAdmin && findShift) setSelectedShiftForActivities({...findShift});
                                          }}
                                          className={`p-1 border-r border-white/5 hover:bg-slate-700/40 transition-all relative group ${isSuperAdmin && findShift ? 'cursor-pointer hover:ring-1 ring-inset ring-indigo-500/50' : 'cursor-help'}`}
                                        >
                                          <div className={`mx-auto rounded-lg px-2 py-2 text-center border text-[10px] font-bold ${style.bg} transition-all flex items-center justify-center gap-1 relative overflow-hidden`}>
                                            <span className="relative z-10">{style.display}</span>
                                            {findShift?.shiftNotes && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0 relative z-10" />
                                            )}
                                            {findShift?.activities && findShift.activities.length > 0 && (
                                              <div className="absolute bottom-0 left-0 right-0 h-1 flex bg-slate-900/40">
                                                {findShift.activities.map((a, i) => (
                                                  <div key={i} className={`flex-1 h-full ${a.label === 'Break' ? 'bg-amber-400' : a.label === 'Lunch' ? 'bg-orange-500' : typeof a.label === 'string' && a.label.includes('Meeting') ? 'bg-indigo-500' : 'bg-cyan-500'}`} title={a.label} />
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          {(findShift?.shiftNotes || (findShift?.activities && findShift.activities.length > 0) || isSuperAdmin) && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-slate-900 border border-indigo-400/40 text-slate-100 rounded-xl p-3 shadow-2xl z-50 text-[10px] leading-relaxed backdrop-blur-md">
                                              <p className="font-extrabold text-indigo-300 border-b border-indigo-400/20 pb-0.5 mb-1.5 flex items-center justify-between font-display">
                                                <span>📌 Details</span>
                                                <span className="text-slate-400 font-mono scale-75">{dateStr}</span>
                                              </p>
                                              
                                              {findShift?.shiftNotes && (
                                                <p className="text-slate-300 font-sans break-words mb-2 italic">"{findShift.shiftNotes}"</p>
                                              )}
                                              
                                              {findShift?.activities && findShift.activities.length > 0 && (
                                                <div className="space-y-1 mb-2">
                                                  <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Intraday Timeline:</p>
                                                  {[...findShift.activities].sort((a,b)=>a.startTime.localeCompare(b.startTime)).map((act, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 justify-between bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                                                       <span className="font-mono text-[9px] text-indigo-200">{act.startTime}-{act.endTime}</span>
                                                       <span className="font-bold text-slate-300 truncate">{act.label}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                              
                                              {isSuperAdmin && findShift && (
                                                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest text-center mt-2 bg-emerald-500/10 border border-emerald-500/20 py-0.5 rounded">
                                                  Click to edit intervals
                                                </p>
                                              )}
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-400/40"></div>
                                            </div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Grid Layout list of cards */}
                        <div className="block lg:hidden space-y-4">
                          {visibleAgents.length === 0 ? (
                            <p className="text-center py-8 text-xs text-slate-400 italic">No agents match your filter criteria.</p>
                          ) : (
                            visibleAgents.map(agentName => {
                              const agentShifts = schedules.filter(s => s && s.agentName && s.agentName?.toLowerCase() === (agentName || '').toLowerCase() && activeDisplayDates.includes(s.date));
                              return (
                                <div key={agentName} className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl space-y-2">
                                  <p className="text-xs font-bold text-slate-100 border-b border-white/5 pb-1 font-display flex justify-between items-center">
                                    <span>{agentName}</span>
                                    <span className="text-[9px] text-slate-400 font-normal lowercase tracking-wide bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-lg">{getAgentLOB(agentName)}</span>
                                  </p>
                                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                                    {activeDisplayDates.map(dateStr => {
                                      const d = new Date(dateStr);
                                      const dayLabel = `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;

                                      const findShift = agentShifts.find(s => s.date === dateStr);
                                      const userProfile = registeredUsers.find(u => u && u.name && u?.name?.toLowerCase() === (agentName || '').toLowerCase());
                                      const profileShift = userProfile?.assignedShifts?.[dateStr];
                                      const label = findShift ? findShift.shiftLabel : (profileShift || 'Not Scheduled');
                                      const style = getShiftBadgeStyle(label);

                                      return (
                                        <div 
                                          key={dateStr} 
                                          onClick={() => {
                                            if (isSuperAdmin && findShift) setSelectedShiftForActivities({...findShift});
                                          }}
                                          className={`p-2 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between items-stretch relative ${isSuperAdmin && findShift ? 'cursor-pointer hover:border-indigo-500/50' : ''}`}
                                        >
                                          <span className="text-[9px] text-slate-400 font-medium mb-1 truncate block">{dayLabel}</span>
                                          <span className={`px-1.5 py-1 rounded border text-[9px] font-semibold text-center truncate block ${style.bg} relative overflow-hidden`}>
                                            <span className="relative z-10">{style.display}</span>
                                            {findShift?.activities && findShift.activities.length > 0 && (
                                              <div className="absolute bottom-0 left-0 right-0 h-1 flex bg-slate-900/40 opacity-70">
                                                {findShift.activities.map((a, i) => (
                                                  <div key={i} className={`flex-1 h-full ${a.label === 'Break' ? 'bg-amber-400' : a.label === 'Lunch' ? 'bg-orange-500' : typeof a.label === 'string' && a.label.includes('Meeting') ? 'bg-indigo-500' : 'bg-cyan-500'}`} />
                                                ))}
                                              </div>
                                            )}
                                          </span>
                                          {findShift?.shiftNotes && (
                                            <div className="mt-1.5 border-t border-white/5 pt-1 text-[9px] text-indigo-300 font-sans italic break-words flex items-start gap-1 leading-normal text-left">
                                              <span className="shrink-0 text-[10px]">📝</span>
                                              <span>{findShift.shiftNotes}</span>
                                            </div>
                                          )}
                                          {findShift?.activities && findShift.activities.length > 0 && (
                                            <div className="mt-1.5 border-t border-white/5 pt-1 text-[8px] text-slate-400 font-sans flex flex-col gap-0.5">
                                              {[...findShift.activities].sort((a,b)=>a.startTime.localeCompare(b.startTime)).slice(0, 2).map((act, i) => (
                                                <div key={i} className="flex justify-between">
                                                  <span className="font-mono text-slate-500">{act.startTime}</span>
                                                  <span className="truncate ml-1">{act.label}</span>
                                                </div>
                                              ))}
                                              {findShift.activities.length > 2 && <span className="text-center text-[7px] mt-0.5 bg-white/5 py-0.5 rounded">+{findShift.activities.length - 2} more</span>}
                                            </div>
                                          )}
                                          {isSuperAdmin && findShift && (
                                            <div className="mt-2 text-center">
                                              <span className="text-[7px] text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-1 py-[1px] rounded border border-indigo-500/20">Edit Intraday</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Shift legend details */}
                        <div className="flex flex-wrap justify-start gap-4 text-[10px] text-slate-400 pt-2 border-t border-white/5">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 block"></span>
                            Morning Shift: 07:00 - 16:00
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/40 block"></span>
                            Afternoon Shift: 13:00 - 22:00
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-indigo-500/20 border border-indigo-500/40 block"></span>
                            Night Shift: 22:00 - 07:00
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-white/5 border border-white/10 block"></span>
                            Off Day (Rest Day)
                          </span>
                        </div>
                      </>
                    )}
                    </div>

                    {/* P2P Shift Swap Trade Market & Trade Hub */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl shadow-sm text-slate-100 p-5 sm:p-6 shadow-2xl space-y-6 mt-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-4">
                        <div>
                          <h3 className="font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-lg font-display flex items-center gap-2">
                            <GitPullRequest className="w-5 h-5 text-indigo-400 rotate-90" />
                            P2P Shift Exchange Board
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5 font-sans">Teammates can directly declare trading availability, find coverage, or swap assignments within LOBs</p>
                        </div>
                        <div className="flex bg-black/35 rounded-xl p-1 border border-white/5 text-[9px] font-black uppercase text-indigo-300 tracking-wider">
                          Peer To Peer Market
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Interactive Trade Listing Launcher Form */}
                        <div className="bg-slate-800/[0.01] p-5 border border-white/5 rounded-2xl space-y-4 text-left">
                          <div>
                            <p className="text-xs font-black text-rose-450 uppercase tracking-widest">Publish Open Trade Offer</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Offer up one of your scheduled shifts for peer coverage</p>
                          </div>

                          <div className="space-y-3.5">
                            {/* Selected Date */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">1. Select Your Shift Event</label>
                              {(() => {
                                // Get my upcoming schedules
                                const todayISO = getLocalISOString(systemTime);
                                const myShedList = schedules
                                  .filter(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date >= todayISO)
                                  .sort((a, b) => a.date.localeCompare(b.date));
                                if (myShedList.length === 0) {
                                  return (
                                    <div className="p-2 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[10px] text-rose-300">
                                      No upcoming shifts found in your schedule.
                                    </div>
                                  );
                                }
                                return (
                                  <select
                                    value={p2pSelectedDate}
                                    onChange={(e) => setP2pSelectedDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-xs text-slate-100 outline-none cursor-pointer"
                                  >
                                    <option className="bg-slate-800 text-slate-100 "  value="">-- Choose Assigned Date --</option>
                                    {myShedList.map(s => (
                                      <option className="bg-slate-800 text-slate-100 "  key={s.id} value={s.date}>
                                        {formatDateNice(s.date)} (Your Duty: {s.shiftLabel})
                                      </option>
                                    ))}
                                  </select>
                                );
                              })()}
                            </div>

                            {/* Target Partner Agent */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">2. Targeted Trading Partner</label>
                              <select
                                value={p2pTargetAgent}
                                onChange={(e) => setP2pTargetAgent(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-xs text-slate-100 outline-none cursor-pointer"
                              >
                                <option className="bg-slate-800 text-slate-100 "  value="">-- Let Any Peer in LOB Grab It --</option>
                                {agentsList
                                  .filter(a => a?.toLowerCase() !== currentUser?.name?.toLowerCase() && getAgentLOB(a) === getAgentLOB(currentUser.name))
                                  .map(aName => (
                                    <option className="bg-slate-800 text-slate-100 "  key={aName} value={aName}>
                                      {aName} ({getAgentLOB(aName)})
                                    </option>
                                  ))}
                              </select>
                              <p className="text-[9px] text-[#22d3ee] font-medium leading-relaxed mt-0.5 font-sans">
                                * LOB filter active: Showing agents sharing your department ({getAgentLOB(currentUser.name)})
                              </p>
                            </div>

                            {/* Target Shift */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">3. Shift You Want to Gain</label>
                              <select
                                value={p2pTargetShift}
                                onChange={(e) => setP2pTargetShift(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-xs text-slate-100 outline-none cursor-pointer"
                              >
                                {SHIFTS.map(s => (
                                  <option className="bg-slate-800 text-slate-100 "  key={s.id} value={s.label}>
                                    {s.display} ({s.label})
                                  </option>
                                ))}
                                <option className="bg-slate-800 text-slate-100 "  value="Off">Rest Day (Off Day)</option>
                              </select>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">4. Optional Offer Description</label>
                              <input
                                type="text"
                                placeholder="I have a doctor appt / Need early shift..."
                                value={p2pNotes}
                                onChange={(e) => setP2pNotes(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none"
                              />
                            </div>
                            
                            <div className="pt-2">
                              <MultiAttachmentUpload photos={p2pPhotos} links={p2pLinks} onPhotosChange={setP2pPhotos} onLinksChange={setP2pLinks} photosLabel="Optional Attachment" />
                            </div>

                            <button
                              onClick={() => {
                                if (!p2pSelectedDate) {
                                  toast.error("Please select an assigned shift event first!");
                                  return;
                                }

                                const myShift = schedules.find(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date === p2pSelectedDate);
                                const myShiftLabel = myShift ? myShift.shiftLabel : 'Off';

                                const newReq: SwapRequest = {
                                  id: 'req_' + Date.now(),
                                  agentName: currentUser.name,
                                  type: 'swap',
                                  date: p2pSelectedDate,
                                  shift: myShiftLabel,
                                  swapWithAgent: p2pTargetAgent || 'Any Qualified Partner',
                                  swapWithShift: p2pTargetShift,
                                  status: p2pTargetAgent ? 'pending_partner' : 'pending',
                                  createdAt: new Date().toISOString(),
                                  notes: p2pNotes || "P2P open trade offer published from roster board",
                                  screenshot: p2pScreenshot ? p2pScreenshot : undefined, photos: p2pPhotos, links: p2pLinks,
                                  ruleViolation: false
                                };

                                const check = validateSwapRequest(p2pSelectedDate, myShiftLabel, new Date());
                                if (!check.isValid) {
                                  newReq.ruleViolation = true;
                                  newReq.violationMessage = check.message;
                                }

                                const updatedRequests = [newReq, ...requests];
                                setRequests(updatedRequests);
                                setStorageItem('sched_requests', updatedRequests);
                                setDoc(doc(db, "scheduling_requests", newReq.id), newReq).catch(console.error);

                                toast.success("Successfully published shift trade listing to board!");
                                setP2pSelectedDate('');
                                setP2pTargetAgent('');
                                setP2pNotes('');
                                setP2pScreenshot(null); setP2pPhotos([]); setP2pLinks([]);
                              }}
                              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                            >
                              <PlusCircle className="w-4 h-4 text-slate-100" />
                              Publish Trade Offer
                            </button>
                          </div>
                        </div>

                        {/* Available Trades Board Listings */}
                        <div className="xl:col-span-2 bg-[#0d0d14] p-5 border border-white/5 rounded-2xl flex flex-col justify-between space-y-4 font-sans">
                          <div className="text-left font-sans">
                            <p className="text-xs font-black text-[#22d3ee] uppercase tracking-widest font-sans">Available Trades Board Listings</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Review peer postings, accept direct proposals, or review status</p>
                          </div>

                          <div className="border border-white/5 rounded-xl bg-black/40 overflow-hidden text-left h-72 overflow-y-auto">
                            {(() => {
                              const swapRequests = requests.filter(r => r.type === 'swap') as SwapRequest[];
                              if (swapRequests.length === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 text-xs space-y-2 italic font-sans animate-pulse">
                                    <GitPullRequest className="w-8 h-8 text-indigo-400/40" />
                                    <span>No active trade proposals loaded on board</span>
                                  </div>
                                );
                              }
                              return (
                                <table className="w-full text-xs font-sans">
                                  <thead className="bg-[#1e1e2d] text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0 border-b border-white/5 font-sans">
                                    <tr>
                                      <th className="px-4 py-3 text-left">Agent Offering</th>
                                      <th className="px-4 py-3 text-left">Shift Date</th>
                                      <th className="px-4 py-3 text-left">Offering Shift</th>
                                      <th className="px-4 py-3 text-left">Targeting Partner</th>
                                      <th className="px-4 py-3 text-left">Status</th>
                                      <th className="px-4 py-3 text-right">Offer Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 font-sans">
                                    {swapRequests.map(req => {
                                      const isTargetedToMe = req.swapWithAgent.toLowerCase() === currentUser?.name?.toLowerCase() || req.swapWithAgent === 'Any Qualified Partner';
                                      const isMyListing = req.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();

                                      return (
                                        <tr key={req.id} className="hover:bg-slate-800/[0.02] transition-colors">
                                          <td className="px-4 py-3.5 font-bold text-slate-100">
                                            {req.agentName}
                                            <span className="block text-[8px] text-slate-400 font-normal lowercase">{getAgentLOB(req.agentName)}</span>
                                          </td>
                                          <td className="px-4 py-3.5 text-slate-300">{formatDateNice(req.date)}</td>
                                          <td className="px-4 py-3.5 font-mono text-indigo-300 font-semibold">{req.shift}</td>
                                          <td className="px-4 py-3.5 text-slate-350">
                                            {req.swapWithAgent}
                                            <span className="block text-[8px] text-indigo-300 font-bold lowercase">Wants: {req.swapWithShift}</span>
                                          </td>
                                          <td className="px-4 py-3.5">
                                            {req.status === 'pending_partner' ? (
                                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                Negotiation P2P
                                              </span>
                                            ) : req.status === 'pending' ? (
                                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                                Awaiting TL
                                              </span>
                                            ) : req.status === 'approved' ? (
                                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Approved
                                              </span>
                                            ) : (
                                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-slate-400 border border-white/5">
                                                {req.status}
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3.5 text-right font-sans">
                                            {req.status === 'pending_partner' && isTargetedToMe && !isMyListing ? (
                                              <div className="flex justify-end gap-1.5 font-sans">
                                                <button
                                                  onClick={() => {
                                                    handlePartnerDecision(req.id, true);
                                                    toast.success("Accepted P2P trade request! It has been submitted to TL queue.");
                                                  }}
                                                  className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold transition-all cursor-pointer font-sans"
                                                >
                                                  Accept
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    handlePartnerDecision(req.id, false);
                                                    toast.info("Declined custom trade request.");
                                                  }}
                                                  className="px-2 py-1 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded text-[10px] font-bold transition-all border border-white/5 cursor-pointer font-sans"
                                                >
                                                  Reject
                                                </button>
                                              </div>
                                            ) : isMyListing ? (
                                              <button
                                                onClick={() => {
                                                  const filtered = requests.filter(r => r.id !== req.id);
                                                  setRequests(filtered);
                                                  setStorageItem('sched_requests', filtered);
                                                  deleteDoc(doc(db, "scheduling_requests", req.id)).catch(console.error);
                                                  toast.info("Deleted your trade offer listing.");
                                                }}
                                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-300 hover:text-white rounded text-[10px] font-bold transition-all cursor-pointer font-sans"
                                              >
                                                Rescind
                                              </button>
                                            ) : (
                                              <span className="text-[10px] text-slate-500 italic font-sans">No action</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              );
                            })()}
                          </div>

                          <div className="text-[10px] text-slate-500 italic text-left font-sans">
                            * Shift trading matches rule parameters including 24-hour advance submission limit. All swaps route to Operations Leader once peers approve.
                          </div>
                        </div>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              )}

              {/* Tabby & Tamara Desk Panel, Complaints Desk Panel, & Client Comms Panel - Using the same root component but filtering locally */}
              {(activeTab === 'tabby-tamara' || activeTab === 'complaints' || activeTab === 'client-comms') && (() => {
                const isComplaintsTab = activeTab === 'complaints';
                const isClientCommsTab = activeTab === 'client-comms';
                const localSubTab = isClientCommsTab ? 'client-comms' : (isComplaintsTab ? 'complaints' : 'requests');
                
                return (
                <div id="tabby-tamara-desk-root" className="space-y-6 animate-fade-in text-left">
                  
                  {/* Header */}
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/5 pb-4">
                    <div>
                      {isClientCommsTab ? (
                        <>
                          <h2 className="text-3xl font-bold text-slate-100 font-display">Client Communication</h2>
                          <p className="text-slate-400 text-sm">Submit and monitor requests for Chat and Social Media agents.</p>
                        </>
                      ) : isComplaintsTab ? (
                        <>
                          <h2 className="text-3xl font-bold text-slate-100 font-display">Complaints Desk</h2>
                          <p className="text-slate-400 text-sm">Register, monitor, and resolve patient complaints.</p>
                        </>
                      ) : (
                        <>
                          <h2 className="text-3xl font-bold text-slate-100 font-display">Tabby & Tamara Desk</h2>
                          <p className="text-slate-400 text-sm">Submit installment requests and monitor active contact resolution timers.</p>
                        </>
                      )}
                    </div>

                    {/* Sub Navigation */}
                  </div>

                  {/* Summary Metric Cards */}
                  {localSubTab === 'requests' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* ... existing requests metrics ... */}
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Submissions</p>
                        <p className="text-2xl font-black text-slate-100">
                          {isTLOreSupport 
                            ? tabbyTamaraRequests.length 
                            : tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase()).length
                          }
                        </p>
                        <p className="text-[10px] text-indigo-300 mt-1">Logged requests in standalone storage</p>
                      </div>

                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold mb-1">⏳ Awaiting TL Confirm</p>
                        <p className="text-2xl font-black text-amber-400">
                          {isTLOreSupport
                            ? tabbyTamaraRequests.filter(r => r.status === 'not_confirmed').length
                            : tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && r.status === 'not_confirmed').length
                          }
                        </p>
                        <p className="text-[10px] text-amber-200 mt-1">Requires Team Leader review</p>
                      </div>

                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-rose-300 font-bold mb-1">📞 Confirmed / Pending Contact</p>
                        <p className="text-2xl font-black text-rose-400">
                          {isTLOreSupport
                            ? tabbyTamaraRequests.filter(r => r.status === 'confirmed' && r.customerContacted === 'not_contacted').length
                            : tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && r.status === 'confirmed' && r.customerContacted === 'not_contacted').length
                          }
                        </p>
                        <p className="text-[10px] text-rose-300 mt-1">Confirmed but client not contacted yet</p>
                      </div>

                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-1">✅ Successfully Contacted</p>
                        <p className="text-2xl font-black text-emerald-400">
                          {isTLOreSupport
                            ? tabbyTamaraRequests.filter(r => r.customerContacted === 'contacted').length
                            : tabbyTamaraRequests.filter(r => r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && r.customerContacted === 'contacted').length
                          }
                        </p>
                        <p className="text-[10px] text-emerald-300 mt-1">Installment loop completed</p>
                      </div>
                    </div>
                  ) : localSubTab === 'complaints' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-in">
                      {/* ... existing complaints metrics ... */}
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Complaints</p>
                        <p className="text-2xl font-black text-slate-100">
                          {isTLOreSupport
                            ? tabbyTamaraComplaints.length
                            : tabbyTamaraComplaints.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase()).length
                          }
                        </p>
                        <p className="text-[10px] text-pink-300 mt-1 font-sans">Registered complaints in session</p>
                      </div>

                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold mb-1">⏳ Awaiting TL Action</p>
                        <p className="text-2xl font-black text-amber-400">
                          {isTLOreSupport
                            ? tabbyTamaraComplaints.filter(c => c.status === 'pending_tl').length
                            : tabbyTamaraComplaints.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && c.status === 'pending_tl').length
                          }
                        </p>
                        <p className="text-[10px] text-amber-200 mt-1 font-sans">Pending Team Leader comment</p>
                      </div>

                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-rose-300 font-bold mb-1">📞 Pending Client Contact</p>
                        <p className="text-2xl font-black text-rose-400">
                          {isTLOreSupport
                            ? tabbyTamaraComplaints.filter(c => c.status === 'need_contact').length
                            : tabbyTamaraComplaints.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && c.status === 'need_contact').length
                          }
                        </p>
                        <p className="text-[10px] text-rose-300 mt-1 font-sans font-medium animate-pulse">Pending client contacted action</p>
                      </div>

                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-1">✅ Successfully Closed</p>
                        <p className="text-2xl font-black text-emerald-400">
                          {isTLOreSupport
                            ? tabbyTamaraComplaints.filter(c => c.status === 'closed').length
                            : tabbyTamaraComplaints.filter(c => c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && c.status === 'closed').length
                          }
                        </p>
                        <p className="text-[10px] text-emerald-300 mt-1 font-sans">Closed complaints loop</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Requests</p>
                        <p className="text-2xl font-black text-slate-100">
                          {isTLOreSupport
                            ? clientComms.length
                            : clientComms.filter(c => c.callCenterAgentName?.toLowerCase() === currentUser?.name?.toLowerCase() || c.handledBy?.toLowerCase() === currentUser?.name?.toLowerCase()).length
                          }
                        </p>
                        <p className="text-[10px] text-indigo-300 mt-1 font-sans">All communication requests in session</p>
                      </div>
                      
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold mb-1">⏳ Pending Response</p>
                        <p className="text-2xl font-black text-amber-400">
                          {isTLOreSupport
                            ? clientComms.filter(c => c.status === 'pending').length
                            : clientComms.filter(c => (c.callCenterAgentName?.toLowerCase() === currentUser?.name?.toLowerCase() || c.handledBy?.toLowerCase() === currentUser?.name?.toLowerCase()) && c.status === 'pending').length
                          }
                        </p>
                        <p className="text-[10px] text-amber-200 mt-1 font-sans">Currently awaiting Chat/Social interaction</p>
                      </div>
                    </div>
                  )}

                  {/* Core Layout Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column: Submission Form for Agents (only show if role is agent, else show TL search helper on full-width or toggle) */}
                    {currentUser?.role === 'agent' && (
                      <div className="lg:col-span-4 space-y-4">
                        {localSubTab === 'requests' ? (
                          <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl space-y-4 shadow-2xl">
                            <h3 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2 text-left">
                              <PlusCircle className="w-5 h-5 text-indigo-400" />
                              New Installment Request
                            </h3>
                            <p className="text-xs text-slate-400 leading-normal text-left">
                              Complete the fields below to submit an installment transaction request through Tabby or Tamara.
                            </p>
                            
                            <form onSubmit={handleSubmitTabbyTamara} className="space-y-4 pt-2 text-left">
                              {/* Patient Name */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Patient Name *</label>
                                <input
                                  type="text"
                                  placeholder="Enter full patient name"
                                  value={ttPatientName}
                                  onChange={(e) => setTtPatientName(e.target.value)}
                                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                                  required
                                />
                              </div>

                              {/* File Number */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">File Number (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="Patient file / folder number"
                                  value={ttFileNumber}
                                  onChange={(e) => setTtFileNumber(e.target.value)}
                                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                                />
                              </div>

                              {/* Old Customer Switch & ID Number */}
                              <div className="space-y-3.5 p-3.5 bg-white/5 border border-white/5 rounded-2xl text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-[12px] font-bold text-slate-300">Is this an Old Customer?</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={ttIsOldCustomer}
                                      onChange={(e) => setTtIsOldCustomer(e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-900/40/20 backdrop-blur-md peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-800 after:border-slate-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                  </label>
                                </div>

                                {!ttIsOldCustomer && (
                                  <div className="space-y-1.5 animate-fade-in pt-1 text-left">
                                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">ID Number *</label>
                                    <input
                                      type="text"
                                      placeholder="National ID / Iqama Number"
                                      value={ttIdNumber}
                                      onChange={(e) => setTtIdNumber(e.target.value)}
                                      className="w-full bg-black/45 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                                      required={!ttIsOldCustomer}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Price */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Price *</label>
                                <div className="relative">
                                  <span className="absolute left-[13px] top-[11.5px] text-xs font-bold text-slate-400 font-mono">SAR</span>
                                  <input
                                    type="text"
                                    placeholder="0.00"
                                    value={ttPriceWithoutTax}
                                    onChange={(e) => setTtPriceWithoutTax(e.target.value)}
                                    className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                                    required
                                  />
                                </div>
                                {ttPriceWithoutTax && !isNaN(Number(ttPriceWithoutTax)) && (
                                  <p className="text-[10px] text-indigo-300 font-medium">
                                    * Note: 5% automatically added on this price. Total: SAR {(Number(ttPriceWithoutTax) * 1.05).toFixed(2)}                                 </p>
                                )}
                              </div>

                              {/* Phone Number */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">Phone Number *</label>
                                <input
                                  type="tel"
                                  placeholder="+966 5x xxx xxxx"
                                  value={ttPhoneNumber}
                                  onChange={(e) => setTtPhoneNumber(e.target.value)}
                                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                                  required
                                />
                              </div>

                              {/* Platform selector */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Payment Platform / Type *</label>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setTtPlatform('tabby')}
                                    className={`py-2 rounded-xl text-[11px] font-black uppercase transition-all tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer ${
                                      ttPlatform === 'tabby'
                                        ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-md'
                                        : 'bg-black/25 border-white/5 text-slate-400 hover:bg-slate-700'
                                    }`}
                                  >
                                    💳 Tabby
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTtPlatform('tamara')}
                                    className={`py-2 rounded-xl text-[11px] font-black uppercase transition-all tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer ${
                                      ttPlatform === 'tamara'
                                        ? 'bg-pink-500 border-pink-400 text-slate-100 shadow-md'
                                        : 'bg-black/25 border-white/5 text-slate-400 hover:bg-slate-700'
                                    }`}
                                  >
                                    💳 Tamara
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTtPlatform('one_time_payment' as any)}
                                    className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider flex items-center justify-center gap-1 border cursor-pointer ${
                                      ttPlatform === ('one_time_payment' as any)
                                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-md'
                                        : 'bg-black/25 border-white/5 text-slate-400 hover:bg-slate-700'
                                    }`}
                                  >
                                    💰 One Time
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-1" htmlFor="tt-clinic">Clinic Name *</label>
                                <select
                                  id="tt-clinic"
                                  value={ttClinicName}
                                  onChange={(e) => setTtClinicName(e.target.value)}
                                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer focus:ring-1 focus:ring-indigo-500/30"
                                  required
                                >
                                  <option value="" className="bg-slate-800 text-slate-100 ">Select a Clinic</option>
                                  <option value="dermadent" className="bg-slate-800 text-slate-100 ">Dermadent</option>
                                  <option value="onetouch_mo3tred" className="bg-slate-800 text-slate-100 ">One Touch Mo3tred</option>
                                  <option value="onetouch_merkhnya" className="bg-slate-800 text-slate-100 ">One Touch Merkhnya</option>
                                  <option value="welltouch" className="bg-slate-800 text-slate-100 ">WellTouch</option>
                                  <option value="newedge" className="bg-slate-800 text-slate-100 ">New Edge</option>
                                </select>
                              </div>

                              {/* Notes */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Additional Notes (Optional)</label>
                                <textarea
                                  placeholder="Any special treatment, payment plan terms, etc."
                                  value={ttNotes}
                                  onChange={(e) => setTtNotes(e.target.value)}
                                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans min-h-[70px] resize-y"
                                />
                              </div>

                              <MultiAttachmentUpload photos={activePhotos} links={activeLinks} onPhotosChange={setActivePhotos} onLinksChange={setActiveLinks} photosLabel="Payment / Identity Photos" />

                              <button
                                type="submit"
                                disabled={isFormSubmitting}
                                className={`w-full py-3.5 text-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-sans shadow ${isFormSubmitting ? 'bg-indigo-800 opacity-65 pointer-events-none' : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-[0.99] shadow-indigo-500/10'}`}
                              >
                                {isFormSubmitting ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting Request...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    Submit to Team Leader
                                  </>
                                )}
                              </button>
                            </form>
                          </div>
                        ) : localSubTab === 'complaints' ? (
                          <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl space-y-4 shadow-2xl animate-fade-in">
                            <h3 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2 text-left">
                              <AlertTriangle className="w-5 h-5 text-pink-500" />
                              Log New Complaint
                            </h3>
                            <p className="text-xs text-slate-400 leading-normal text-left">
                              Register a service or clinical complaint for team evaluation and prompt resolution.
                            </p>

                            <form onSubmit={handleSubmitTabbyTamaraComplaint} className="space-y-4 pt-2 text-left">
                              {/* Patient Name */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Patient Name *</label>
                                <input
                                  type="text"
                                  placeholder="Enter patient name"
                                  value={tcPatientName}
                                  onChange={(e) => setTcPatientName(e.target.value)}
                                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-pink-500 font-sans font-medium"
                                  required
                                />
                              </div>

                              {/* File Number */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">File Number (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="File / folder reference"
                                  value={tcFileNumber}
                                  onChange={(e) => setTcFileNumber(e.target.value)}
                                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-pink-500 font-mono"
                                />
                              </div>

                              {/* Old Customer Switch */}
                              <div className="space-y-3.5 p-3.5 bg-white/5 border border-white/5 rounded-2xl text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-[12px] font-bold text-slate-300 font-sans">Is this an Old Customer?</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={tcIsOldCustomer}
                                      onChange={(e) => setTcIsOldCustomer(e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-900/40/20 backdrop-blur-md peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-800 after:border-slate-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                  </label>
                                </div>

                                {!tcIsOldCustomer && (
                                  <div className="space-y-1.5 animate-fade-in pt-1 text-left">
                                    <label className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">ID Number *</label>
                                    <input
                                      type="text"
                                      placeholder="National ID / Iqama Number"
                                      value={tcIdNumber}
                                      onChange={(e) => setTcIdNumber(e.target.value)}
                                      className="w-full bg-black/45 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                                      required={!tcIsOldCustomer}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Photo / Screenshot */}
                              <MultiAttachmentUpload photos={activePhotos} links={activeLinks} onPhotosChange={setActivePhotos} onLinksChange={setActiveLinks} photosLabel="Complaint Evidence" />

                              {/* Phone Number */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">Phone Number *</label>
                                <input
                                  type="tel"
                                  placeholder="+966 5x xxx xxxx"
                                  value={tcPhoneNumber}
                                  onChange={(e) => setTcPhoneNumber(e.target.value)}
                                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-pink-500 font-mono"
                                  required
                                />
                              </div>

                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-1" htmlFor="tc-clinic">Clinic Name *</label>
                                <select
                                  id="tc-clinic"
                                  value={tcClinicName}
                                  onChange={(e) => setTcClinicName(e.target.value)}
                                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer focus:ring-1 focus:ring-indigo-500/30"
                                  required
                                >
                                  <option value="" className="bg-slate-800 text-slate-100 ">Select a Clinic</option>
                                  <option value="dermadent" className="bg-slate-800 text-slate-100 ">Dermadent</option>
                                  <option value="onetouch_mo3tred" className="bg-slate-800 text-slate-100 ">One Touch Mo3tred</option>
                                  <option value="onetouch_merkhnya" className="bg-slate-800 text-slate-100 ">One Touch Merkhnya</option>
                                  <option value="welltouch" className="bg-slate-800 text-slate-100 ">WellTouch</option>
                                  <option value="newedge" className="bg-slate-800 text-slate-100 ">New Edge</option>
                                </select>
                              </div>

                              {/* Complaint details */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Customer Complaint / Issue Details *</label>
                                <textarea
                                  placeholder="Patient notes or description of the issue or service failure..."
                                  value={tcComplaintDetails}
                                  onChange={(e) => setTcComplaintDetails(e.target.value)}
                                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500 font-sans min-h-[80px] resize-y font-medium"
                                  required
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isFormSubmitting}
                                className={`w-full py-3.5 text-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-sans shadow ${isFormSubmitting ? 'bg-pink-900 opacity-65 pointer-events-none' : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:brightness-110 active:scale-[0.99] shadow-pink-500/10'}`}
                              >
                                {isFormSubmitting ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting Complaint...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    Submit to Management
                                  </>
                                )}
                              </button>
                            </form>
                          </div>
                        ) : (
                          getAgentLOB(currentUser.name) === 'Call Center' && (
                            <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl space-y-4 shadow-2xl animate-fade-in">
                              <h3 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2 text-left">
                                <MessageSquare className="w-5 h-5 text-indigo-400" />
                                Submit Communication Request
                              </h3>
                              <p className="text-xs text-slate-400 leading-normal text-left">
                                Submit a request for Chat or Social Media agents to contact a client and follow up.
                              </p>

                              <form onSubmit={handleSubmitClientComms} className="space-y-4 pt-2 text-left">
                                {/* Clinic Name */}
                                <div className="space-y-1 sm:col-span-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-1">Clinic Name *</label>
                                  <select
                                    value={ccClinicName}
                                    onChange={(e) => setCcClinicName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer focus:ring-1 focus:ring-indigo-500/30"
                                    required
                                  >
                                    <option value="" className="bg-slate-800 text-slate-100 ">Select a Clinic</option>
                                    <option value="dermadent" className="bg-slate-800 text-slate-100 ">Dermadent</option>
                                    <option value="onetouch_mo3tred" className="bg-slate-800 text-slate-100 ">One Touch Mo3tred</option>
                                  <option value="onetouch_merkhnya" className="bg-slate-800 text-slate-100 ">One Touch Merkhnya</option>
                                    <option value="welltouch" className="bg-slate-800 text-slate-100 ">WellTouch</option>
                                    <option value="newedge" className="bg-slate-800 text-slate-100 ">New Edge</option>
                                  </select>
                                </div>

                                {/* Phone Number */}
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">Phone Number *</label>
                                  <input
                                    type="tel"
                                    placeholder="+966 5x xxx xxxx"
                                    value={ccPhoneNumber}
                                    onChange={(e) => setCcPhoneNumber(e.target.value)}
                                    className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                                    required
                                  />
                                </div>

                                {/* Language */}
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Language Priority *</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setCcLanguage('Arabic')}
                                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center border cursor-pointer ${
                                        ccLanguage === 'Arabic'
                                          ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                                          : 'bg-black/25 border-white/5 text-slate-400'
                                      }`}
                                    >
                                      Arabic
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCcLanguage('English')}
                                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center border cursor-pointer ${
                                        ccLanguage === 'English'
                                          ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                                          : 'bg-black/25 border-white/5 text-slate-400'
                                      }`}
                                    >
                                      English
                                    </button>
                                  </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Inquiry Details / Notes *</label>
                                  <textarea
                                    placeholder="Explain the required follow up..."
                                    value={ccNotes}
                                    onChange={(e) => setCcNotes(e.target.value)}
                                    className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans min-h-[80px] resize-y font-medium"
                                    required
                                  />
                                </div>

                                <MultiAttachmentUpload photos={activePhotos} links={activeLinks} onPhotosChange={setActivePhotos} onLinksChange={setActiveLinks} photosLabel="Customer Inquiry Screenshot" />

                                <button
                                  type="submit"
                                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-[0.99] text-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-sans shadow shadow-indigo-500/10"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  {isFormSubmitting ? "Submitting..." : "Submit Request"}
                                </button>
                              </form>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Right Column: Listing & Administration */}
                    <div className={`${currentUser?.role === 'agent' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4 text-left`}>
                      <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl space-y-4 shadow-2xl">
                        
                        {/* Filters and search Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                          <h3 className="text-lg font-bold text-slate-100 font-sans flex items-center gap-2">
                            {localSubTab === 'requests' ? (
                              <>
                                <ClipboardList className="w-5 h-5 text-indigo-400" />
                                {isTLOreSupport ? 'All Submitted Requests' : 'My Requests and Tasks'}
                              </>
                            ) : localSubTab === 'complaints' ? (
                              <>
                                <AlertTriangle className="w-5 h-5 text-pink-500" />
                                {isTLOreSupport ? 'All Logged Complaints' : 'My Complaints and Actions'}
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-5 h-5 text-indigo-400" />
                                {isTLOreSupport ? 'All Communication Requests' : 'My Communication Requests'}
                              </>
                            )}
                          </h3>

                          {/* Search bar inside */}
                          <div className="relative w-full md:w-64">
                            <span className="absolute left-3 top-2.5 text-slate-400">
                              <Search className="w-4 h-4" />
                            </span>
                            <input
                              type="text"
                              placeholder={localSubTab === 'client-comms' ? "Search clinic, phone..." : "Search patient, phone, file..."}
                              value={ttSearchQuery}
                              onChange={(e) => setTtSearchQuery(e.target.value)}
                              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                            />
                          </div>
                        </div>

                        {/* Dropdown Filters and status segment selection buttons */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-left">
                          <span className="text-slate-400 font-semibold font-sans">Filter status:</span>
                          <div className="flex items-center gap-1.5 bg-black/35 p-1 rounded-xl border border-white/5">
                            <button
                              onClick={() => setTtFilterStatus('all')}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer ${ttFilterStatus === 'all' ? 'bg-indigo-600 text-white font-sans' : 'text-slate-400 hover:text-slate-100 font-sans'}`}
                            >
                              <History className="w-3 h-3" />
                              All History
                            </button>
                            <button
                              onClick={() => setTtFilterStatus('not_confirmed')}
                              className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer ${ttFilterStatus === 'not_confirmed' ? 'bg-amber-400/20 text-amber-300 border border-amber-500/20 font-sans' : 'text-slate-400 hover:text-slate-100 font-sans'}`}
                            >
                              {localSubTab === 'requests' ? '⏳ Pending Confirm' : localSubTab === 'complaints' ? '⏳ Pending TL' : '⏳ Pending Contact'}
                            </button>
                            <button
                              onClick={() => setTtFilterStatus('confirmed')}
                              className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer ${ttFilterStatus === 'confirmed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20 font-sans' : 'text-slate-400 hover:text-slate-100 font-sans'}`}
                            >
                              {localSubTab === 'requests' ? '📞 Pending Contact' : localSubTab === 'complaints' ? '📞 Pending Contact' : '✅ Contacted'}
                            </button>
                            {localSubTab !== 'client-comms' && (
                              <button
                                onClick={() => setTtFilterStatus('contacted')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer ${ttFilterStatus === 'contacted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-sans' : 'text-slate-400 hover:text-slate-100 font-sans'}`}
                              >
                                {localSubTab === 'requests' ? '✅ Contacted' : '✅ Closed'}
                              </button>
                            )}
                          </div>

                          <span className="text-slate-400 font-semibold font-sans ml-auto">
                            {localSubTab === 'requests' ? 'Platform:' : 'Clinic:'}
                          </span>
                          {localSubTab !== 'requests' ? (
                            <select
                              value={tcFilterClinic}
                              onChange={(e) => setTcFilterClinic(e.target.value)}
                              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-2.5 py-1 text-[11px] text-slate-100 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
                            >
                              <option value="all" className="bg-slate-800 text-slate-100 ">All Clinics</option>
                              <option value="dermadent" className="bg-slate-800 text-slate-100 ">Dermadent</option>
                              <option value="onetouch_mo3tred" className="bg-slate-800 text-slate-100 ">One Touch Mo3tred</option>
                                  <option value="onetouch_merkhnya" className="bg-slate-800 text-slate-100 ">One Touch Merkhnya</option>
                              <option value="welltouch" className="bg-slate-800 text-slate-100 ">WellTouch</option>
                              <option value="newedge" className="bg-slate-800 text-slate-100 ">New Edge</option>
                            </select>
                          ) : (
                            <select
                              value={ttFilterProvider}
                              onChange={(e) => setTtFilterProvider(e.target.value as any)}
                              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-2.5 py-1 text-[11px] text-slate-100 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
                            >
                              <option value="all" className="bg-slate-800 text-slate-100 ">All Providers</option>
                              <option value="tabby" className="bg-slate-800 text-slate-100 ">Tabby Only</option>
                              <option value="tamara" className="bg-slate-800 text-slate-100 ">Tamara Only</option>
                              <option value="one_time_payment" className="bg-slate-800 text-slate-100 ">One Time Payment</option>
                            </select>
                          )}
                        </div>




                        {/* List rendering */}
                        <div className="space-y-4 pt-2 text-left">
                          {localSubTab === 'requests' ? (
                            <>
                              {tabbyTamaraRequests
                                .filter(r => {
                                  const isMyRequest = r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
                                  if (!isTLOreSupport && !isMyRequest) return false;

                                  const matchesSearch = 
                                    (r.patientName || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (r.fileNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (r.phoneNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (r.agentName || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (r.idNumber && r.idNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()));

                                  const matchesStatus = 
                                    ttFilterStatus === 'all' ||
                                    (ttFilterStatus === 'not_confirmed' && r.status === 'not_confirmed') ||
                                    (ttFilterStatus === 'confirmed' && r.status === 'confirmed' && r.customerContacted !== 'contacted') ||
                                    (ttFilterStatus === 'contacted' && r.customerContacted === 'contacted');

                                  const matchesProvider = 
                                    ttFilterProvider === 'all' || r.platform === ttFilterProvider;

                                  return matchesSearch && matchesStatus && matchesProvider;
                                }).length === 0 ? (
                                <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-slate-800/[0.02] space-y-2">
                                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                                    <Wallet className="w-6 h-6" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-100 font-sans">No installment requests matching criteria.</p>
                                  <p className="text-xs text-slate-400">Requests will be logged here with live status loops and response timers.</p>
                                </div>
                              ) : (
                                
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {tabbyTamaraRequests
                                    .filter(r => {
                                      const isMyRequest = r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
                                      if (!isTLOreSupport && !isMyRequest) return false;

                                      const matchesSearch = 
                                        (r.patientName || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (r.fileNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (r.phoneNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (r.agentName || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (r.idNumber && r.idNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()));

                                      const matchesStatus = 
                                        ttFilterStatus === 'all' ||
                                        (ttFilterStatus === 'not_confirmed' && r.status === 'not_confirmed') ||
                                        (ttFilterStatus === 'confirmed' && r.status === 'confirmed' && r.customerContacted !== 'contacted') ||
                                        (ttFilterStatus === 'contacted' && r.customerContacted === 'contacted');

                                      const matchesProvider = 
                                        ttFilterProvider === 'all' || r.platform === ttFilterProvider;

                                      return matchesSearch && matchesStatus && matchesProvider;
                                    })
                                    .map((req) => {
                                      const isPendingContact = req.status === 'confirmed' && req.customerContacted === 'not_contacted';
                                      const isAwaitingConfirm = req.status === 'not_confirmed';
                                      const isCompleted = req.customerContacted === 'contacted';
                                      
                                      return (
                                        <div
                                          key={req.id}
                                          className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-md overflow-hidden bg-[#1e1e1e]/40 backdrop-blur-lg/60 ${
                                            isPendingContact 
                                              ? 'border-rose-500/30 bg-gradient-to-b from-rose-950/10 to-transparent animate-pulse' 
                                              : isAwaitingConfirm 
                                              ? 'border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent' 
                                              : 'border-white/5'
                                          }`}
                                        >
                                          {/* Platform Indicator Strip */}
                                          <div className="absolute top-0 right-0 left-0 h-1.5 flex animate-pulse">
                                            <div className={`w-full ${req.platform === 'tabby' ? 'bg-amber-400' : req.platform === 'tamara' ? 'bg-pink-500' : 'bg-emerald-400'}`} />
                                          </div>

                                          {/* Card header */}
                                          <div className="flex justify-between items-start gap-2 pt-1 text-left">
                                            <div className="space-y-0.5">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                                  req.platform === 'tabby' 
                                                    ? 'bg-amber-400/10 border-amber-300/[0.15] text-amber-300' 
                                                    : req.platform === 'tamara'
                                                    ? 'bg-pink-500/10 border-pink-400/[0.15] text-pink-400'
                                                    : 'bg-emerald-400/10 border-emerald-300/[0.15] text-emerald-300'
                                                }`}>
                                                  {req.platform === 'one_time_payment' ? '💰 One Time' : `💳 ${req.platform}`}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono font-bold">File: {req.fileNumber || 'N/A'}</span>
                                                {req.clinicName && (
                                                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300">
                                                    🏥 {req.clinicName}
                                                  </span>
                                                )}
                                              </div>
                                              <h4 className="text-sm font-black text-slate-100 font-sans mt-1">{req.patientName}</h4>
                                            </div>

                                            {/* Status Badges */}
                                            <div className="text-right flex flex-col items-end gap-1 shrink-0 font-sans">
                                              {req.status === 'not_confirmed' ? (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md">
                                                  ⏳ PENDING CONFIRM
                                                </span>
                                              ) : (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                  👑 CONFIRMED
                                                </span>
                                              )}

                                              {req.customerContacted === 'contacted' ? (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md">
                                                  📞 CONTACTED
                                                </span>
                                              ) : req.status === 'confirmed' ? (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded-md animate-pulse">
                                                  📞 CONTACT PENDING
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>

                                          {/* Core Detail Grid */}
                                          <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl space-y-2 text-xs text-left">
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Submitting Agent:</p>
                                                <p className="text-slate-200 font-bold truncate">{req.agentName}</p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Customer Type:</p>
                                                <p className="text-slate-200 font-bold font-sans">
                                                  {req.isOldCustomer ? '👤 Old Customer' : '🆕 New Customer'}
                                                </p>
                                              </div>
                                            </div>

                                            {!req.isOldCustomer && req.idNumber && (
                                              <div className="border-t border-white/5 pt-1">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">ID Number:</p>
                                                <p className="text-slate-200 font-mono font-bold">{req.idNumber}</p>
                                              </div>
                                            )}

                                            <div className="border-t border-white/5 pt-1.5 grid grid-cols-2 gap-2">
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Price:</p>
                                                <p className="text-emerald-400 font-mono font-extrabold font-sans text-xs">
                                                  SAR {req.priceWithoutTax} <span className="text-[10px] text-indigo-400 font-medium ml-1">({!isNaN(Number(req.priceWithoutTax)) ? (Number(req.priceWithoutTax) * 1.05).toFixed(2) : '-'})</span>
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Phone number:</p>
                                                <p className="text-slate-200 font-mono font-bold truncate">{req.phoneNumber}</p>
                                              </div>
                                            </div>

                                            {req.notes && (
                                              <div className="border-t border-white/5 pt-1 text-[11px] text-slate-300 italic">
                                                <span className="font-bold text-slate-400 not-italic">Notes: </span>"{req.notes}"
                                              </div>
                                            )}

                                            <AttachmentsDisplay photos={req.photos} links={req.links} />
{req.paymentScreenshot && (
                                              <div className="border-t border-white/5 pt-2">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                  <ImageIcon className="w-3 h-3 text-indigo-400" />
                                                  Screenshot
                                                </p>
                                                <img 
                                                  src={req.paymentScreenshot} 
                                                  alt="Payment Screenshot" 
                                                  className="w-full h-24 object-cover rounded-lg border border-white/10 cursor-zoom-in hover:brightness-110 transition-all"
                                                  onClick={() => window.open(req.paymentScreenshot, '_blank')}
                                                />
                                              </div>
                                            )}

                                            {req.paymentLink && (
                                              <div className="border-t border-white/5 pt-2 flex justify-between items-center bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                                                <div className="space-y-0.5 truncate mr-2">
                                                  <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold">💳 Payment Link / URL:</p>
                                                  <p className="text-xs text-slate-200 truncate font-mono">{req.paymentLink}</p>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0">
                                                  <button
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(req.paymentLink || '');
                                                      toast.success('Payment link copied!');
                                                    }}
                                                    className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                  >
                                                    <Copy className="w-3.5 h-3.5" />
                                                    Copy
                                                  </button>
                                                  <a
                                                    href={req.paymentLink.startsWith('http') ? req.paymentLink : `https://${req.paymentLink}`}
                                                    target="_blank"
                                                    referrerPolicy="no-referrer"
                                                    className="px-2 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/20 rounded-lg text-indigo-300 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                  >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Open
                                                  </a>
                                                </div>
                                              </div>
                                            )}

                                            {req.tlNotes && (
                                              <div className="border-t border-amber-500/20 pt-1.5 text-xs text-amber-300">
                                                <p className="text-[9px] text-amber-400 uppercase tracking-wider mb-0.5 font-bold">💬 Team Leader Notes / Response:</p>
                                                <p className="bg-[#fbbf24]/5 p-2 rounded-lg border border-amber-500/10 text-slate-200 leading-normal font-sans">
                                                  {req.tlNotes}
                                                </p>
                                              </div>
                                            )}

                                            {req.tlLinks && (
                                              <div className="border-t border-white/5 pt-1.5 text-xs">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1 font-bold">🔗 TL Provided Links:</p>
                                                <div className="flex flex-wrap gap-2">
                                                  {req.tlLinks.split(',').map((link, idx) => {
                                                    const trimmed = link.trim();
                                                    if (!trimmed) return null;
                                                    const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
                                                    return (
                                                      <span key={idx} className="flex items-center gap-1">
                                                        <a
                                                          href={href}
                                                          target="_blank"
                                                          referrerPolicy="no-referrer"
                                                          className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                        >
                                                          <ExternalLink className="w-3 h-3" />
                                                          Link {idx + 1}                                                       </a>
                                                        <button
                                                          onClick={() => {
                                                            navigator.clipboard.writeText(trimmed);
                                                            toast.success('Link copied!');
                                                          }}
                                                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                                                          title="Copy Link"
                                                        >
                                                          <Copy className="w-3 h-3" />
                                                        </button>
                                                      </span>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Inline TL Reply Input Form */}
                                          {activeFintechHandlingId === req.id && isTLOreSupport && (
                                            <div className="p-4 bg-slate-900/90 border border-amber-500/20 rounded-xl space-y-3.5 text-left animate-fade-in mt-2 mb-2">
                                              <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">Payment Link / URL *</label>
                                                <input
                                                  type="text"
                                                  placeholder="https://..."
                                                  value={tlFintechPaymentLink}
                                                  onChange={(e) => setTlFintechPaymentLink(e.target.value)}
                                                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                                                />
                                              </div>

                                              <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">TL Notes & Guidance (Optional)</label>
                                                <textarea
                                                  placeholder="Add notes, pointers, or remarks..."
                                                  value={tlFintechNotes}
                                                  onChange={(e) => setTlFintechNotes(e.target.value)}
                                                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans min-h-[60px]"
                                                />
                                              </div>

                                              <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">Links / anything else (Optional, comma-separated)</label>
                                                <input
                                                  type="text"
                                                  placeholder="https://link1.com, https://link2.com"
                                                  value={tlFintechLinks}
                                                  onChange={(e) => setTlFintechLinks(e.target.value)}
                                                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                                                />
                                              </div>

                                              <div className="flex gap-2 justify-end">
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveFintechHandlingId(null)}
                                                  className="px-2.5 py-1.5 hover:bg-slate-850 rounded-lg text-[10px] font-bold text-slate-400 cursor-pointer"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    handleConfirmTabbyTamara(req.id, tlFintechPaymentLink, tlFintechNotes, tlFintechLinks, 'rejected');
                                                    setActiveFintechHandlingId(null);
                                                  }}
                                                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/20 text-rose-300 text-[10px] font-bold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                                                >
                                                  Reject
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    handleConfirmTabbyTamara(req.id, tlFintechPaymentLink, tlFintechNotes, tlFintechLinks, 'confirmed');
                                                    setActiveFintechHandlingId(null);
                                                  }}
                                                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 text-slate-950 text-[10px] font-black font-sans rounded-lg shadow cursor-pointer transition-all flex items-center gap-1"
                                                >
                                                  Confirm & Approve
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Confirmation or tracking Timers */}
                                          {req.status === 'confirmed' && (
                                            <div className="p-3 bg-black/15 rounded-xl border border-white/[0.02] flex items-center justify-between text-xs font-sans">
                                              <div className="space-y-0.5 text-left">
                                                <p className="text-[9px] text-slate-400 uppercase">Confirmed by {req.confirmedBy}:</p>
                                                <p className="text-[10px] text-slate-300">{new Date(req.confirmedAt || req.createdAt).toLocaleString()}</p>
                                              </div>

                                              <div className="text-right space-y-0.5">
                                                <p className="text-[9px] text-slate-400 uppercase">{isCompleted ? 'Turnaround' : 'Pending Contact time'}:</p>
                                                <p className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                                                  isCompleted 
                                                    ? 'text-emerald-400 bg-emerald-500/10' 
                                                    : 'text-rose-400 bg-rose-500/10 animate-pulse'
                                                }`}>
                                                  {getElapsedTimerString(req.confirmedAt || req.createdAt, req.contactedAt)}
                                                </p>
                                              </div>
                                            </div>
                                          )}

                                          {req.status === 'rejected' && (
                                            <div className="p-3 bg-rose-950/10 rounded-xl border border-rose-500/10 flex items-center justify-between text-xs font-sans">
                                              <div className="space-y-0.5 text-left text-rose-300">
                                                <p className="text-[9px] text-rose-400 uppercase">Rejected by {req.confirmedBy || 'TL'}:</p>
                                                <p className="text-[10px]">{req.confirmedAt ? new Date(req.confirmedAt).toLocaleString() : new Date(req.createdAt).toLocaleString()}</p>
                                              </div>
                                            </div>
                                          )}

                                          {/* Action Footers */}
                                          <div className="flex gap-2 justify-end pt-1 border-t border-white/5">
                                            {/* DELETE Option */}
                                            {isSuperAdmin && (
                                              <button
                                                onClick={() => handleDeleteTabbyTamara(req.id)}
                                                className="mr-auto px-2 py-1.5 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/10 rounded-lg text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                title="Delete Request"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}

                                            {isWithinFiveMinutes(req.createdAt) && (
                                              <button
                                                onClick={() => setEditingItem({ type: 'tt_request', id: req.id, data: { ...req } })}
                                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                title={`Edit request (${getRemainingEditTimeStr(req.createdAt)})`}
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit ({getRemainingEditTimeStr(req.createdAt)})
                                              </button>
                                            )}

                                            {/* Copy Option for Tabby/Tamara Request */}
                                            {isTLOreSupport && (
                                              <button
                                                onClick={() => {
                                                  const details = `*Platform:* ${req.platform}
*File Number:* ${req.fileNumber || 'N/A'}
*Patient Name:* ${req.patientName}
*ID/ID Number:* ${req.idNumber || 'N/A'}
*Phone Number:* ${req.phoneNumber}
*Price (Without Tax):* SAR ${req.priceWithoutTax}
*Notes:*
_ ${req.notes || 'None'} _`;
                                                  navigator.clipboard.writeText(details);
                                                  toast.success('Payment request details copied!');
                                                }}
                                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-100 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                title="Copy Payment details"
                                              >
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy
                                              </button>
                                            )}

                                            {/* TL Response trigger */}
                                            {isTLOreSupport && activeFintechHandlingId !== req.id && (
                                              <button
                                                onClick={() => {
                                                  setActiveFintechHandlingId(req.id);
                                                  setTlFintechPaymentLink(req.paymentLink || '');
                                                  setTlFintechNotes(req.tlNotes || '');
                                                  setTlFintechLinks(req.tlLinks || '');
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-sans font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                              >
                                                👑 Reply & Review
                                              </button>
                                            )}

                                            

                                            {/* Tooltip or undo actions */}
                                            {currentUser?.role === 'agent' && req.status === 'confirmed' && req.customerContacted === 'contacted' && (
                                              <button
                                                onClick={() => handleContactTabbyTamara(req.id, 'not_contacted')}
                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold font-sans text-[10px] rounded-lg border border-white/5 transition-all cursor-pointer flex items-center gap-1"
                                              >
                                                Undo Contact
                                              </button>
                                            )}
                                          </div>
                                          
                                          <div className="w-full mt-3 pt-3 border-t border-white/5">
                                            <RequestReplyThread request={req} currentUser={currentUser} collectionName="tabby_tamara" />
                                          </div>

                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </>
                          ) : localSubTab === 'complaints' ? (
                            <>
                              {tabbyTamaraComplaints
                                .filter(c => {
                                  const isMyComplaint = c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
                                  if (!isTLOreSupport && !isMyComplaint) return false;

                                  const matchesSearch = 
                                    (c.patientName || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (c.fileNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (c.phoneNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (c.agentName || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (c.idNumber && c.idNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()));

                                  const matchesStatus = 
                                    ttFilterStatus === 'all' ||
                                    (ttFilterStatus === 'not_confirmed' && c.status === 'pending_tl') ||
                                    (ttFilterStatus === 'confirmed' && c.status === 'need_contact') ||
                                    (ttFilterStatus === 'contacted' && c.status === 'closed');

                                  const matchesProvider = 
                                    tcFilterClinic === 'all' || (c.clinicName && c.clinicName?.toLowerCase() === tcFilterClinic.toLowerCase());

                                  return matchesSearch && matchesStatus && matchesProvider;
                                }).length === 0 ? (
                                <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-slate-800/[0.02] space-y-2 animate-fade-in">
                                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                                    <AlertTriangle className="w-6 h-6 text-pink-500" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-100 font-sans">No complaints matching criteria.</p>
                                  <p className="text-xs text-slate-400">Logged complaints, issues and dispute timelines will load here.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in font-sans">
                                  {tabbyTamaraComplaints
                                    .filter(c => {
                                      const isMyComplaint = c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
                                      if (!isTLOreSupport && !isMyComplaint) return false;

                                      const matchesSearch = 
                                        (c.patientName || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (c.fileNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (c.phoneNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (c.agentName || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (c.idNumber && c.idNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()));

                                      const matchesStatus = 
                                        ttFilterStatus === 'all' ||
                                        (ttFilterStatus === 'not_confirmed' && c.status === 'pending_tl') ||
                                        (ttFilterStatus === 'confirmed' && c.status === 'need_contact') ||
                                        (ttFilterStatus === 'contacted' && c.status === 'closed');

                                      const matchesProvider = 
                                        tcFilterClinic === 'all' || (c.clinicName && c.clinicName?.toLowerCase() === tcFilterClinic.toLowerCase());

                                      return matchesSearch && matchesStatus && matchesProvider;
                                    })
                                    .map((comp) => {
                                      const isPendingTL = comp.status === 'pending_tl';
                                      const isNeedContact = comp.status === 'need_contact';
                                      const isClosed = comp.status === 'closed';

                                      return (
                                        <div
                                          key={comp.id}
                                          className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-md overflow-hidden bg-[#1e1e1e]/40 backdrop-blur-lg/60 ${
                                            isNeedContact 
                                              ? 'border-pink-500/30 bg-gradient-to-b from-pink-955/10 to-transparent animate-pulse' 
                                              : isPendingTL 
                                              ? 'border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent' 
                                              : 'border-white/5'
                                          }`}
                                        >
                                          {/* Platform Indicator Strip */}
                                          <div className="absolute top-0 right-0 left-0 h-1.5 flex animate-pulse">
                                            <div className="w-full bg-pink-500" />
                                          </div>

                                          {/* Card header */}
                                          <div className="flex justify-between items-start gap-2 pt-1 text-left">
                                            <div className="space-y-0.5">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[10px] text-slate-400 font-mono font-bold">File: {comp.fileNumber}</span>
                                                {comp.clinicName && (
                                                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300">
                                                    🏥 {comp.clinicName}
                                                  </span>
                                                )}
                                              </div>
                                              <h4 className="text-sm font-black text-slate-100 font-sans mt-1">{comp.patientName}</h4>
                                            </div>

                                            {/* Status Badges */}
                                            <div className="text-right flex flex-col items-end gap-1 shrink-0 font-sans">
                                              {isPendingTL && (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md">
                                                  ⏳ PENDING TL
                                                </span>
                                              )}
                                              {isNeedContact && (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded-md animate-pulse">
                                                  📞 TELEPHONE CLIENT
                                                </span>
                                              )}
                                              {isClosed && (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md">
                                                  ✅ CLOSED CASE
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Core Detail Grid */}
                                          <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl space-y-2 text-xs text-left">
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Submitting Agent:</p>
                                                <p className="text-slate-200 font-bold truncate">{comp.agentName}</p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Customer Type:</p>
                                                <p className="text-slate-200 font-bold font-sans">
                                                  {comp.isOldCustomer ? '👤 Old Customer' : '🆕 New Customer'}
                                                </p>
                                              </div>
                                            </div>

                                            {!comp.isOldCustomer && comp.idNumber && (
                                              <div className="border-t border-white/5 pt-1">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">ID Number:</p>
                                                <p className="text-slate-200 font-mono font-bold">{comp.idNumber}</p>
                                              </div>
                                            )}

                                            <div className="border-t border-white/5 pt-1.5 grid grid-cols-2 gap-2">
                                              <AttachmentsDisplay photos={comp.photos} links={comp.links} />
{comp.imageUrl ? (
                                                <div className="col-span-2">
                                                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Photo / Screenshot:</p>
                                                  <img src={comp.imageUrl} alt="Complaint Attachment" className="max-h-32 rounded-lg border border-white/10" />
                                                </div>
                                              ) : (
                                                <div>
                                                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Photo URL:</p>
                                                  <p className="text-slate-500 font-mono font-bold font-sans text-xs">N/A</p>
                                                </div>
                                              )}
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Phone number:</p>
                                                <p className="text-slate-200 font-mono font-bold truncate">{comp.phoneNumber}</p>
                                              </div>
                                            </div>

                                            {comp.complaintDetails && (
                                              <div className="border-t border-white/5 pt-1.5 text-xs text-slate-300">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5 font-bold">Complaint Issue:</p>
                                                <p className="bg-black/25 p-2 rounded-lg border border-white/[0.03] text-slate-300 leading-normal font-sans italic">
                                                  "{comp.complaintDetails}"
                                                </p>
                                              </div>
                                            )}

                                            {comp.tlComment && (
                                              <div className="border-t border-rose-500/20 pt-1.5 text-xs text-amber-300">
                                                <p className="text-[9px] text-rose-400 uppercase tracking-wider mb-0.5 font-bold">💬 Team Leader Answer ({comp.tlName || 'TL'}):</p>
                                                <p className="bg-rose-950/10 p-2 rounded-lg border border-pink-500/10 text-slate-200 leading-normal font-sans">
                                                  {comp.tlComment}
                                                </p>
                                              </div>
                                            )}
                                          </div>

                                          {/* Timers */}
                                          {isNeedContact && (
                                            <div className="p-3 bg-black/15 rounded-xl border border-white/[0.02] flex items-center justify-between text-xs font-sans">
                                              <div className="space-y-0.5 text-left">
                                                <p className="text-[9px] text-slate-400 uppercase">Commented on:</p>
                                                <p className="text-[10px] text-slate-300">{comp.commentedAt ? new Date(comp.commentedAt).toLocaleString() : 'N/A'}</p>
                                              </div>

                                              <div className="text-right space-y-0.5">
                                                <p className="text-[9px] text-slate-400 uppercase font-bold text-rose-400">Timer on Agent:</p>
                                                <p className="font-mono text-xs font-black px-2 py-0.5 rounded text-rose-400 bg-rose-500/10 animate-pulse">
                                                  {getElapsedTimerString(comp.commentedAt || comp.createdAt)}
                                                </p>
                                              </div>
                                            </div>
                                          )}

                                          {isClosed && (
                                            <div className="p-3 bg-black/15 rounded-xl border border-white/[0.02] flex items-center justify-between text-xs font-sans">
                                              <div className="space-y-0.5 text-left">
                                                <p className="text-[9px] text-slate-400 uppercase">Closed on:</p>
                                                <p className="text-[10px] text-slate-300">{comp.closedAt ? new Date(comp.closedAt).toLocaleString() : 'N/A'}</p>
                                              </div>

                                              <div className="text-right space-y-0.5">
                                                <p className="text-[9px] text-slate-400 uppercase">Completion SLA:</p>
                                                <p className="font-mono text-xs font-black px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10">
                                                  {getElapsedTimerString(comp.createdAt, comp.closedAt)}
                                                </p>
                                              </div>
                                            </div>
                                          )}

                                          {/* Inline TL Reply Input Form */}
                                          {activeComplaintHandlingId === comp.id && isTLOreSupport && (
                                            <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl space-y-2 text-left animate-fade-in mt-1">
                                              <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block">TL Commentary / Answer *</label>
                                              <textarea
                                                placeholder="Write comment/resolution details to update status to Pending Contact..."
                                                value={tlComplaintComment}
                                                onChange={(e) => setTlComplaintComment(e.target.value)}
                                                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans min-h-[60px]"
                                                required
                                              />
                                              <div className="flex gap-2 justify-end">
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveComplaintHandlingId(null)}
                                                  className="px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-400 cursor-pointer"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleTLCommentComplaint(comp.id, tlComplaintComment)}
                                                  className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-pink-600 hover:brightness-110 active:scale-95 text-slate-100 text-[10px] font-bold rounded-lg shadow cursor-pointer transition-all flex items-center gap-1"
                                                >
                                                  Submit Issue Review
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Action Footers */}
                                          <div className="flex gap-2 justify-end pt-1 border-t border-white/5">
                                            {/* DELETE Option */}
                                            {isSuperAdmin && (
                                              <button
                                                onClick={() => handleDeleteComplaint(comp.id)}
                                                className="mr-auto px-2 py-1.5 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/10 rounded-lg text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                title="Delete Complaint"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}

                                            {isWithinFiveMinutes(comp.createdAt) && (
                                              <button
                                                onClick={() => setEditingItem({ type: 'tt_complaint', id: comp.id, data: { ...comp } })}
                                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                title={`Edit complaint (${getRemainingEditTimeStr(comp.createdAt)})`}
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit ({getRemainingEditTimeStr(comp.createdAt)})
                                              </button>
                                            )}

                                            {/* Copy Option */}
                                            {isTLOreSupport && (
                                              <button
                                                onClick={() => {
                                                  const details = `*Complaint ID:* ${comp.id}
*Patient Name:* ${comp.patientName}
*File Number:* ${comp.fileNumber || 'N/A'}
*Phone Number:* ${comp.phoneNumber}
*Complaint Text:*
_ ${comp.text} _
*TL Comment:*
_ ${comp.tlComment || 'No comment yet'} _`;
                                                  navigator.clipboard.writeText(details);
                                                  toast.success('Complaint details copied!');
                                                }}
                                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-100 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                title="Copy Complaint details"
                                              >
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy
                                              </button>
                                            )}

                                            {/* TL Commentary Trigger Button */}
                                            {isTLOreSupport && isPendingTL && activeComplaintHandlingId !== comp.id && (
                                              <button
                                                onClick={() => {
                                                  setActiveComplaintHandlingId(comp.id);
                                                  setTlComplaintComment('');
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-sans font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                              >
                                                👑 Reply and Comment
                                              </button>
                                            )}

                                            {/* Agent Mark Contacted Closed Case button */}
                                            {currentUser?.role === 'agent' && isNeedContact && (
                                              <button
                                                onClick={() => handleToggleContactComplaint(comp.id, 'contacted')}
                                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 active:scale-95 text-black font-extrabold font-sans text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1"
                                              >
                                                📞 Mark Case Closed (Contacted)
                                              </button>
                                            )}

                                            {/* Reopen Closed Case if done in error */}
                                            {currentUser?.role === 'agent' && isClosed && (
                                              <button
                                                onClick={() => handleToggleContactComplaint(comp.id, 'not_contacted')}
                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold font-sans text-[10px] rounded-lg border border-white/5 transition-all cursor-pointer flex items-center gap-1"
                                              >
                                                Reopen Complaint
                                              </button>
                                            )}
                                          </div>
                                          
                                          <div className="w-full mt-3 pt-3 border-t border-white/5 mx-[2px]">
                                            <RequestReplyThread request={comp} currentUser={currentUser} collectionName="tabby_tamara_complaints" />
                                          </div>

                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {clientComms
                                .filter(c => {
                                  const userLOB = getAgentLOB(currentUser?.name || '');
                                  const isChatAgent = userLOB === 'Social Media' || userLOB === 'Chat';
                                  
                                  const isRelevantToMe = 
                                    (c.callCenterAgentName || '').toLowerCase() === (currentUser?.name || '').toLowerCase() || 
                                    c.handledBy?.toLowerCase() === currentUser?.name?.toLowerCase() ||
                                    c.openedBy?.toLowerCase() === currentUser?.name?.toLowerCase();
                                  
                                  // Management and support see all. Chat agents see all pending requests to take them.
                                  if (!isTLOreSupport && !isRelevantToMe && !(isChatAgent && c.status === 'pending')) return false;

                                  const matchesSearch = 
                                    c.clinicName?.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (c.phoneNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    c.callCenterAgentName?.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (c.handledBy && c.handledBy.toLowerCase().includes(ttSearchQuery.toLowerCase()));

                                  const matchesStatus = 
                                    ttFilterStatus === 'all' ||
                                    (ttFilterStatus === 'not_confirmed' || ttFilterStatus === 'confirmed' ? c.status === 'pending' : false) ||
                                    (ttFilterStatus === 'contacted' && c.status === 'contacted');

                                  const matchesClinic = tcFilterClinic === 'all' || c.clinicName?.toLowerCase() === tcFilterClinic.toLowerCase();

                                  return matchesSearch && matchesStatus && matchesClinic;
                                }).length === 0 ? (
                                <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-slate-800/[0.02] space-y-2 animate-fade-in">
                                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-100 font-sans">No communication requests matching criteria.</p>
                                  <p className="text-xs text-slate-400">Requests for Chat and Social Media agents will appear here.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in font-sans">
                                  {clientComms
                                    .filter(c => {
                                      const userLOB = getAgentLOB(currentUser?.name || '');
                                      const isChatAgent = userLOB === 'Social Media' || userLOB === 'Chat';

                                      const isRelevantToMe = 
                                        (c.callCenterAgentName || '').toLowerCase() === (currentUser?.name || '').toLowerCase() || 
                                        c.handledBy?.toLowerCase() === currentUser?.name?.toLowerCase() ||
                                        c.openedBy?.toLowerCase() === currentUser?.name?.toLowerCase();
                                      
                                      if (!isTLOreSupport && !isRelevantToMe && !(isChatAgent && c.status === 'pending')) return false;

                                      const matchesSearch = 
                                        c.clinicName?.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (c.phoneNumber || '').toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        c.callCenterAgentName?.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        (c.handledBy && c.handledBy.toLowerCase().includes(ttSearchQuery.toLowerCase()));

                                      const matchesStatus = 
                                        ttFilterStatus === 'all' ||
                                        (ttFilterStatus === 'not_confirmed' || ttFilterStatus === 'confirmed' ? c.status === 'pending' : false) ||
                                        (ttFilterStatus === 'contacted' && c.status === 'contacted');

                                      const matchesClinic = tcFilterClinic === 'all' || c.clinicName?.toLowerCase() === tcFilterClinic.toLowerCase();

                                      return matchesSearch && matchesStatus && matchesClinic;
                                    })
                                    .map((req) => {
                                      const isPending = req.status === 'pending';
                                      const isInProgress = req.status === 'in_progress';
                                      const isClosed = req.status === 'contacted';
                                      const userLOB = getAgentLOB(currentUser?.name || '');
                                      const isChatAgent = userLOB === 'Social Media' || userLOB === 'Chat';
                                      const canTakeRequest = isPending && isChatAgent;
                                      const canProcessRequest = isInProgress && (!req.openedBy || req.openedBy === currentUser?.name);

                                      return (
                                        <div
                                          key={req.id}
                                          className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-md overflow-hidden bg-[#1e1e1e]/40 backdrop-blur-lg/60 ${
                                            isPending 
                                              ? 'border-indigo-500/30 bg-gradient-to-b from-indigo-950/10 to-transparent' 
                                              : 'border-white/5'
                                          }`}
                                        >
                                          {/* Top Accent line */}
                                          {isPending && (
                                            <div className="absolute top-0 right-0 left-0 h-1.5 flex animate-pulse">
                                              <div className="w-full bg-indigo-500" />
                                            </div>
                                          )}

                                          <div className="flex justify-between items-start gap-2 pt-1 text-left">
                                            <div className="space-y-0.5">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getClinicBadgeColor(req.clinicName)}`}>
                                                  🏥 {req.clinicName}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-white/10 ${req.language === 'Arabic' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-blue-500/10 text-blue-300'}`}>
                                                  🗣️ {req.language}
                                                </span>
                                              </div>
                                            </div>
                                            
                                            {/* Status Badges */}
                                            <div className="text-right flex flex-col items-end gap-1 shrink-0 font-sans">
                                              {isPending && (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md animate-pulse">
                                                  ⏳ PENDING ACTION
                                                </span>
                                              )}
                                              {isInProgress && (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-md animate-pulse">
                                                  ⚡ IN PROGRESS ({req.openedBy})
                                                </span>
                                              )}
                                              {isClosed && (
                                                <span className="text-[9px] uppercase tracking-wide font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md">
                                                  ✅ CONTACTED
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Core Detail Grid */}
                                          <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl space-y-2 text-xs text-left">
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Requested By:</p>
                                                <p className="text-slate-200 font-bold truncate">{req.callCenterAgentName}</p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Phone number:</p>
                                                <p className="text-indigo-300 font-mono font-bold truncate">{req.phoneNumber}</p>
                                              </div>
                                            </div>

                                            <div className="border-t border-white/5 pt-1.5 text-xs text-slate-300">
                                              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5 font-bold">Notes / Inquiry:</p>
                                              <p className="bg-black/25 p-2 rounded-lg border border-white/[0.03] text-slate-300 leading-normal font-sans italic">
                                                "{req.notes}"
                                              </p>
                                            </div>

                                            <AttachmentsDisplay photos={req.photos} links={req.links} />
<AttachmentsDisplay photos={req.photos} links={req.links} />
{req.screenshot && (
                                              <div className="border-t border-white/5 pt-2">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                  <ImageIcon className="w-3 h-3 text-indigo-400" />
                                                  Screenshot
                                                </p>
                                                <img 
                                                  src={req.screenshot} 
                                                  alt="Communication Request Evidence" 
                                                  className="w-full h-24 object-cover rounded-lg border border-white/10 cursor-zoom-in hover:brightness-110 transition-all shadow-md"
                                                  onClick={() => window.open(req.screenshot, '_blank')}
                                                />
                                              </div>
                                            )}

                                            {req.handlingNotes && (
                                              <div className="border-t border-indigo-500/20 pt-1.5 text-xs text-indigo-300">
                                                <p className="text-[9px] text-indigo-400 uppercase tracking-wider mb-0.5 font-bold">💬 Resolution Notes ({req.handledBy}):</p>
                                                <p className="bg-indigo-950/20 p-2 rounded-lg border border-indigo-500/10 text-slate-200 leading-normal font-sans">
                                                  {req.handlingNotes}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Timers */}
                                          <div className="p-3 bg-black/15 rounded-xl border border-white/[0.02] flex items-center justify-between text-xs font-sans">
                                            <div className="space-y-0.5 text-left">
                                              <p className="text-[9px] text-slate-400 uppercase">{isClosed ? 'Closed By' : 'Submitted'}:</p>
                                              <p className="text-[10px] text-slate-300">
                                                {isClosed ? req.handledBy : new Date(req.createdAt).toLocaleString()}
                                              </p>
                                            </div>

                                            <div className="text-right space-y-0.5">
                                              <p className="text-[9px] text-slate-400 uppercase font-bold">{isClosed ? 'Turnaround Time' : (isInProgress ? 'Time Active' : 'Time Waiting')}:</p>
                                              <p className={`font-mono text-xs font-black px-2 py-0.5 rounded ${isClosed ? 'text-emerald-400 bg-emerald-500/10' : (isInProgress ? 'text-indigo-400 bg-indigo-500/10 animate-pulse' : 'text-amber-400 bg-amber-500/10animate-pulse')}`}>
                                                {isClosed && req.handledAt ? getElapsedTimerString(req.createdAt, req.handledAt) : getElapsedTimerString(req.createdAt)}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Inline Handling form */}
                                          {activeCcHandlingId === req.id && (
                                            <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl space-y-2 text-left animate-fade-in mt-1">
                                              <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block">Handling Notes *</label>
                                              <textarea
                                                placeholder="What was the outcome of contacting the client?"
                                                value={ccHandlingNotes}
                                                onChange={(e) => setCcHandlingNotes(e.target.value)}
                                                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans min-h-[60px]"
                                                required
                                              />
                                              <div className="flex gap-2 justify-end">
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveCcHandlingId(null)}
                                                  className="px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-400 cursor-pointer"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleProcessClientComms(req.id, ccHandlingNotes)}
                                                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 active:scale-95 text-slate-950 text-[10px] font-black rounded-lg shadow cursor-pointer transition-all flex items-center gap-1"
                                                >
                                                  Confirm Handled ✅
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Actions */}
                                          <div className="flex gap-2 justify-end pt-1 border-t border-white/5">
                                            {isSuperAdmin && (
                                              <button
                                                onClick={() => handleDeleteClientComms(req.id)}
                                                className="mr-auto px-2 py-1.5 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/10 rounded-lg text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                title="Delete Request"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}

                                            {isWithinFiveMinutes(req.createdAt) && (
                                              <button
                                                onClick={() => setEditingItem({ type: 'client_comm', id: req.id, data: { ...req } })}
                                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                title={`Edit communication (${getRemainingEditTimeStr(req.createdAt)})`}
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit ({getRemainingEditTimeStr(req.createdAt)})
                                              </button>
                                            )}

                                            {/* Copy Option */}
                                            {isTLOreSupport && (
                                              <button
                                                onClick={() => {
                                                  const details = `*Call Center Request ID:* ${req.id}
*Requested By:* ${req.callCenterAgentName}
*Clinic:* ${req.clinicName}
*Language:* ${req.language}
*Phone Number:* ${req.phoneNumber}
*Notes:*
_ ${req.notes} _
*Resolution Notes:*
_ ${req.handlingNotes || 'Pending response'} _`;
                                                  navigator.clipboard.writeText(details);
                                                  toast.success('Client communication details copied!');
                                                }}
                                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-100 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                title="Copy Request details"
                                              >
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy
                                              </button>
                                            )}

                                            {canTakeRequest && (
                                              <button
                                                onClick={() => handleTakeClientComm(req.id)}
                                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-sans font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                              >
                                                🔍 Open Request
                                              </button>
                                            )}

                                            {canProcessRequest && activeCcHandlingId !== req.id && (
                                              <button
                                                onClick={() => {
                                                  setActiveCcHandlingId(req.id);
                                                  setCcHandlingNotes('');
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 text-slate-100 font-sans font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                              >
                                                📞 Finalize Handled
                                              </button>
                                            )}
                                          </div>
                                          
                                          <div className="w-full mt-3 pt-3 border-t border-white/5 mx-[2px]">
                                            <RequestReplyThread request={req} currentUser={currentUser} collectionName="client_comms" />
                                          </div>

                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                      </div>
                    </div>

                  </div>

                </div>
                );
              })()}

              {/* Executive Desk: TL Feedback Portal */}
              {activeTab === 'tl-feedback' && (() => {
                const isAmira = currentUser?.name?.toLowerCase() === 'amira hassan';
                const filteredFeedbacks = tlFeedbacks.filter(f => {
                  // If logged-in user is TL, they only see feedbacks addressed to them
                  if (!isAmira) {
                    return (f.tlName || '').toLowerCase() === currentUser?.name?.toLowerCase();
                  }
                  // Amira can filter by TL name
                  if (feedbackFilterTl !== 'all') {
                    return (f.tlName || '').toLowerCase() === feedbackFilterTl.toLowerCase();
                  }
                  return true;
                });

                const availableTlsForSelect = TEAM_LEADERS.filter(name => name.toLowerCase() !== 'amira hassan');

                // Attachment hooks scoped inside this view
                const handleFeedbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      setFeedbackAttachment(event.target.result as string);
                      setFeedbackAttachmentName(file.name);
                      toast.success(`Attached ${file.name}!`);
                    }
                  };
                  reader.readAsDataURL(file);
                };

                const handleReplyFileChange = (feedbackId: string, e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      setFeedbackReplyAttachments(prev => ({ ...prev, [feedbackId]: event.target!.result as string }));
                      setFeedbackReplyAttachmentNames(prev => ({ ...prev, [feedbackId]: file.name }));
                      toast.success(`Attached ${file.name} to reply!`);
                    }
                  };
                  reader.readAsDataURL(file);
                };

                return (
                  <div id="tl-feedback-desk-root" className="space-y-6 animate-fade-in text-left">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/5 pb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-amber-400 font-display flex items-center gap-3">
                          <CheckCircle2 className="w-8 h-8 text-amber-400 animate-pulse" />
                          {currentUser.role === 'tl' ? "Director Hub" : "TL Hub"}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">{currentUser.role === 'tl' ? "Exclusive feedback and communication portal with the Director." : "View feedback and updates from the Team Leaders and Director."}</p>
                      </div>

                      {/* Filter by Team Leader for Amira */}
                      {isAmira && (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <label className="text-xs text-slate-400 shrink-0 font-medium font-sans">Filter by TL:</label>
                          <select
                            value={feedbackFilterTl}
                            onChange={(e) => setFeedbackFilterTl(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-sans w-full sm:w-48"
                          >
                            <option value="all" className="bg-slate-800 text-slate-100 ">All Team Leaders</option>
                            {availableTlsForSelect.map(tl => (
                              <option key={tl} value={tl} className="bg-slate-800 text-slate-100 ">{tl}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Amira Hassan Submission Console */}
                    {isAmira && (
                      <div className="bg-white/5 border text-slate-100 border-white/10 rounded-3xl shadow-sm p-6 space-y-4">
                        <div className="border-b border-white/5 pb-3">
                          <h3 className="font-bold text-slate-100 text-base font-display flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            Compose Feedback to Team Leader
                          </h3>
                          <p className="text-xs text-slate-400">Choose a TL, type notes with markdown instructions and any @mentions. Optional file upload as attachment.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1">
                            <label className="text-xs text-slate-400 mb-1.5 block font-bold font-sans">Target Team Leader:</label>
                            <select
                              value={selectedTlForFeedback}
                              onChange={(e) => setSelectedTlForFeedback(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-sans w-full cursor-pointer"
                            >
                              <option value="" className="bg-slate-800 text-slate-100 backdrop-blur-lg">-- Choose TL --</option>
                              {availableTlsForSelect.map(tl => (
                                <option key={tl} value={tl} className="bg-slate-800 text-slate-100 backdrop-blur-lg">{tl}</option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs text-slate-400 mb-1.5 block font-bold font-sans">Attach File (Images/Documents):</label>
                            <div className="flex gap-3">
                              <label className="flex-1 flex items-center justify-between px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all">
                                <span className="text-xs text-slate-400 truncate pr-2">
                                  {feedbackAttachmentName || 'Choose file or drag & drop...'}
                                </span>
                                <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={handleFeedbackFileChange}
                                />
                              </label>
                              {feedbackAttachment && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFeedbackAttachment('');
                                    setFeedbackAttachmentName('');
                                    toast.success('Attachment detached');
                                  }}
                                  className="px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 text-xs transition-all cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block font-bold font-sans">Feedback & Action Plan Notes:</label>
                          <textarea
                            value={feedbackNotes}
                            onChange={(e) => setFeedbackNotes(e.target.value)}
                            rows={4}
                            placeholder="Type details... Bold text is supported by using **double asterisks**. Tag anyone using @Name, they will get an instant ping notification!"
                            className="bg-white/5 border border-white/10 rounded-2xl text-sm text-slate-100 px-4 py-3 focus:outline-none focus:border-amber-400 w-full placeholder:text-slate-500 font-sans leading-relaxed"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => {
                              if (!selectedTlForFeedback) return toast.error("Please pick a target TL.");
                              if (!feedbackNotes.trim()) return toast.error("Notes cannot be blank.");
                              addTlFeedback(selectedTlForFeedback, feedbackNotes, feedbackAttachment, feedbackAttachmentName);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Send Direct Micro-Email
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Feedbacks Feed */}
                    <div className="space-y-4">
                      {filteredFeedbacks.length === 0 ? (
                        <div className="py-12 bg-white/5 border border-white/10 rounded-3xl text-center">
                          <MessageSquare className="w-12 h-12 text-slate-500 opacity-40 mx-auto mb-3" />
                          <h4 className="font-bold text-slate-100 text-base">No Feedbacks Logged</h4>
                          <p className="text-slate-400 text-xs mt-1">There are no records in the selected Category.</p>
                        </div>
                      ) : (
                        filteredFeedbacks.map((f) => {
                          return (
                            <div key={f.id} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl space-y-6 text-left">
                              {/* Card Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-400 font-mono">
                                    TL
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-slate-100 text-base">{f.tlName}</h4>
                                      <span className="text-[10px] text-slate-500 font-medium">Addressed to TL</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Created by Director: {f.directorName} • {new Date(f.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>

                                <div>
                                  {f.status === 'pending_reply' ? (
                                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">
                                      📥 Pending Reply
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                      ✅ Replied
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Card Body */}
                              <div className="space-y-4">
                                <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                  {/* Format inline mentions and bold */}
                                  {f.notes.split('\n').map((line, idx) => (
                                    <p key={idx} className="mb-2">
                                      {line.split(/(\s+)/).map((word, wIdx) => {
                                        if (word.startsWith('@')) {
                                          return <span key={wIdx} className="bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded text-xs">{word}</span>;
                                        }
                                        if (word.startsWith('**') && word.endsWith('**')) {
                                          return <strong key={wIdx} className="font-extrabold text-slate-100">{word.slice(2, -2)}</strong>;
                                        }
                                        return word;
                                      })}
                                    </p>
                                  ))}
                                </div>

                                {/* Attachment block */}
                                {f.attachment && (
                                  <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                      <p className="text-xs text-slate-100 font-semibold truncate">{f.attachmentName || 'evaluation_attachment'}</p>
                                      <p className="text-[10px] text-slate-500 font-mono">Attachment Available</p>
                                    </div>
                                    <a
                                      href={f.attachment}
                                      download={f.attachmentName || 'attachment'}
                                      className="px-3 py-1.5 bg-amber-400 hover:brightness-110 text-slate-950 font-sans font-bold text-[10px] rounded-lg transition-all"
                                    >
                                      Download
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Replies Container */}
                              <div className="border-t border-white/5 pt-5 space-y-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Conversation Logs & Replies</h5>
                                
                                {f.replies.length === 0 ? (
                                  <p className="text-slate-500 text-xs italic">No replies in this micro-thread yet.</p>
                                ) : (
                                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-2">
                                    {f.replies.map((r) => {
                                      const isSenderAmira = (r.senderName || '').toLowerCase() === 'amira hassan';

                                      return (
                                        <div 
                                          key={r.id} 
                                          className={`p-3.5 rounded-2xl border transition-all ${
                                            isSenderAmira 
                                              ? 'bg-indigo-950/10 border-indigo-500/10 ml-8' 
                                              : 'bg-white/5 border-white/10 mr-8'
                                          }`}
                                        >
                                          <div className="flex justify-between items-center mb-1.5">
                                            <span className={`text-xs font-bold ${isSenderAmira ? 'text-indigo-300' : 'text-amber-400'}`}>
                                              {isSenderAmira ? '👑 ' : '👤 '} {r.senderName}
                                            </span>
                                            <span className="text-[9px] text-slate-500 font-mono">{new Date(r.createdAt).toLocaleString()}</span>
                                          </div>
                                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {r.text.split(/(\s+)/).map((word, wIdx) => {
                                              if (word.startsWith('@')) {
                                                return <span key={wIdx} className="bg-indigo-550/20 text-indigo-200 font-bold px-1 py-0.5 rounded text-[11px]">{word}</span>;
                                              }
                                              return word;
                                            })}
                                          </p>

                                          {/* Reply Attachment */}
                                          {r.attachment && (
                                            <div className="flex items-center gap-2 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg mt-2 justify-between">
                                              <span className="text-[10px] text-slate-400 truncate max-w-xs">{r.attachmentName || 'reply_attachment'}</span>
                                              <a
                                                href={r.attachment}
                                                download={r.attachmentName || 'reply_attachment'}
                                                className="text-[9px] text-amber-400 hover:underline font-bold"
                                              >
                                                Download
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Add Reply Draft Input */}
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 mt-2">
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                      <textarea
                                        value={feedbackReplies[f.id] || ''}
                                        onChange={(e) => setFeedbackReplies(prev => ({ ...prev, [f.id]: e.target.value }))}
                                        rows={2}
                                        placeholder="Type your reply notes..."
                                        className="bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 px-3 py-2 focus:outline-none focus:border-amber-400 w-full placeholder:text-slate-500 font-sans"
                                      />
                                    </div>

                                    <div className="flex flex-col sm:w-48 gap-2">
                                      {/* Attachment disabled for agents */}
                                      <button
                                        onClick={() => {
                                          replyToTlFeedback(
                                            f.id, 
                                            feedbackReplies[f.id] || '', 
                                            feedbackReplyAttachments[f.id], 
                                            feedbackReplyAttachmentNames[f.id]
                                          );
                                        }}
                                        className="px-3 py-2 bg-amber-400 hover:brightness-110 text-slate-950 font-sans font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                      >
                                        Send Reply
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Super Admin Control Panel */}
              {activeTab === 'admin' && (
                <SuperAdminControl
                  currentUser={currentUser}
                  registeredUsers={registeredUsers}
                  credentials={credentials}
                  lockedAccounts={lockedAccounts}
                  failedAttempts={failedAttempts}
                  onResetAllData={handleResetAllData}
                  TRIGGER_CURRENT_APP_VERSION={CURRENT_APP_VERSION}
                />
              )}

              {/* Headcount / Directory Panel */}
              {activeTab === 'directory' && (() => {
                const globalMeta = getAgentMeta();
                return (
                  <div id="directory-desk-root" className="space-y-6 animate-fade-in text-left">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/5 pb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-cyan-400 font-display flex items-center gap-3">
                          <UserCheck className="w-8 h-8" />
                          Headcount / Directory
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">View comprehensive agent data and personal contacts</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-64">
                          <span className="absolute left-3 top-2.5 text-slate-400">
                            <Search className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            placeholder="Search names, phones, emails..."
                            value={directorySearchQuery}
                            onChange={(e) => setDirectorySearchQuery(e.target.value)}
                            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-sans font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Headcount Upload Console directly under directory tab for Hesham & Amira */}
                    {isSuperAdmin && (
                      <div className="bg-white/5 border text-slate-100 border-white/10 rounded-3xl shadow-sm p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-white/5 gap-3">
                          <div className="text-left">
                            <h3 className="font-bold text-slate-100 text-base font-display flex items-center gap-2">
                              <Upload className="w-5 h-5 text-cyan-400" />
                              Upload Directory / Headcount File
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Import any CSV, TSV, JSON, or Excel (.xlsx, .xls) spreadsheet to sync or overwrite agent profiles</p>
                          </div>
                          <button
                            onClick={() => {
                              const csvContent = "Agent Name,Email,Phone,LOB,LOB Team,Role,Team Leader\nJohn Doe,john@example.com,555-0199,Chat,Support,agent,Amira Hassan\nJane Smith,jane@example.com,555-0122,Social Media,Moderator,tl,Hesham Sobhy";
                              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(blob);
                              link.download = 'headcount_template.csv';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 rounded-xl transition-all border border-white/10 shadow-sm cursor-pointer"
                          >
                            Download Sample CSV
                          </button>
                        </div>

                        {/* Drag and Drop File Zone */}
                        <div 
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-cyan-500', 'bg-cyan-500/5');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-500/5');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-500/5');
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleDirectoryFile(e.dataTransfer.files[0]);
                            }
                          }}
                          className="border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl p-8 text-center transition-all bg-black/10 flex flex-col items-center justify-center gap-3 cursor-pointer group"
                          onClick={() => document.getElementById('headcount-file-uploader')?.click()}
                        >
                          <input 
                            type="file" 
                            id="headcount-file-uploader" 
                            className="hidden" 
                            accept=".csv,.xlsx,.xls,.tsv,.txt,.json"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleDirectoryFile(e.target.files[0]);
                              }
                            }}
                          />
                          <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200">Drag & drop your headcount file here, or <span className="text-cyan-400 group-hover:underline">browse</span></p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-wider">Supports XLSX, XLS, CSV, TSV, TXT, JSON</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-sm overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap">
                        <thead className="text-slate-400 bg-white/5 text-[10px] uppercase font-bold tracking-wider">
                          <tr>
                            <th className="p-4 rounded-l-xl">Agent Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">LOB</th>
                            <th className="p-4">LOB Team</th>
                            <th className="p-4">Role</th>
                            <th className="p-4 rounded-r-xl">Team Leader</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                          {registeredUsers.filter(m => {
                            if (!directorySearchQuery) return true;
                            const q = directorySearchQuery.toLowerCase();
                            return m.name.toLowerCase().includes(q) || (m.email && m.email.toLowerCase().includes(q)) || (m.phone && m.phone.includes(q));
                          }).map((meta, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-all">
                              <td className="p-4 text-slate-100 font-bold">{meta.name}</td>
                              <td className="p-4">{meta.email || '-'}</td>
                              <td className="p-4">{meta.phone || '-'}</td>
                              <td className="p-4"><span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-lg bg-opacity-40">{meta.lob || '-'}</span></td>
                              <td className="p-4">{meta.lobTeam || '-'}</td>
                              <td className="p-4"><span className="bg-amber-950/30 text-amber-500 font-bold py-1 px-3 rounded-lg">{meta.role === 'tl' ? 'TL' : 'Agent'}</span></td>
                              <td className="p-4 text-cyan-300 font-bold">{meta.teamLeader || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {registeredUsers.length === 0 && (
                        <div className="text-center p-8 text-slate-500 font-medium font-sans">
                          No directory data active. Please upload a headcount file.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
                        </AnimatePresence>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

