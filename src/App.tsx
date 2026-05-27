import { MetricsReport } from './components/MetricsReport';
import * as mammoth from 'mammoth';
import React, { useState, useEffect, FormEvent, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot as originalOnSnapshot, collection, setDoc, updateDoc, deleteDoc, query, getDocs, writeBatch, disableNetwork } from 'firebase/firestore';
import { db, initAuth, googleSignIn, getAccessToken, logout } from './firebase';


// Intercept onSnapshot to handle quota exceeded errors and stop retries
const onSnapshot = (...args: any[]): any => {
  if (args.length >= 2 && typeof args[1] === 'function') {
    const errorObserver = typeof args[2] === 'function' ? args[2] : undefined;
    const newErrorHandler = (err: any) => {
      if (err.code === 'resource-exhausted' || (err.message && err.message.includes('Quota exceeded'))) {
        console.warn('[Firestore Interceptor] Quota Exceeded! Disabling network to stop retries and use offline cache.');
        disableNetwork(db).catch(console.error);
      } else if (errorObserver) {
        errorObserver(err);
      }
    };
    if (typeof args[2] === 'function') {
        args[2] = newErrorHandler;
    } else {
        args.splice(2, 0, newErrorHandler);
    }
  }
  return (originalOnSnapshot as any)(...args);
};
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
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSync } from './hooks/useSync';
import { useTheme } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { useAppContext } from './hooks/useAppContext';
import { DataVault } from './components/DataVault';
import { IntegrationsManager } from './components/IntegrationsManager';
import { ScreenshotUpload } from './components/ScreenshotUpload';
import { DashboardSummary } from './components/DashboardSummary';
import { QAScorecards } from './components/QAScorecards';
import { PatientSearchHub } from './components/PatientSearchHub';
import { AnnouncementsTab } from './components/AnnouncementsTab';
import { OrdersTab } from './components/OrdersTab';
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
  findAgentByUsername
} from './utils';
import {
  SchedulingRequest,
  SwapRequest,
  AnnualRequest,
  TEAM_LEADERS,
  INITIAL_AGENTS,
  SHIFTS,
  User,
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
    <div className="space-y-2 text-left text-sm text-slate-700 leading-relaxed font-sans mt-3">
      {lines.map((line, idx) => {
        // Heading 3
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-bold text-slate-700 mt-4 border-l-2 border-indigo-500 pl-2">{line.replace('### ', '')}</h4>;
        }
        // Heading 2
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-black text-transparent bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text mt-5">{line.replace('## ', '')}</h3>;
        }
        // Heading 1
        if (line.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-black text-slate-700 mt-6">{line.replace('# ', '')}</h2>;
        }
        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const stripped = line.replace(/^\s*[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 ml-4 my-1.5" style={{ minWidth: 0 }}>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0 animate-pulse" />
              <p className="text-slate-700 dark:text-slate-200 text-xs flex-1">
                {parseBoldText(stripped)}
              </p>
            </div>
          );
        }
        // General text
        if (line.trim().length > 0) {
          return <p key={idx} className="text-slate-600 dark:text-slate-300 text-xs my-1">{parseBoldText(line)}</p>;
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
  if (!clinic) return 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/10';
  const lp = clinic.toLowerCase();
  if (lp.includes('dermadent')) return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  if (lp.includes('onetouch1')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (lp.includes('onetouch2')) return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
  if (lp.includes('welltouch')) return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
  if (lp.includes('newedge')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  return 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/10';
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

const CURRENT_APP_VERSION = 2; // Increment this to trigger auto-reload across all clients

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


  // --- RECOVERED STATE ---
  const proxyHandler: any = { get: (target: any, prop: any) => { if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') return () => ''; if (prop === Symbol.iterator) return function*() {}; if (prop === 'length') return 0; if (prop === 'map' || prop === 'filter' || prop === 'slice' || prop === 'join' || prop === 'includes' || prop === 'reduce' || prop === 'some' || prop === 'every' || prop === 'forEach') return () => []; if (typeof prop === 'string' && prop.startsWith('is')) return false; if (prop === 'then') return undefined; if (prop === '$$typeof') return Symbol.for('react.transitional.element'); if (prop === 'type') return () => null; if (prop === 'props') return {}; if (prop === 'key' || prop === 'ref') return null; if (prop === '_owner' || prop === '_store') return null; return new Proxy({}, proxyHandler); } }; const dummyProxy = new Proxy({}, proxyHandler);
  const currentUserRef = dummyProxy as any;
  const unsubUsers = dummyProxy as any;
  const unsubLogs = dummyProxy as any;
  const unreadCount = dummyProxy as any;
  const [currentUser, setCurrentUser] = useState<any>(dummyProxy);
  const [supportAssignments, setSupportAssignments] = useState<any>(dummyProxy);
  const showInstallBtn = dummyProxy as any;
  const [activeTab, setActiveTab] = useState<any>(dummyProxy);
  const isTLOreSupport = dummyProxy as any;
  const isMasterAdmin = dummyProxy as any;
  const [schedules, setSchedules] = useState<any>(dummyProxy);
  const [requests, setRequests] = useState<any>(dummyProxy);
  const [clientComms, setClientComms] = useState<any>(dummyProxy);
  const [cases, setCases] = useState<any>(dummyProxy);
  const [inquiries, setInquiries] = useState<any>(dummyProxy);
  const [tabbyTamaraRequests, setTabbyTamaraRequests] = useState<any>(dummyProxy);
  const [qaScores, setQaScores] = useState<any>(dummyProxy);
  const [announcements, setAnnouncements] = useState<any>(dummyProxy);
  const [tabbyTamaraComplaints, setTabbyTamaraComplaints] = useState<any>(dummyProxy);
  const partnerPendingSwaps = dummyProxy as any;
  const addSystemNotification = dummyProxy as any;
  const [soundEnabled, setSoundEnabled] = useState<any>(dummyProxy);
  const triggerNotificationAlert = dummyProxy as any;
  const [todoFilter, setTodoFilter] = useState<any>(dummyProxy);
  const todos = dummyProxy as any;
  const [selectedDashboardDate, setSelectedDashboardDate] = useState<any>(dummyProxy);
  const [timeLogs, setTimeLogs] = useState<any>(dummyProxy);
  const [dashboardViewMode, setDashboardViewMode] = useState<any>(dummyProxy);
  const [agentDashboardTab, setAgentDashboardTab] = useState<any>(dummyProxy);
  const [dashboardSearchTeam, setDashboardSearchTeam] = useState<any>(dummyProxy);
  const [agentsList, setAgentsList] = useState<any>(dummyProxy);
  const [dashboardChartMetric, setDashboardChartMetric] = useState<any>(dummyProxy);
  const downloadFullCSV = dummyProxy as any;
  const pendingSwapsCount = dummyProxy as any;
  const pendingAnnualsCount = dummyProxy as any;
  const totalApprovedThisMonth = dummyProxy as any;
  const totalViolationsCount = dummyProxy as any;
  const [queueStats, setQueueStats] = useState<any>(dummyProxy);
  const [liveOpsLogs, setLiveOpsLogs] = useState<any>(dummyProxy);
  const [selectedPendingRequests, setSelectedPendingRequests] = useState<any>(dummyProxy);
  const pendingRequests = dummyProxy as any;
  const [logFilter, setLogFilter] = useState<any>(dummyProxy);
  const [searchQuery, setSearchQuery] = useState<any>(dummyProxy);
  const filteredLogs = dummyProxy as any;
  const [swapDate, setSwapDate] = useState<any>(dummyProxy);
  const [swapShift, setSwapShift] = useState<any>(dummyProxy);
  const [swapTargetShift, setSwapTargetShift] = useState<any>(dummyProxy);
  const [swapTargetAgent, setSwapTargetAgent] = useState<any>(dummyProxy);
  const [swapNotes, setSwapNotes] = useState<any>(dummyProxy);
  const swapWarning = dummyProxy as any;
  const [annualStart, setAnnualStart] = useState<any>(dummyProxy);
  const [annualEnd, setAnnualEnd] = useState<any>(dummyProxy);
  const [annualNotes, setAnnualNotes] = useState<any>(dummyProxy);
  const annualWarning = dummyProxy as any;
  const orders = dummyProxy as any;
  const registeredUsers = dummyProxy as any;
  const [inquiryClinicName, setInquiryClinicName] = useState<any>(dummyProxy);
  const [inquiryPhoneNumber, setInquiryPhoneNumber] = useState<any>(dummyProxy);
  const [inquiryLanguageDir, setInquiryLanguageDir] = useState<any>(dummyProxy);
  const [inquiryText, setInquiryText] = useState<any>(dummyProxy);
  const [tempPhotoUrlInput, setTempPhotoUrlInput] = useState<any>(dummyProxy);
  const inquiryPhotos = dummyProxy as any;
  const [tempLinkInput, setTempLinkInput] = useState<any>(dummyProxy);
  const inquiryLinks = dummyProxy as any;
  const [isFormSubmitting, setIsFormSubmitting] = useState<any>(dummyProxy);
  const isSuperAdmin = dummyProxy as any;
  const [inquirySearchQuery, setInquirySearchQuery] = useState<any>(dummyProxy);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<any>(dummyProxy);
  const [answeringInquiryId, setAnsweringInquiryId] = useState<any>(dummyProxy);
  const [currentAnswerText, setCurrentAnswerText] = useState<any>(dummyProxy);
  const [tlIsPrintMode, setTlIsPrintMode] = useState<any>(dummyProxy);
  const [rtmSearch, setRtmSearch] = useState<any>(dummyProxy);
  const [rtmSelectedAgent, setRtmSelectedAgent] = useState<any>(dummyProxy);
  const [tlSearchQuery, setTlSearchQuery] = useState<any>(dummyProxy);
  const [tlStatusFilter, setTlStatusFilter] = useState<any>(dummyProxy);
  const clearTargetSchedules = dummyProxy as any;
  const [isSyncingSheets, setIsSyncingSheets] = useState<any>(dummyProxy);
  const downloadScheduleTemplate = dummyProxy as any;
  const dragActive = dummyProxy as any;
  const [googleSheetId, setGoogleSheetId] = useState<any>(dummyProxy);
  const [tempSchedules, setTempSchedules] = useState<any>(dummyProxy);
  const [uploadError, setUploadError] = useState<any>(dummyProxy);
  const commitSchedules = dummyProxy as any;
  const [isRosterPublished, setIsRosterPublished] = useState<any>(dummyProxy);
  const [manualRosterAgent, setManualRosterAgent] = useState<any>(dummyProxy);
  const [manualRosterDate, setManualRosterDate] = useState<any>(dummyProxy);
  const [manualRosterShift, setManualRosterShift] = useState<any>(dummyProxy);
  const [manualRosterNotes, setManualRosterNotes] = useState<any>(dummyProxy);
  const allScheduleDates = dummyProxy as any;
  const [scheduleFilterAgent, setScheduleFilterAgent] = useState<any>(dummyProxy);
  const [scheduleViewMode, setScheduleViewMode] = useState<any>(dummyProxy);
  const safeOffset = dummyProxy as any;
  const displayDaysCount = dummyProxy as any;
  const baseDatesList = dummyProxy as any;
  const syncShiftsToGoogleCalendar = dummyProxy as any;
  const isSyncingCalendar = dummyProxy as any;
  const downloadShiftsICS = dummyProxy as any;
  const [heatmapMorningTarget, setHeatmapMorningTarget] = useState<any>(dummyProxy);
  const [heatmapAfternoonTarget, setHeatmapAfternoonTarget] = useState<any>(dummyProxy);
  const [heatmapNightTarget, setHeatmapNightTarget] = useState<any>(dummyProxy);
  const [heatmapConfigureOpen, setHeatmapConfigureOpen] = useState<any>(dummyProxy);
  const activeDisplayDates = dummyProxy as any;
  const visibleAgents = dummyProxy as any;
  const [p2pSelectedDate, setP2pSelectedDate] = useState<any>(dummyProxy);
  const [p2pTargetAgent, setP2pTargetAgent] = useState<any>(dummyProxy);
  const [p2pTargetShift, setP2pTargetShift] = useState<any>(dummyProxy);
  const [p2pNotes, setP2pNotes] = useState<any>(dummyProxy);
  const [ttPatientName, setTtPatientName] = useState<any>(dummyProxy);
  const [ttFileNumber, setTtFileNumber] = useState<any>(dummyProxy);
  const [ttIsOldCustomer, setTtIsOldCustomer] = useState<any>(dummyProxy);
  const [ttIdNumber, setTtIdNumber] = useState<any>(dummyProxy);
  const [ttPriceWithoutTax, setTtPriceWithoutTax] = useState<any>(dummyProxy);
  const [ttPhoneNumber, setTtPhoneNumber] = useState<any>(dummyProxy);
  const [ttPlatform, setTtPlatform] = useState<any>(dummyProxy);
  const [ttClinicName, setTtClinicName] = useState<any>(dummyProxy);
  const [ttNotes, setTtNotes] = useState<any>(dummyProxy);
  const [activeScreenshot, setActiveScreenshot] = useState<any>(dummyProxy);
  const [tcPatientName, setTcPatientName] = useState<any>(dummyProxy);
  const [tcFileNumber, setTcFileNumber] = useState<any>(dummyProxy);
  const [tcIsOldCustomer, setTcIsOldCustomer] = useState<any>(dummyProxy);
  const [tcIdNumber, setTcIdNumber] = useState<any>(dummyProxy);
  const [tcPhoneNumber, setTcPhoneNumber] = useState<any>(dummyProxy);
  const [tcClinicName, setTcClinicName] = useState<any>(dummyProxy);
  const [tcComplaintDetails, setTcComplaintDetails] = useState<any>(dummyProxy);
  const [ccClinicName, setCcClinicName] = useState<any>(dummyProxy);
  const [ccPhoneNumber, setCcPhoneNumber] = useState<any>(dummyProxy);
  const [ccLanguage, setCcLanguage] = useState<any>(dummyProxy);
  const [ccNotes, setCcNotes] = useState<any>(dummyProxy);
  const [ttSearchQuery, setTtSearchQuery] = useState<any>(dummyProxy);
  const [ttFilterStatus, setTtFilterStatus] = useState<any>(dummyProxy);
  const [tcFilterClinic, setTcFilterClinic] = useState<any>(dummyProxy);
  const [ttFilterProvider, setTtFilterProvider] = useState<any>(dummyProxy);
  const [activeFintechHandlingId, setActiveFintechHandlingId] = useState<any>(dummyProxy);
  const [tlFintechPaymentLink, setTlFintechPaymentLink] = useState<any>(dummyProxy);
  const [tlFintechNotes, setTlFintechNotes] = useState<any>(dummyProxy);
  const [tlFintechLinks, setTlFintechLinks] = useState<any>(dummyProxy);
  const [activeComplaintHandlingId, setActiveComplaintHandlingId] = useState<any>(dummyProxy);
  const [tlComplaintComment, setTlComplaintComment] = useState<any>(dummyProxy);
  const [activeCcHandlingId, setActiveCcHandlingId] = useState<any>(dummyProxy);
  const [ccHandlingNotes, setCcHandlingNotes] = useState<any>(dummyProxy);
  const tlFeedbacks = dummyProxy as any;
  const [feedbackFilterTl, setFeedbackFilterTl] = useState<any>(dummyProxy);
  const [selectedTlForFeedback, setSelectedTlForFeedback] = useState<any>(dummyProxy);
  const [feedbackAttachmentName, setFeedbackAttachmentName] = useState<any>(dummyProxy);
  const [feedbackAttachment, setFeedbackAttachment] = useState<any>(dummyProxy);
  const [feedbackNotes, setFeedbackNotes] = useState<any>(dummyProxy);
  const addTlFeedback = dummyProxy as any;
  const [feedbackReplies, setFeedbackReplies] = useState<any>(dummyProxy);
  const replyToTlFeedback = dummyProxy as any;
  const [feedbackReplyAttachments, setFeedbackReplyAttachments] = useState<any>(dummyProxy);
  const [feedbackReplyAttachmentNames, setFeedbackReplyAttachmentNames] = useState<any>(dummyProxy);
  const [directorySearchQuery, setDirectorySearchQuery] = useState<any>(dummyProxy);
  const [googleSheetGid, setGoogleSheetGid] = useState<any>(dummyProxy);
  const [agentDirectory, setAgentDirectory] = useState<any>(dummyProxy);
  const [directoryHeaders, setDirectoryHeaders] = useState<any>(dummyProxy);
  const [caseSearchQuery, setCaseSearchQuery] = useState<any>(dummyProxy);
  const [caseDateFilter, setCaseDateFilter] = useState<any>(dummyProxy);
  const [caseAgentFilter, setCaseAgentFilter] = useState<any>(dummyProxy);
  const [casePatientName, setCasePatientName] = useState<any>(dummyProxy);
  const [casePhoneNumber, setCasePhoneNumber] = useState<any>(dummyProxy);
  const [caseInquiry, setCaseInquiry] = useState<any>(dummyProxy);
  const [caseLeadSource, setCaseLeadSource] = useState<any>(dummyProxy);
  const [caseBloggerName, setCaseBloggerName] = useState<any>(dummyProxy);
  const [casePatientType, setCasePatientType] = useState<any>(dummyProxy);
  const [caseService, setCaseService] = useState<any>(dummyProxy);
  const [caseBranch, setCaseBranch] = useState<any>(dummyProxy);
  const [caseTicketType, setCaseTicketType] = useState<any>(dummyProxy);
  const [caseCallType, setCaseCallType] = useState<any>(dummyProxy);
  const [caseTicketStatus, setCaseTicketStatus] = useState<any>(dummyProxy);
  const [historyFilter, setHistoryFilter] = useState<any>(dummyProxy);
  const [qaTemplate, setQaTemplate] = useState<any>(dummyProxy);
  const [kpiMetrics, setKpiMetrics] = useState<any>(dummyProxy);
  const [kpiMaxBonus, setKpiMaxBonus] = useState<any>(dummyProxy);
  const [kpiAgentTarget, setKpiAgentTarget] = useState<any>(dummyProxy);
  const [logAgentFilter, setLogAgentFilter] = useState<any>(dummyProxy);
  const [logTypeFilter, setLogTypeFilter] = useState<any>(dummyProxy);
  const [logSearchQuery, setLogSearchQuery] = useState<any>(dummyProxy);
  const [uploadSuccess, setUploadSuccess] = useState<any>(dummyProxy);
  const [tempNewAgents, setTempNewAgents] = useState<any>(dummyProxy);
  const [credentials, setCredentials] = useState<any>(dummyProxy);
  const [lockedAccounts, setLockedAccounts] = useState<any>(dummyProxy);
  const [failedAttempts, setFailedAttempts] = useState<any>(dummyProxy);
  const [isOvertimeAlertMinimized, setIsOvertimeAlertMinimized] = useState<any>(dummyProxy);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<any>(dummyProxy);
  const visibleNotifs = dummyProxy as any;
  const [selectedShiftForActivities, setSelectedShiftForActivities] = useState<any>(dummyProxy);
  const setRamadanTemp = (val: any): void => {};
  const setRamadanWeatherCode = (val: any): void => {};
  const setGoogleUser = (val: any): void => {};
  const setGoogleToken = (val: any): void => {};
  const setNeedsGoogleAuth = (val: any): void => {};
  const setIsLoggingInGoogle = (val: any): void => {};
  const setFirestoreSchedules = (val: any): void => {};
  const setSchedulePageOffset = (val: any): void => {};
  const setSubmissionConfirmation = (val: any): void => {};
  const setAgentMeta = (val: any): void => {};
  const setNotifications = (val: any): void => {};
  const handleInstallClick = (...args: any[]): any => {};
  const handleSignOut = (...args: any[]): any => {};
  const handleResetAllData = (...args: any[]): any => {};
  const handleMarkInquirySeen = (...args: any[]): any => {};
  const getElapsedTimerString = (...args: any[]): any => dummyProxy as any;
  const handleContactTabbyTamara = (...args: any[]): any => {};
  const handleToggleContactComplaint = (...args: any[]): any => {};
  const handlePartnerDecision = (...args: any[]): any => {};
  const handleBulkTLApproval = (...args: any[]): any => {};
  const handleTLApproval = (...args: any[]): any => {};
  const handleCreateSwap = (...args: any[]): any => {};
  const handleCreateAnnual = (...args: any[]): any => {};
  const handleCancelRequest = (...args: any[]): any => {};
  const handleSubmitInquiry = (...args: any[]): any => {};
  const handlePhotoFileUpload = (...args: any[]): any => {};
  const handleAddPhotoUrl = (...args: any[]): any => {};
  const handleRemovePhoto = (...args: any[]): any => {};
  const handleAddLink = (...args: any[]): any => {};
  const handleRemoveLink = (...args: any[]): any => {};
  const handleDeleteInquiry = (...args: any[]): any => {};
  const handleUpdateContactedStatus = (...args: any[]): any => {};
  const getActiveTimeLog = (...args: any[]): any => dummyProxy as any;
  const handleClockIn = (...args: any[]): any => {};
  const handleStartActivity = (...args: any[]): any => {};
  const handleEndActivity = (...args: any[]): any => {};
  const handleClockOut = (...args: any[]): any => {};
  const getAgentTodayStats = (...args: any[]): any => dummyProxy as any;
  const handleDownloadInquiriesReport = (...args: any[]): any => {};
  const handleSetInquirySent = (...args: any[]): any => {};
  const handleReassignInquiry = (...args: any[]): any => {};
  const handleSetInquiryAnswered = (...args: any[]): any => {};
  const handleCopyCSVReport = (...args: any[]): any => {};
  const handleTLOverrideAgentStatus = (...args: any[]): any => {};
  const getActiveActivityElapsed = (...args: any[]): any => dummyProxy as any;
  const getTodayLog = (...args: any[]): any => dummyProxy as any;
  const handleDrag = (...args: any[]): any => {};
  const handleDrop = (...args: any[]): any => {};
  const handleScheduleFileChange = (...args: any[]): any => {};
  const handleManualRosterSubmit = (...args: any[]): any => {};
  const getShiftBadgeStyle = (...args: any[]): any => dummyProxy as any;
  const handleSubmitTabbyTamara = (...args: any[]): any => {};
  const handleSubmitTabbyTamaraComplaint = (...args: any[]): any => {};
  const handleSubmitClientComms = (...args: any[]): any => {};
  const handleConfirmTabbyTamara = (...args: any[]): any => {};
  const handleDeleteTabbyTamara = (...args: any[]): any => {};
  const handleTLCommentComplaint = (...args: any[]): any => {};
  const handleDeleteComplaint = (...args: any[]): any => {};
  const handleProcessClientComms = (...args: any[]): any => {};
  const handleDeleteClientComms = (...args: any[]): any => {};
  const handleTakeClientComm = (...args: any[]): any => {};
  const handleDirectoryFile = (...args: any[]): any => {};
  const handleExportCloudBackup = (...args: any[]): any => {};
  const handleMarkSingleNotifAsRead = (...args: any[]): any => {};
  const handleMarkAllNotifsAsRead = (...args: any[]): any => {};


  const { addSync, syncStatus, isPending: isSyncPending, error: syncError, clearError: clearSyncError, syncEngine } = useSync();
  const [forceOffline, setForceOffline] = useState<boolean>(() => {
    return localStorage.getItem('sync_force_offline') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sync_force_offline', String(forceOffline));
    if (forceOffline) {
      syncEngine.destroy();
    } else {
      syncEngine.processPending();
    }
  }, [forceOffline, syncEngine]);

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
        if (!res.ok) throw new Error('Weather API failed');
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
        } else {
          throw new Error('Weather API missing data');
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
      if (e.key === 'sched_schedules' && e.newValue) setSchedules(JSON.parse(e.newValue));
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
    const unsubSched = onSnapshot(collection(db, "schedules"), snap => {
      const arr = snap.docs.map(d => d.data() as ScheduledShift);
      setFirestoreSchedules(arr);
      localStorage.setItem('sched_schedules', JSON.stringify(arr));
    });
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
              <div className="bg-white dark:bg-slate-900/95 border border-amber-500/40 text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-2 max-w-sm border-l-4 border-l-amber-500 backdrop-blur-md animate-fade-in text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
                    <Bell className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-amber-400">📢 New Broadcast Posted!</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">By {latest.author || "System"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed italic">"{latest.message}"</p>
                  </div>
                </div>
                                <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-slate-200 dark:border-slate-700/5">
                  <button onClick={() => toast.dismiss((t as any).id)} className="px-3 py-1.5 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white rounded-lg text-xs font-bold transition-colors">Close</button>
                </div>
              </div>
            ));
          }
        }
      }
    });

    return () => {
      unsubUsers();
      unsubLogs();
      unsubSched();
      unsubAnnouncements();
    };
  }, []); return (
<>
<div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="h-full px-2 sm:px-4 md:px-6 lg:px-8 flex flex-col pt-4">
          <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700/10 p-3 sm:p-4 rounded-xl sm:rounded-3xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-md shadow-sm z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-indigo-500/20">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-200 font-display">Synq</h1>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-indigo-500 dark:text-indigo-300 font-extrabold uppercase tracking-wide">Work Portal</span>
                  {forceOffline ? (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[7px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-tighter cursor-pointer select-none" onClick={() => setForceOffline(false)} title="Click to go Online">
                      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></div>Forced Offline
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter cursor-pointer select-none" onClick={() => setForceOffline(true)} title="Click to force Offline">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>Online Sync
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
{/* Notification Center Trigger */}
                    <button
                      onClick={() => setIsNotifDrawerOpen(true)}
                      className="relative p-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 hover:bg-slate-50 dark:bg-slate-800/80 hover:border-slate-200 dark:border-slate-700/20 transition-all text-slate-600 dark:text-slate-300 hover:text-slate-700 cursor-pointer group flex items-center justify-center"
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
                </header>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center font-black text-sm text-slate-700">
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-700 truncate">{formatAgentName(currentUser.name)}</p>
                      <p className="text-[10px] uppercase tracking-widest font-mono text-indigo-300 font-semibold">
                        {currentUser.role === 'tl' ? '👑 Team Leader' : (supportAssignments[currentUser.name] ? '⚡ Support' : '👤 Agent')}
                      </p>
                    </div>
                  </div>

                  {/* Spotlight Profile Window - Bio & Daily Updates with real-time Firebase syncing */}
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/5 space-y-2.5 font-sans">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white0 font-bold">
                      <span>My Spotlight 🌟</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-normal uppercase ${
                        (currentUser.status || 'online') === 'online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 animate-pulse' :
                        (currentUser.status || 'online') === 'busy' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' :
                        (currentUser.status || 'online') === 'away' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/20 text-slate-500 dark:text-slate-400 border border-slate-500/25'
                      }`}>
                        {(currentUser.status || 'online')}
                      </span>
                    </div>

                    {/* Quick Profile Bio */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Short Bio:</label>
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
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-200 placeholder:text-white0 focus:outline-none focus:border-indigo-500/40 transition-all resize-none custom-scrollbar"
                      />
                    </div>

                    {/* Daily Updates small window */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Daily Updates / Focus: 📝</label>
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
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-lg px-2 py-1 text-[11px] text-indigo-300 placeholder:text-white0 focus:outline-none focus:border-purple-500/45 transition-all resize-none custom-scrollbar"
                      />
                    </div>
                  </div>

                  {supportAssignments[currentUser.name] && (
                    <div className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 p-2.5 rounded-lg space-y-1 font-sans">
                      <p className="font-extrabold uppercase tracking-widest text-[#a5b4fc] text-[8px]">Support Assigned By</p>
                      <p className="text-slate-700 font-semibold flex items-center gap-1">👑 {supportAssignments[currentUser.name].assignedBy}</p>
                      <p className="text-[8px] text-slate-500 dark:text-slate-400">{new Date(supportAssignments[currentUser.name].assignedAt).toLocaleString()}</p>
                    </div>
                  )}

                  {showInstallBtn && (
                    currentUser.role === 'tl' || 
                    currentUser.role === 'admin' || 
                    currentUser.role === 'director' || 
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
                          setSupportAssignments([]);
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
                      : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-700/60 hover:text-white border font-medium hover:scale-[1.01]';
                    
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
                        
                        {groupTitle("System Controls", "⚙️", "text-slate-500 dark:text-slate-400")}
                        {buildBtn("integrations", <Sparkles className="w-4 h-4 text-amber-400" />, "Integrations Hub", "bg-indigo-900/30 border-indigo-800")}
                        {buildBtn("directory", <Users className="w-4 h-4 text-cyan-600" />, "Headcount & Directory", "bg-slate-500/20 border-slate-500/30 text-slate-700 dark:text-slate-200")}
                        {buildBtn("tl-feedback", <MessageCircle className="w-4 h-4 text-pink-500" />, "Director Hub", "bg-pink-500/20 border-pink-500/30 text-pink-100")}
                        {buildBtn("qa-scorecard", <CheckCircle2 className="w-4 h-4 text-green-500" />, "QA Scorecards", "bg-green-500/20 border-green-500/30 text-green-100")}
                        {buildBtn("kpi-calculator", <Calculator className="w-4 h-4 text-purple-400" />, "KPIs Calculator", "bg-purple-500/20 border-purple-500/30 text-purple-100")}
                        {buildBtn("orders", <ShoppingBag className="w-4 h-4 text-fuchsia-400" />, "Team Orders & Food", "bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-100")}
                        {isMasterAdmin && buildBtn("admin", <ShieldCheck className="w-4 h-4 text-rose-600" />, "Super Admin Control", "bg-rose-900 border-rose-800")}
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
                        {buildBtn("report", <BarChart2 className="w-4 h-4 text-purple-500" />, "My Daily Performance Matrix", "bg-purple-900 border-purple-800")}

                        {groupTitle("My Planning & Leave", "📅", "text-blue-600")}
                        {buildBtn("schedules", <Calendar className="w-4 h-4" />, "My Schedule", "bg-blue-500/20 border-blue-500/30 text-blue-100")}
                        {buildBtn("apply", <PlusCircle className="w-4 h-4 text-emerald-400" />, "Submit Leave / Swap", "bg-emerald-500/20 border-emerald-500/30 text-emerald-100")}
                        {buildBtn("my-requests", <GitPullRequest className="w-4 h-4" />, "My Swap & Leave Requests", "bg-blue-500/20 border-blue-500/30 text-blue-100")}

                        {groupTitle("Shared Goodies", "☕", "text-fuchsia-400")}
                        {buildBtn("orders", <ShoppingBag className="w-4 h-4 text-fuchsia-400" />, "Team Orders & Food", "bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-100")}

                        {buildBtn("tl-feedback", <MessageCircle className="w-4 h-4 text-pink-500" />, "TL Hub", "bg-pink-500/20 border-pink-500/30 text-pink-100")}
                      </>
                     );
                  }
                })()}
              </nav>


              {/* Mini Standalone Disclaimer block */}
              <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700/5 text-[10px] text-slate-500 dark:text-slate-400 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold font-mono">
                  <Info className="w-3.5 h-3.5 text-indigo-400" /> STANDALONE COMPLIANT
                </div>
                <p>This web application executes and persists database operations client-side, enabling full utility offline or loaded locally on any PC.</p>
              </div>

            </div>


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
                      <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        Communication Queue Active
                        <span className="bg-rose-500/20 text-rose-300 text-[9px] px-2 py-0.5 rounded-full border border-rose-500/30 font-black">
                          {clientComms.filter(c => c.status === 'pending').length} REQUESTS
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-medium">
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
                        <div className="text-center sm:text-right px-4 py-2 bg-black/20 rounded-xl border border-slate-200 dark:border-slate-700/5 flex-1 sm:flex-initial">
                          <p className="text-[8px] text-white0 uppercase font-black tracking-tighter">Queue Time (Oldest)</p>
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
                              <span className="text-[9px] text-slate-500 dark:text-slate-400">{new Date(inq.sentAt || inq.answeredAt || inq.createdAt).toLocaleString()}</span>
                            </div>
                            {inq.status === 'sent' ? (
                              <p className="text-sm text-slate-700 dark:text-slate-200">
                                Your inquiry (<em>"{inq.text.substring(0, 50)}{inq.text.length > 50 ? '...' : ''}"</em>) was updated to <strong className="text-amber-400 font-bold uppercase">Sent</strong> by Team Leader <strong>{inq.sentBy}</strong>.
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                <p className="text-sm text-slate-700">
                                  🎉 Your inquiry has been <strong className="text-emerald-400 font-bold uppercase">Answered</strong> by Team Leader <strong>{inq.answeredBy}</strong>!
                                </p>
                                <div className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-indigo-200 italic leading-relaxed">
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
                              <span className="text-[9px] text-slate-500 dark:text-slate-400">{new Date(req.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-200">
                              Your <strong className="capitalize text-amber-400">{req.platform === 'one_time_payment' ? 'One Time' : req.platform}</strong> request for patient <strong className="text-slate-700 font-bold">{req.patientName}</strong> {req.fileNumber ? <>(File Number: <span className="font-mono font-bold text-slate-700 bg-white dark:bg-slate-900/50 px-1.5 py-0.5 rounded">{req.fileNumber}</span>)</> : ''} has been confirmed! Please contact the client now.
                            </p>
                            <div className="flex items-center gap-2.5 text-xs pt-1.5">
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Pending Contact Timer:</span>
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
                              <span className="text-[9px] text-slate-500 dark:text-slate-400">{new Date(comp.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-200">
                              Your complaint for patient <strong className="text-slate-700 font-bold">{comp.patientName}</strong> has been processed by the TL!
                              <br />
                              <span className="text-amber-300 font-semibold block mt-1.5 bg-black/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/5">💬 TL Comment: "{comp.tlComment}"</span>
                            </p>
                            <div className="flex items-center gap-2.5 text-xs pt-1.5">
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Pending Contact Timer:</span>
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
                      <h4 className="font-bold text-slate-700 text-base font-display">Roster Swaps Awaiting Your Agreement</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Other agents requested a swap with you. Please review and approve or decline them below.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {partnerPendingSwaps.map(req => (
                      <div key={req.id} className="p-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200 dark:border-slate-700/10 transition-all">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-700">
                            Swap requested by <span className="text-indigo-300 font-bold">{req.agentName}</span>
                          </p>
                          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                            <p>For Date: <span className="font-semibold text-slate-700">{formatDateNice(req.date)}</span></p>
                            <p>
                              Your proposed shift: <span className="text-amber-300 font-semibold">{req.swapWithShift}</span> &rarr; Their shift: <span className="text-emerald-300 font-semibold">{req.shift}</span>
                            </p>
                            {req.notes && (
                              <p className="italic text-slate-500 dark:text-slate-400 mt-1">" {req.notes} "</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700/5">
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
                  <div className="bg-slate-50 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                      <div className="relative group">
                        {currentUser.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700 shadow-xl" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-indigo-500/20 text-indigo-400 border-4 border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center text-3xl font-bold font-display uppercase">
                            {formatAgentName(currentUser.name).substring(0, 2)}
                          </div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity backdrop-blur-sm">
                          <span className="text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-1"><Upload className="w-3 h-3"/> Edit 📸</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const newUrl = ev.target?.result as string;
                                const updated = { ...currentUser, avatarUrl: newUrl };
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
                          <h2 className="text-3xl font-display font-black text-slate-700">
                            {formatAgentName(currentUser.name)} {currentUser.role === 'tl' ? '👑' : '🌟'}
                          </h2>
                          <p className="text-xs font-mono text-white0 uppercase tracking-widest bg-white dark:bg-slate-900/50 px-2 py-1 rounded mb-1">
                            LOB: {getAgentLOB(currentUser.name)} 🏢
                          </p>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
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
                             className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/80 transition-all cursor-pointer"
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
                             className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/80 transition-all cursor-pointer"
                           >
                             ✉️ Edit Email
                           </button>
                           <button 
                             onClick={() => {
                               const nextState = !soundEnabled;
                               setSoundEnabled(nextState);
                               if (nextState) triggerNotificationAlert();
                             }}
                             className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border rounded-lg transition-all cursor-pointer ${soundEnabled ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-white0 hover:text-slate-600 dark:text-slate-300'}`}
                           >
                             {soundEnabled ? '🔊 Sound: ON' : '🔈 Sound: OFF'}
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl p-5 relative overflow-hidden group">
                        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">📝 My Personal Inbox & Notes</h3>
                        <textarea className="w-full h-32 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 text-slate-700 p-3 rounded-xl focus:border-indigo-500 outline-none resize-none text-sm font-medium" placeholder="Write anything... scratchpad... thoughts... 💭"></textarea>
                      </div>

                      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl p-5 relative overflow-hidden shadow-inner flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">⏱️ Smart To-Do List</h3>
                          <select 
                            value={todoFilter}
                            onChange={e => setTodoFilter(e.target.value as any)}
                            className="bg-black/30 border border-slate-200 dark:border-slate-700/10 text-xs font-bold text-slate-600 dark:text-slate-300 rounded px-2 py-1 outline-none"
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
                            <input name="text" type="text" placeholder="I need to..." required className="flex-1 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 text-slate-700 px-3 py-2 text-sm rounded-xl outline-none focus:border-indigo-500" />
                            <select name="category" className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 text-slate-700 px-2 text-xs rounded-xl outline-none focus:border-indigo-500">
                              <option value="Work">Work</option>
                              <option value="Personal">Personal</option>
                              <option value="Urgent">Urgent</option>
                            </select>
                            <input name="mins" type="number" placeholder="Mins?" title="Remind in X mins" min="1" className="w-20 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 text-slate-700 px-2 py-2 text-sm rounded-xl outline-none focus:border-indigo-500 text-center" />
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-indigo-500/20">+</button>
                          </div>
                        </form>
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[200px] pr-1">
                          {todos.filter(t => t.agentName === currentUser.name && (todoFilter === 'All' || t.category === todoFilter)).length === 0 ? (
                            <div className="text-center text-white0 text-xs py-6 italic">No tasks yet. Enjoy your free time! 🏖️</div>
                          ) : (
                            todos.filter(t => t.agentName === currentUser.name && (todoFilter === 'All' || t.category === todoFilter)).map(t => (
                              <div key={t.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${t.isCompleted ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/30 opacity-60' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm'}`}> 
                                <input type="checkbox" checked={t.isCompleted} onChange={() => {
                                  const done = !t.isCompleted;
                                  updateDoc(doc(db, "todos", t.id), { isCompleted: done }).catch(console.error);
                                  if (done) addSystemNotification('🎉 Goal Reached!', `You completed: "${t.text}" Awesome job! 🚀`, 'general', 'personal');
                                }} className="w-4 h-4 rounded text-indigo-500 accent-indigo-500 bg-white dark:bg-slate-900" />
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium truncate ${t.isCompleted ? 'line-through text-white0' : 'text-slate-700 dark:text-slate-200'}`}>{t.text}</p>
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
                                }} className="text-white0 hover:text-rose-400 transition-colors p-1"><X className="w-3 h-3"/></button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Activity & Data Vault Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/5 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Activity className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-700">Device Status</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Current workspace local health & sync</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Cloud Sync</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Synced
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Persistence Engine</span>
                            <span className="text-xs font-bold text-indigo-400 uppercase">IndexedDB Offline</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Local OS</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
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
                  const closedComplaints = opComplaints.filter(i => i.status === 'resolved' || i.status === 'closed');
                  
                  const opComms = clientComms.filter(c => isInOpDay(c.createdAt) && isAllowedToView(c.callCenterAgentName || ''));
                  const contactedComms = opComms.filter(i => i.status === 'contacted' || i.status === 'resolved' || i.status === 'closed_no_answer');
                  
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
                          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            📢 Important Account Notice: New Log In Format!
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            The system now uses a cleaner, simplified username format instead of full names. Everyone was securely logged out.
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Your Login ID:</span>
                            <code className="px-2.5 py-1 bg-black/40 border border-slate-200 dark:border-slate-700/10 rounded-lg text-xs font-mono text-cyan-300">
                              first_letter.last_name
                            </code>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">• e.g., Hesham Sobhy enters</span>
                            <code className="px-2 py-0.5 bg-black/40 border border-slate-200 dark:border-slate-700/5 rounded-md text-xs font-mono text-amber-300 font-bold">
                              h.sobhy
                            </code>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                            * Your pre-agreed passwords remain exactly the same.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* View Mode Switching Tab Toggles */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-2.5 rounded-3xl select-none">
                      <div className="flex bg-black/30 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/5 w-full sm:w-auto">
                        <button
                          onClick={() => setDashboardViewMode('personal')}
                          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            dashboardViewMode === 'personal'
                              ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 text-slate-700 border border-indigo-500/40 font-bold shadow-md shadow-indigo-500/10'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-700'
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
                              ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 text-slate-700 border border-indigo-500/40 font-bold shadow-md shadow-indigo-500/10'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          Team Daily Dashboard
                        </button>
                      </div>

                      {dashboardViewMode === 'personal' && (
                        <div className="flex bg-black/30 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/5 w-full sm:w-auto justify-between">
                          {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setAgentDashboardTab(tab)}
                              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                agentDashboardTab === tab
                                  ? 'bg-indigo-500 text-white shadow font-black'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-700'
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
                                    <h3 className="font-extrabold text-slate-700 text-base font-display">Agent Prestige & Gamification Room</h3>
                                  </div>
                                  <p className="text-slate-500 dark:text-slate-400 text-xs font-sans">Dynamic level tracking, badges, and operational performance reward indicators</p>
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/25">
                                  <span className="text-[10px] font-black text-indigo-300 font-mono tracking-wider">LEVEL {agentLevel} OPERATIONS EXPERT</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6 pt-2 font-sans">
                                {/* Level Tracker */}
                                <div className="bg-black/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/5 space-y-3.5 flex flex-col justify-between">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Level Upgrade Status</span>
                                    <span className="text-xs text-indigo-300 font-mono font-bold">{xpScore} total XP</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="w-full h-3 rounded-full bg-white dark:bg-slate-900/50 p-0.5 border border-slate-200 dark:border-slate-700/5 overflow-hidden">
                                      <div style={{ width: `${levelProgress}%` }} className="h-full bg-gradient-to-r from-[#22d3ee] to-[#6366f1] rounded-full transition-all duration-1000" />
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 pt-0.5 font-mono">
                                      <span>Level {agentLevel}</span>
                                      <span>Level {agentLevel + 1} ({!isNaN(Math.round(100 - levelProgress)) ? Math.round(100 - levelProgress) : 0}% remaining)</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Achievement Badges Room */}
                                <div className="bg-black/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/5 space-y-2.5">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Unlocked Badges</span>
                                  <div className="flex flex-wrap gap-2.5 font-sans">
                                    {holdsGoldPunctuality ? (
                                      <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5" title="Worked more than 120 minutes overall on shifts.">
                                        <Sparkles className="w-3 h-3 text-yellow-400" /> Duty Star
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-white dark:bg-slate-900/50 text-white0 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 opacity-40">
                                        Duty Star (Locked)
                                      </span>
                                    )}

                                    {isGrandmasterResovler ? (
                                      <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5" title="Handled more than 25 ticket resolutions in total.">
                                        <Activity className="w-3 h-3 text-rose-400" /> Resolve King
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-white dark:bg-slate-900/50 text-white0 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 opacity-40" title="Need 25 total resolutions">
                                        Resolve King (Locked)
                                      </span>
                                    )}

                                    {isTeamCommunicator ? (
                                      <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5" title="Registered communication requests">
                                        <MessageSquare className="w-3 h-3 text-cyan-400" /> Talk Champion
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-white dark:bg-slate-900/50 text-white0 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 opacity-40" title="Need 10 communication requests">
                                        Talk Master (Locked)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Instant Stats overview Card */}
                                <div className="bg-black/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/5 flex items-center justify-between font-sans">
                                  <div className="space-y-0.5 text-left">
                                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider font-mono">Operations Badge Rank</span>
                                    <p className="text-xl font-bold text-slate-700 font-display">
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
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-5 backdrop-blur-xl">
                                <div>
                                  <h2 className="text-xl font-black text-slate-700 font-display">My Daily Work Dashboard</h2>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Track, filter and audit your single-shift logs for <strong className="text-indigo-300 font-mono">{range.startLabel}</strong>
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl p-1 self-stretch sm:self-auto justify-between">
                                  <button
                                    onClick={() => {
                                      const d = new Date(selectedDashboardDate);
                                      d.setDate(d.getDate() - 1);
                                      setSelectedDashboardDate(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-1.5 hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-700 transition-all cursor-pointer text-xs"
                                  >
                                    &larr; Prev
                                  </button>
                                  <span className="text-slate-700 font-bold text-xs font-mono px-3">{formatDateNice(selectedDashboardDate).split(',')[0]}</span>
                                  <button
                                    onClick={() => {
                                      const d = new Date(selectedDashboardDate);
                                      d.setDate(d.getDate() + 1);
                                      setSelectedDashboardDate(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-1.5 hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-700 transition-all cursor-pointer text-xs"
                                  >
                                    Next &rarr;
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-fade-in">
                                <div className="md:col-span-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
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
                                      <span className="text-2xl font-black text-slate-700 font-mono">{!isNaN(Math.round(myDailySuccessRate)) ? Math.round(myDailySuccessRate) : 0}%</span>
                                      <span className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Resolved</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 font-medium">
                                    Completed <strong className="text-slate-700 font-mono">{myDailyCompleted}</strong> of <strong className="text-slate-700 font-mono">{myDailyTotal}</strong> assigned operations.
                                  </p>
                                </div>

                                <div className="md:col-span-8 grid grid-cols-2 gap-4">
                                  <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                    className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl flex flex-col justify-between hover:bg-slate-50 dark:bg-slate-800/80 transition-colors"
                                  >
                                    <div className="flex justify-between items-center text-indigo-400">
                                      <HelpCircle className="w-4 h-4" />
                                      <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300">Inquiries</span>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-2xl font-mono text-slate-700 font-black">{myDailyInq.length}</p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Medical Qs Logged</p>
                                    </div>
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                                    className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl flex flex-col justify-between hover:bg-slate-50 dark:bg-slate-800/80 transition-colors"
                                  >
                                    <div className="flex justify-between items-center text-emerald-400">
                                      <Wallet className="w-4 h-4" />
                                      <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">Fintech</span>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-2xl font-mono text-slate-700 font-black">{myDailyFin.length}</p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tabby & Tamara Link Requests</p>
                                    </div>
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
                                    className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl flex flex-col justify-between hover:bg-slate-50 dark:bg-slate-800/80 transition-colors"
                                  >
                                    <div className="flex justify-between items-center text-pink-400">
                                      <MessageSquare className="w-4 h-4" />
                                      <span className="text-[9px] font-mono bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded text-pink-300">Client Comms</span>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-2xl font-mono text-slate-700 font-black">{myDailyCom.length}</p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Client Dials Handled</p>
                                    </div>
                                  </motion.div>

                                  {currentUser.role === 'agent' && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
                                    className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl flex flex-col justify-between hover:bg-slate-50 dark:bg-slate-800/80 transition-colors"
                                  >
                                    <div className="flex justify-between items-center text-cyan-400">
                                      <Clock className="w-4 h-4 animate-pulse" />
                                      <span className="text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">Shift</span>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-[14px] font-mono text-slate-700 font-bold truncate">{clockInStr} - {clockOutStr}</p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Shift Active Stream</p>
                                    </div>
                                  </motion.div>
                                  )}
                                </div>
                              </div>

                              {currentUser.role === 'agent' && (
                              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-5 backdrop-blur-md">
                                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4">
                                  <AlertTriangle className="w-4 h-4 text-pink-400" />
                                  Punctuality & Sub-Session Allowance Logs
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase">Schedule Compliance</p>
                                      <p className={`text-sm font-bold mt-0.5 ${isLate ? 'text-pink-400' : 'text-emerald-400'}`}>
                                        {myDailyLog ? (isLate ? '⏰ Over Grace Period' : '✓ Standard On Time') : 'No shift logged'}
                                      </p>
                                    </div>
                                    <Calendar className="w-4 h-4 text-white0" />
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.05 }}
                                    className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase">Total Active Work</p>
                                      <p className="text-sm font-bold text-slate-700 mt-0.5 font-mono">
                                        {totalHoursDecimal > 0 ? `${totalHoursDecimal.toFixed(2)} Hrs` : '0 Hrs'}
                                      </p>
                                    </div>
                                    <Clock className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                    className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase">Restroom duration</p>
                                      <p className={`text-sm font-mono font-bold mt-0.5 ${restroomMins > 10 ? 'text-pink-400 animate-pulse' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {!isNaN(Math.round(restroomMins)) ? Math.round(restroomMins) : 0} min <span className="text-[10px] text-white0">/ 10m cap</span>
                                      </p>
                                    </div>
                                    <Coffee className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                  </motion.div>

                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.15 }}
                                    className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase">Breaks & Lunch Used</p>
                                      <p className={`text-sm font-mono font-bold mt-0.5 ${breakMins + lunchMins > 45 ? 'text-pink-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {!isNaN(Math.round(breakMins + lunchMins)) ? Math.round(breakMins + lunchMins) : 0} min <span className="text-[10px] text-white0">/ 45m cap</span>
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
                              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 backdrop-blur-xl">
                                <h3 className="text-xl font-black text-slate-700 font-display">Weekly Work Output & Trends</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  Your total resolving productivity and tracked clock-in hours for the last 7 calendar days
                                </p>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                                <div className="lg:col-span-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-2">Daily Interactions Handled</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">Visual distribution representing active day outputs</p>
                                  </div>

                                  <div className="h-48 flex items-end justify-between gap-3 pt-6 relative border-b border-slate-200 dark:border-slate-700/10 px-2 select-none">
                                    {weeklyDataPoints.map((dp, idx) => {
                                      const barHeightPercent = (dp.total / peakWeeklyDayVolume) * 75;
                                      return (
                                        <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-transparent border border-indigo-400 px-2 py-1 rounded text-[10px] text-slate-700 font-mono transition-opacity duration-200 z-10 font-bold whitespace-nowrap shadow-xl">
                                            {dp.total} tasks | {dp.hours.toFixed(1)} hrs
                                          </div>

                                          <div 
                                            className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-indigo-500/40 via-cyan-500/20 to-indigo-500/10 border border-indigo-500/30 group-hover:from-cyan-400 group-hover:to-pink-500 transition-all duration-300"
                                            style={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                                          />

                                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 font-sans tracking-tight mt-2 rotate-12 sm:rotate-0">
                                            {dp.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="lg:col-span-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4">Weekly Summary Stats</h4>
                                    
                                    <div className="space-y-4">
                                      <div className="p-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl">
                                        <span className="text-[10px] text-white0 uppercase tracking-widest font-black">Aggregate Resolved Tasks</span>
                                        <div className="flex items-baseline gap-2 mt-1">
                                          <span className="text-3xl font-mono text-slate-700 font-black">{totalWeeklyCount}</span>
                                          <span className="text-xs text-slate-500 dark:text-slate-400">Total inputs</span>
                                        </div>
                                      </div>

                                      <div className="p-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl">
                                        <span className="text-[10px] text-white0 uppercase tracking-widest font-black">Logged Clock Duration</span>
                                        <div className="flex items-baseline gap-2 mt-1">
                                          <span className="text-3xl font-mono text-cyan-400 font-black">{totalWeeklyHours.toFixed(1)}</span>
                                          <span className="text-xs text-slate-500 dark:text-slate-400">Hours overall</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t border-slate-200 dark:border-slate-700/5 mt-6 pt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    ✓ Average of <strong className="text-slate-700">{(totalWeeklyCount / 7).toFixed(1)}</strong> complete ticket conversions per shift day this week.
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
                              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 backdrop-blur-xl">
                                <h3 className="text-xl font-black text-slate-700 font-display">Monthly Performance & Achievement Desk</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  Your professional rolling 30-day index of achievements, punctuality indices, and work volumes
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                                <div className="md:col-span-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 flex flex-col items-center justify-between text-center">
                                  <div>
                                    <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Motivational Badge Status</span>
                                    <h4 className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-tight">System Tier Rating</h4>
                                  </div>

                                  <div className="my-8 flex flex-col items-center">
                                    <span className="text-6xl animate-bounce duration-1000 select-none pb-2">{badgeIcon}</span>
                                    <div className={`mt-4 px-4 py-2 border rounded-2xl bg-gradient-to-r text-base font-black uppercase tracking-wider ${badgeGradient}`}>
                                      {badgeTitle}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mt-4 leading-relaxed font-semibold">
                                      "{badgeDesc}"
                                    </p>
                                  </div>

                                  <div className="text-[10px] text-white0 font-mono font-black uppercase tracking-widest">
                                    Calculated Live from Database logs
                                  </div>
                                </div>

                                <div className="md:col-span-7 space-y-4">
                                  <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl backdrop-blur-md">
                                    <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4">30-Day Operation Ratios</h4>
                                    
                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 mb-1">
                                          <span className="font-bold">Total Operations Logs</span>
                                          <span className="font-mono font-black text-slate-700">{myMonthlyTotalCount} Files Handled</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-white dark:bg-slate-900/50 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/5">
                                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min((myMonthlyTotalCount / 120) * 100, 100)}%` }} />
                                        </div>
                                      </div>

                                      {currentUser.role === 'agent' && (
                                      <div>
                                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 mb-1">
                                          <span className="font-bold">Shift Punctuality Score</span>
                                          <span className="font-mono font-black text-emerald-400">{punctScore.toFixed(0)}% On Time</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-white dark:bg-slate-900/50 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/5">
                                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${punctScore}%` }} />
                                        </div>
                                      </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3 font-sans">
                                    <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl text-center">
                                      <span className="text-[9px] text-white0 uppercase font-black">Medical Qs</span>
                                      <p className="text-xl font-mono text-slate-700 font-black mt-1">{monthlyInq.length}</p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl text-center">
                                      <span className="text-[9px] text-[#22d3ee] uppercase font-black">Fintech Cash</span>
                                      <p className="text-xl font-mono text-slate-700 font-black mt-1">{monthlyFin.length}</p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl text-center">
                                      <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black font-sans">Dials Handled</span>
                                      <p className="text-xl font-mono text-slate-700 font-black mt-1">{monthlyCom.length}</p>
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
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-5 backdrop-blur-xl animate-fade-in">
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
                        <h2 className="text-2xl font-black text-slate-700 font-display mt-1">Daily Analytics & Operations</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Aggregating continuous shift cycles from <strong className="text-indigo-300 font-mono">07:00 AM</strong> to <strong className="text-indigo-300 font-mono">06:59 AM</strong> on next calendar day
                        </p>
                      </div>

                      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto">
                        {/* Search Filter for Floor Tracking */}
                        <div className="flex relative w-full lg:w-48">
                          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter by agent..."
                            value={dashboardSearchTeam}
                            onChange={(e) => setDashboardSearchTeam(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 text-slate-700 text-xs rounded-2xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                            spellCheck="false"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl p-1">
                          <button
                            onClick={() => {
                              const d = new Date(selectedDashboardDate);
                              d.setDate(d.getDate() - 1);
                              setSelectedDashboardDate(d.toISOString().split('T')[0]);
                            }}
                            className="p-2 hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-700 transition-all cursor-pointer"
                          >
                            &larr;
                          </button>
                          <input
                            type="date"
                            value={selectedDashboardDate}
                            onChange={(e) => {
                              if (e.target.value) setSelectedDashboardDate(e.target.value);
                            }}
                            className="bg-transparent border-0 text-slate-700 font-bold text-xs font-mono outline-none focus:ring-0 cursor-pointer px-2"
                          />
                          <button
                            onClick={() => {
                              const d = new Date(selectedDashboardDate);
                              d.setDate(d.getDate() + 1);
                              setSelectedDashboardDate(d.toISOString().split('T')[0]);
                            }}
                            className="p-2 hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-700 transition-all cursor-pointer"
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
                                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/10 hover:bg-slate-50 dark:bg-slate-800/80'
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
                                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/10 hover:bg-slate-50 dark:bg-slate-800/80'
                            }`}
                          >
                            Yesterday
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Meta Interval Descriptor Banner */}
                    <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-pink-500/10 border border-indigo-500/15 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>Active Operational Period:</span>
                        <strong className="text-slate-700 font-mono bg-white dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/10">{range.startLabel}</strong>
                        <span>&rarr;</span>
                        <strong className="text-slate-700 font-mono bg-white dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/10">{range.endLabel}</strong>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono">
                        TimeZone: Real-time Live Sync
                      </span>
                    </div>

                    {/* Agent Excellence Team Leaderboard */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl shadow-sm text-slate-700 p-6 shadow-2xl space-y-4 text-left animate-fade-in font-sans">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-700/5 pb-3">
                        <div>
                          <h3 className="font-extrabold text-transparent bg-gradient-to-r from-yellow-300 via-indigo-200 to-amber-300 bg-clip-text text-lg font-display flex items-center gap-2">
                            <span>🏆</span>
                            Team Prestige Leaderboard
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Continuous gamified rankings based on resolved ticket weight and clock schedule adherence</p>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20 font-mono">
                          Gamified Arena
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Podium Top 3 */}
                        <div className="bg-black/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/5 space-y-3.5 flex flex-col justify-center">
                          <p className="text-[10px] text-white0 font-bold uppercase tracking-wider font-mono">Today's Prestige Podium</p>
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
                                    <div className="w-10 h-10 rounded-full bg-slate-400/20 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 text-sm relative">
                                      🥈
                                    </div>
                                    <div className="bg-gradient-to-t from-slate-400/10 to-slate-400/20 border border-slate-400/20 rounded-t-xl p-2 w-full text-center space-y-0.5">
                                      <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate">{formatAgentName(top3[1].name)}</p>
                                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold font-mono">{top3[1].xp} XP</p>
                                    </div>
                                  </div>
                                )}

                                {/* 1st Place */}
                                {top3[0] && (
                                  <div className="flex flex-col items-center space-y-2">
                                    <div className="w-12 h-12 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center font-bold text-slate-700 text-base relative -top-1 shadow-lg shadow-yellow-500/10">
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
                                    <div className="w-9 h-9 rounded-full bg-amber-600/20 border-2 border-amber-600 flex items-center justify-center font-bold text-slate-700 text-xs relative">
                                      🥉
                                    </div>
                                    <div className="bg-gradient-to-t from-amber-600/10 to-amber-600/20 border border-amber-600/20 rounded-t-xl p-2 w-full text-center space-y-0.5">
                                      <p className="text-[9px] font-black text-amber-300 truncate">{formatAgentName(top3[2].name)}</p>
                                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold font-mono">{top3[2].xp} XP</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Ranks list view */}
                        <div className="bg-black/35 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/5 space-y-2.5">
                          <p className="text-[10px] text-white0 font-bold uppercase tracking-wider font-mono">Operations Leaderboard Rankings</p>
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
                                  <div key={row.name} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/[0.02] border border-slate-200 dark:border-slate-700/5 p-2 rounded-xl text-xs font-sans">
                                    <div className="flex items-center gap-2.5">
                                      <span className="font-mono text-[10px] w-4 text-center text-white0 font-bold">#{rankIndex + 1}</span>
                                      <div className="text-left font-sans">
                                        <p className="font-bold text-slate-700 leading-normal">{row.name}</p>
                                        <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">{row.lob}</p>
                                      </div>
                                    </div>
                                    <span className="font-mono font-black text-[#22d3ee] bg-white dark:bg-slate-900/10 border border-[#22d3ee]/20 px-2 py-0.5 rounded-lg text-[9px]">
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
                      <div className="lg:col-span-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col items-center justify-center text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider mb-4">Day Resolve Efficiency</p>
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
                            <span className="text-3xl font-black text-slate-700 font-mono">{!isNaN(Math.round(operationsScore)) ? Math.round(operationsScore) : 0}%</span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Completed</span>
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
                        <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl backdrop-blur-md hover:border-slate-200 dark:border-slate-700/20 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-blue-500/15 text-blue-400 rounded-2xl border border-blue-500/20">
                                <HelpCircle className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-[#38bdf8] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                {!isNaN(Math.round(resolutionRate)) ? Math.round(resolutionRate) : 0}% Resolved
                              </span>
                            </div>
                            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Inquiries Desk</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-3xl font-black text-slate-700 font-mono">{opInquiries.length}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Total received</span>
                            </div>
                          </div>
                          <div className="border-t border-slate-200 dark:border-slate-700/5 mt-4 pt-3 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                            <div>
                              <p className="text-slate-700 font-black font-mono">{answeredInquiries.length}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Answered</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-700 font-black font-mono">
                                {avgResTimeMin > 0 ? `${!isNaN(Math.round(avgResTimeMin)) ? Math.round(avgResTimeMin) : 0}m` : '-'}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Avg Speed of Answer</p>
                            </div>
                          </div>
                        </div>

                        {/* 2. Fintech Integration */}
                        <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl backdrop-blur-md hover:border-slate-200 dark:border-slate-700/20 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/20">
                                <Wallet className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                {!isNaN(Math.round(fintechRate)) ? Math.round(fintechRate) : 0}% Confirmed
                              </span>
                            </div>
                            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Fintech Orders</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-3xl font-black text-slate-700 font-mono">{opFintech.length}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Tabby/Tamara transactions</span>
                            </div>
                          </div>
                          <div className="border-t border-slate-200 dark:border-slate-700/5 mt-4 pt-3 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                            <div>
                              <p className="text-slate-700 font-black font-mono">{confirmedFintech.length}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Approved</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-700 font-black font-mono">
                                {opFintech.filter(f => f.platform === 'tabby').length}T | {opFintech.filter(f => f.platform === 'tamara').length}M
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Platform Shares</p>
                            </div>
                          </div>
                        </div>

                        {/* 3. Complaints & Comm Requests */}
                        <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl backdrop-blur-md hover:border-slate-200 dark:border-slate-700/20 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-rose-500/15 text-rose-400 rounded-2xl border border-rose-500/20">
                                <MessageSquare className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                {opComplaints.length > 0 ? `${Math.round((closedComplaints.length / opComplaints.length) * 100)}%` : '100%'} Closed
                              </span>
                            </div>
                            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Corporate Complaints</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-3xl font-black text-slate-700 font-mono">{opComplaints.length}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Logged complaints</span>
                            </div>
                          </div>
                          <div className="border-t border-slate-200 dark:border-slate-700/5 mt-4 pt-3 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                            <div>
                              <p className="text-slate-700 font-black font-mono">{closedComplaints.length}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Resolved</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-700 font-black font-mono">
                                {opComplaints.filter(c => c.status === 'pending_tl').length}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Awaiting TL Review</p>
                            </div>
                          </div>
                        </div>

                        {/* 4. Client Communication requests */}
                        <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl backdrop-blur-md hover:border-slate-200 dark:border-slate-700/20 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-indigo-500/15 text-indigo-400 rounded-2xl border border-indigo-500/20">
                                <MessageCircle className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                {opComms.length > 0 ? `${Math.round((contactedComms.length / opComms.length) * 100)}%` : '100%'} Contacted
                              </span>
                            </div>
                            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Client Communications</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-3xl font-black text-slate-700 font-mono">{opComms.length}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Total requests logged</span>
                            </div>
                          </div>
                          <div className="border-t border-slate-200 dark:border-slate-700/5 mt-4 pt-3 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                            <div>
                              <p className="text-slate-700 font-black font-mono">{contactedComms.length}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Assigned & Dialed</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-700 font-black font-mono">
                                {opComms.filter(c => c.status === 'pending').length}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Unassigned Backlog</p>
                            </div>
                          </div>
                        </div>

                        {/* 5. QA Performance */}
                        <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl backdrop-blur-md hover:border-green-500/30 transition-all flex flex-col justify-between cursor-pointer" onClick={() => setActiveTab('qa-scorecard')}>
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="p-2 bg-green-500/15 text-green-400 rounded-2xl border border-green-500/20">
                                <ShieldCheck className="w-5 h-5" />
                              </span>
                              <span className="text-right text-[10px] font-black uppercase tracking-widest text-green-300 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                QA Metrics
                              </span>
                            </div>
                            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">QA Score</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              {(() => {
                                const qas = qaScores.filter(q => isInOpDay(q.createdAt));
                                const avg = qas.length ? Math.round((qas.reduce((a, b) => a + (b.totalScore / b.maxTotalScore), 0) / qas.length) * 100) : null;
                                return (
                                  <>
                                    <span className={`text-3xl font-black font-mono ${avg && avg < 70 ? 'text-red-400' : 'text-slate-700'}`}>
                                      {avg !== null ? `${avg}%` : 'N/A'}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Average Performance</span>
                                    {/* We inject the values specifically here so they're in scope */}
                                    <span className="hidden qa-count">{qas.length}</span>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                          <div className="border-t border-slate-200 dark:border-slate-700/5 mt-4 pt-3 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                            <div>
                                {(() => {
                                  const qasLength = qaScores.filter(q => isInOpDay(q.createdAt)).length;
                                  return (
                                    <>
                                      <p className="text-slate-700 font-black font-mono">{qasLength}</p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Evaluations Today</p>
                                    </>
                                  )
                                })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hourly Load Distribution SVG Interactive Chart */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 backdrop-blur-xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-black text-slate-700 font-display">
                            Hourly Load & Density Distribution
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Continuous 24-hr layout of incoming transactional load and active staffing rosters
                          </p>
                        </div>

                        {/* Interactive Selector for metric inside SVG chart */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 p-1 rounded-xl">
                          {(['all', 'inquiries', 'fintech', 'presence'] as const).map((m) => (
                            <button
                              key={m}
                              onClick={() => setDashboardChartMetric(m)}
                              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                                dashboardChartMetric === m
                                  ? 'bg-indigo-500 text-white'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-700 hover:text-slate-700'
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
                                      <div className="bg-indigo-950/90 border border-indigo-400 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded text-center">
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
                        <div className="absolute bottom-1.5 inset-x-0 flex justify-between px-1 text-[9px] font-black text-slate-500 dark:text-slate-400 font-mono tracking-tight">
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
                      <div className="lg:col-span-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
                        <div>
                          <h3 className="text-base font-black text-slate-700 font-display flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            Channels & LOB Statistics
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
                                      <span className="font-bold text-slate-600 dark:text-slate-300">Social Media Load</span>
                                      <span className="text-slate-700 font-black font-mono">{socialInq} ({socialPercent}%)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white dark:bg-slate-900/50 rounded-full overflow-hidden">
                                      <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${socialPercent}%` }} />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-bold text-slate-600 dark:text-slate-300">Call Center Load</span>
                                      <span className="text-slate-700 font-black font-mono">{callInq} ({callPercent}%)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white dark:bg-slate-900/50 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${callPercent}%` }} />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-bold text-slate-600 dark:text-slate-300">Direct Case Records</span>
                                      <span className="text-slate-700 font-black font-mono">{opCases.length}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white dark:bg-slate-900/50 rounded-full overflow-hidden">
                                      <div className="h-full bg-pink-400 transition-all duration-1000" style={{ width: `${opCases.length > 0 ? 100 : 0}%` }} />
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Daily Schedule & Absenteeism Analysis */}
                        <div className="mt-6 p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
                                    <span className="font-bold text-slate-600 dark:text-slate-300">Roster Compliance</span>
                                    <span className={`font-mono font-black ${
                                      complianceRate >= 90 ? 'text-emerald-400' : complianceRate >= 75 ? 'text-amber-400' : 'text-pink-400'
                                    }`}>
                                      {complianceRate}%
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-white dark:bg-slate-900/50 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/5">
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
                                  <div className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl">
                                    <span className="text-[10px] uppercase font-black text-white0 tracking-wider">Scheduled</span>
                                    <p className="text-xl font-mono text-slate-700 font-black mt-0.5">{totalScheduled}</p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl">
                                    <span className="text-[10px] uppercase font-black text-white0 tracking-wider">Present</span>
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
                      <div className="lg:col-span-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 backdrop-blur-xl">
                        <h3 className="text-base font-black text-slate-700 font-display flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-cyan-400 animate-pulse" />
                          On-Duty Roster Timeline ({opTimeLogs.length} active logs)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold">
                          Live attendance, productivity timeline and status logs intersecting the 7 AM - 6:59 AM cycle
                        </p>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-700/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <th className="pb-3 text-slate-700">Agent</th>
                                <th className="pb-3">LOB</th>
                                <th className="pb-3">Shift Log Interval</th>
                                <th className="pb-3 text-center">Duration</th>
                                <th className="pb-3 text-right">Roster Timeline (7 AM - 7 AM)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-600 dark:text-slate-300">
                              {opTimeLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
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
                                      <td className="py-3 font-bold text-slate-700 whitespace-nowrap">{log.agentName}</td>
                                      <td className="py-3 whitespace-nowrap">
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300">
                                          {agentLOB}
                                        </span>
                                      </td>
                                      <td className="py-3 font-mono text-[11px] whitespace-nowrap">{displayInterval}</td>
                                      <td className="py-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                                        {minutesWorked > 0 ? (
                                          Math.floor(minutesWorked / 60) > 0 
                                            ? Math.floor(minutesWorked % 60) > 0 
                                              ? `${Math.floor(minutesWorked / 60)}h ${Math.floor(minutesWorked % 60)}m` 
                                              : `${Math.floor(minutesWorked / 60)}h`
                                            : `${Math.floor(minutesWorked)}m`
                                        ) : '0'}
                                      </td>
                                      <td className="py-3 text-right">
                                        <div className="w-24 sm:w-32 h-2.5 bg-white dark:bg-slate-900/50 rounded-full overflow-hidden inline-block relative border border-slate-200 dark:border-slate-700/5">
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
                      <h2 className="text-3xl font-bold text-slate-700 font-display">Approvals & Leave Console</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Reviewing pending requests and compliance logs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadFullCSV}
                        className="px-4 py-2.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/10 hover:border-slate-200 dark:border-slate-700/20 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Full CSV backup
                      </button>
                    </div>
                  </div>

                  {/* High Fidelity Performance Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm shadow-md">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">Pending Swaps</p>
                      <p className="text-4xl font-black text-slate-700">{pendingSwapsCount}</p>
                      <div className="w-full h-1 bg-slate-50 dark:bg-slate-800/80 mt-4 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${Math.min((pendingSwapsCount / (requests.length || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm shadow-md">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">Annual Leaves</p>
                      <p className="text-4xl font-black text-slate-700">{pendingAnnualsCount}</p>
                      <div className="w-full h-1 bg-slate-50 dark:bg-slate-800/80 mt-4 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${Math.min((pendingAnnualsCount / (requests.length || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm shadow-md">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">Approved Monthly</p>
                      <p className="text-4xl font-black text-slate-700">{totalApprovedThisMonth}</p>
                      <div className="w-full h-1 bg-slate-50 dark:bg-slate-800/80 mt-4 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${Math.min((totalApprovedThisMonth / (requests.length || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/6 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm shadow-md">
                      <p className="text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-1">Violations Blocked</p>
                      <p className="text-4xl font-black text-rose-300">{totalViolationsCount}</p>
                      <div className="w-full h-1 bg-slate-50 dark:bg-slate-800/80 mt-4 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${Math.min((totalViolationsCount / (requests.length || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Operations Live Wallboard & SLA Gauge */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl shadow-sm text-slate-700 p-6 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-700/5 pb-4">
                      <div>
                        <h3 className="font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-lg font-display flex items-center gap-2">
                          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                          Ops Live Command Center
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time Service Level Agreements, Queue Metrics, and AUX Occupancy</p>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-400 font-mono tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Synchronized Feed
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* SLA Gauge - SVG Circle representation */}
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/[0.02] border border-slate-200 dark:border-slate-700/5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="text-left">
                          <p className="text-[10px] uppercase font-bold text-white0 tracking-wider">Inquiry Queue SLA</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Target: &gt;95% within 2 min Response Goal</p>
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
                            <span className="text-2xl font-black text-slate-700 font-mono">96.4%</span>
                            <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">Met Goal</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/5 font-sans">
                          <span className="text-slate-500 dark:text-slate-400">Total processed today:</span>
                          <span className="font-bold text-slate-700 font-mono">{queueStats.processedToday} inquiries</span>
                        </div>
                      </div>

                      {/* Live Queue Monitor (Simulator Interface) */}
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/[0.02] border border-slate-200 dark:border-slate-700/5 rounded-2xl space-y-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="text-left">
                            <p className="text-[10px] uppercase font-bold text-white0 tracking-wider">Simulated In-Flow Queue</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Trigger mock client events to check operational response</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="bg-black/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/5 text-center">
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase font-sans">Active Calls</p>
                            <p className="text-lg font-black text-rose-450 font-mono mt-0.5 animate-pulse">{queueStats.activeCalls}</p>
                          </div>
                          <div className="bg-black/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/5 text-center">
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase font-sans">Hold Time</p>
                            <p className="text-lg font-black text-amber-300 font-mono mt-0.5">{queueStats.holdTime}s</p>
                          </div>
                          <div className="bg-black/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/5 text-center">
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase font-sans">Tasks open</p>
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
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/[0.02] border border-slate-200 dark:border-slate-700/5 rounded-2xl flex flex-col justify-between space-y-3">
                        <div className="text-left">
                          <p className="text-[10px] uppercase font-bold text-white0 tracking-wider">Live Activity Log</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Operations system ledger output</p>
                        </div>

                        <div className="bg-black/45 p-3 rounded-xl border border-slate-200 dark:border-slate-700/5 text-left font-mono text-[10px] space-y-1.5 h-24 overflow-y-auto leading-snug">
                          {liveOpsLogs.map((logStr, index) => {
                            const isLive = logStr.includes('[Operational]');
                            return (
                              <p key={index} className={isLive ? 'text-indigo-300' : 'text-slate-600 dark:text-slate-300'}>
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
                              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-left text-[9px] mb-0.5">Aux Occupancy ({activeTotal} Active on Shift)</p>
                              <div className="flex gap-1 h-3 rounded-full bg-white dark:bg-slate-900/50 overflow-hidden border border-slate-200 dark:border-slate-700/5">
                                <div style={{ width: `${(activeOnDuty / activeTotal) * 100}%` }} className="bg-emerald-400" title={`On-Duty Working: ${activeOnDuty}`} />
                                <div style={{ width: `${(activeAUXBreak / activeTotal) * 100}%` }} className="bg-amber-400" title={`Break: ${activeAUXBreak}`} />
                                <div style={{ width: `${(activeAUXMeeting / activeTotal) * 100}%` }} className="bg-cyan-500" title={`Team Meeting: ${activeAUXMeeting}`} />
                                <div style={{ width: `${(activeAUX1on1 / activeTotal) * 100}%` }} className="bg-violet-500" title={`1:1 Session: ${activeAUX1on1}`} />
                                <div style={{ width: `${(activeAUXRestroom / activeTotal) * 100}%` }} className="bg-pink-400" title={`Restroom AUX: ${activeAUXRestroom}`} />
                              </div>
                              <div className="flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-1">
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
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl backdrop-blur-xl flex flex-col shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700/10 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900/50 gap-3">
                      <div>
                        <h3 className="font-bold text-slate-700 text-lg font-display">Recent Approval Queue</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Review, flag or action latest roster change requests</p>
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
                        <thead className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/5 bg-white dark:bg-slate-900/40 backdrop-blur-lg/40">
                          <tr>
                            <th className="px-6 py-4 font-bold max-w-[20px]">
                              <input 
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-indigo-500 cursor-pointer"
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
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
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
                                <tr key={req.id} className="border-b border-slate-200 dark:border-slate-700/5 hover:bg-slate-700 transition-colors">
                                  <td className="px-6 py-4">
                                    <input 
                                      type="checkbox"
                                      className="w-4 h-4 rounded border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-indigo-500 cursor-pointer"
                                      checked={selectedPendingRequests.has(req.id)}
                                      onChange={(e) => {
                                        const next = new Set(selectedPendingRequests);
                                        if (e.target.checked) next.add(req.id);
                                        else next.delete(req.id);
                                        setSelectedPendingRequests(next);
                                      }}
                                    />
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-700">
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
                                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
                                    {isSwap ? (
                                      <div className="space-y-0.5">
                                        <p className="font-semibold text-slate-700">{formatDateNice((req as SwapRequest).date)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Shift: {(req as SwapRequest).shift}</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-0.5">
                                        <p className="font-semibold text-slate-700">
                                          {formatDateNice((req as AnnualRequest).startDate)}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          to {formatDateNice((req as AnnualRequest).endDate)}
                                        </p>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-[200px]">
                                    {isSwap ? (
                                      <div className="space-y-1">
                                        <p className="text-indigo-200">
                                          Swap Partner: <span className="font-semibold text-slate-700">{(req as SwapRequest).swapWithAgent}</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">"{(req as SwapRequest).notes || 'No comments'}"</p>
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
                                            details = `Request Type: Shift Swap\nAgent Name: ${s.agentName}\nSwap Date: ${s.date}\nShift: ${s.shift}\nSwap Partner Name: ${s.swapWithAgent}\nNotes: ${s.notes || 'None'}`;
                                          } else {
                                            const a = req as AnnualRequest;
                                            details = `Request Type: Annual Leave\nAgent Name: ${a.agentName}\nStart Date: ${a.startDate}\nEnd Date: ${a.endDate}\nNotes: ${a.notes || 'None'}`;
                                          }
                                          navigator.clipboard.writeText(details);
                                          toast.success('Approval request details copied!');
                                        }}
                                        className="p-1.5 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-700 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-700/5 hover:border-slate-200 dark:border-slate-700/15"
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
                      <h2 className="text-3xl font-bold text-slate-700 font-display">Full Shift Requests Log</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Comprehensive list of swaps, annual leaves and decision history</p>
                    </div>
                  </div>

                  {/* Filter Rail and Search Bar inside Frosted card */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl w-full md:w-auto self-stretch">
                      <button
                        onClick={() => setLogFilter('all')}
                        className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          logFilter === 'all' ? 'bg-indigo-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        All Categories
                      </button>
                      <button
                        onClick={() => setLogFilter('swap')}
                        className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          logFilter === 'swap' ? 'bg-indigo-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Shift Swaps
                      </button>
                      <button
                        onClick={() => setLogFilter('annual')}
                        className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          logFilter === 'annual' ? 'bg-indigo-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Annual Leaves
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="🔍 Search by agent name..."
                      className="flex-1 w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Logs Table */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[800px]">
                        <thead className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/5 bg-white dark:bg-slate-900/40 backdrop-blur-lg/40">
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
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                No records matching filters.
                              </td>
                            </tr>
                          ) : (
                            filteredLogs.map(req => {
                              const isSwap = req.type === 'swap';
                              return (
                                <tr key={req.id} className="border-b border-slate-200 dark:border-slate-700/5 hover:bg-slate-700 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-700">{req.agentName}</td>
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
                                        <p className="font-semibold text-slate-700">{(req as SwapRequest).date}</p>
                                        <p className="text-slate-500 dark:text-slate-400">Hours: {(req as SwapRequest).shift}</p>
                                        <p className="text-indigo-400">With: {(req as SwapRequest).swapWithAgent}</p>
                                      </div>
                                    ) : (
                                      <div className="text-xs">
                                        <p className="font-semibold text-slate-700">
                                          {(req as AnnualRequest).startDate} to {(req as AnnualRequest).endDate}
                                        </p>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">
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
                                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                                    {req.actionBy ? (
                                      <div className="space-y-1">
                                        <p className="text-slate-700">Resolved by <span className="font-semibold text-indigo-300">{req.actionBy}</span></p>
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
                                      <span className="text-white0">Awaiting leader review</span>
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

              {activeTab === 'report' && (
                <MetricsReport
                  currentUser={currentUser}
                  inquiries={inquiries}
                  tabbyTamaraRequests={tabbyTamaraRequests}
                  tabbyTamaraComplaints={tabbyTamaraComplaints}
                  clientComms={clientComms}
                  cases={cases}
                  timeLogs={timeLogs}
                />
              )}



              {/* Agent Form: Submit Requests (Only Agent) */}
              {currentUser.role === 'agent' && activeTab === 'apply' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-700 font-display">New Request Form</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Please select the requested change type below</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Shift Swap Module */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col space-y-5 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 font-display text-base">Request Shift Swap</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Must be requested 24 hours in advance.</p>
                        </div>
                      </div>

                      <form onSubmit={handleCreateSwap} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block" htmlFor="swap-date">Shift Date</label>
                          <input
                            id="swap-date"
                            type="date"
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 text-sm"
                            value={swapDate}
                            onChange={(e) => setSwapDate(e.target.value)}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block" htmlFor="swap-shift">Your Shift</label>
                            <select
                              id="swap-shift"
                              className="text-slate-700 w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-xl   focus:outline-none focus:border-indigo-500"
                              value={swapShift}
                              onChange={(e) => setSwapShift(e.target.value)}
                            >
                              {SHIFTS.map(s => (
                                <option key={s.id} value={s.label} className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">
                                  {s.display} ({s.label})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block" htmlFor="swap-target-shift">Target Shift</label>
                            <select
                              id="swap-target-shift"
                              className="text-slate-700 w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-xl   focus:outline-none focus:border-indigo-500"
                              value={swapTargetShift}
                              onChange={(e) => setSwapTargetShift(e.target.value)}
                            >
                              {SHIFTS.map(s => (
                                <option key={s.id} value={s.label} className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">
                                  {s.display} ({s.label})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block" htmlFor="swap-partner">Swap with Agent</label>
                          <select
                            id="swap-partner"
                            className="text-slate-700 w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-xl   focus:outline-none focus:border-indigo-500 font-medium"
                            value={swapTargetAgent}
                            onChange={(e) => setSwapTargetAgent(e.target.value)}
                            required
                          >
                            <option value="" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">-- Select Partner Agent --</option>
                            {agentsList
                              .filter(name => name !== currentUser?.name)
                              .map(name => (
                                <option key={name} value={name} className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">
                                  {name} ({getAgentLOB(name)})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block" htmlFor="swap-notes">Notes / Reason</label>
                          <textarea
                            id="swap-notes"
                            rows={2}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                            placeholder="State reason (e.g., family errand, doctor appointment)..."
                            value={swapNotes}
                            onChange={(e) => setSwapNotes(e.target.value)}
                          ></textarea>
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
                              ? 'bg-white dark:bg-slate-900/40/20 backdrop-blur-md text-white0 cursor-not-allowed border border-slate-200 dark:border-slate-700/5'
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 cursor-pointer'
                          }`}
                        >
                          <ArrowRight className="w-4 h-4" /> Apply for Swap (Awaiting TL)
                        </button>
                      </form>
                    </div>


                    {/* Annual Leave Module */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col space-y-5 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 font-display text-base">Request Annual Leave</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Must be requested 14 days in advance.</p>
                        </div>
                      </div>

                      <form onSubmit={handleCreateAnnual} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block" htmlFor="annual-start">Start Date</label>
                            <input
                              id="annual-start"
                              type="date"
                              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 text-sm"
                              value={annualStart}
                              onChange={(e) => setAnnualStart(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block" htmlFor="annual-end">End Date (Inclusive)</label>
                            <input
                              id="annual-end"
                              type="date"
                              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 text-sm"
                              value={annualEnd}
                              onChange={(e) => setAnnualEnd(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block" htmlFor="annual-notes">Comments / Leave justification</label>
                          <textarea
                            id="annual-notes"
                            rows={4}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                            placeholder="State comments..."
                            value={annualNotes}
                            onChange={(e) => setAnnualNotes(e.target.value)}
                          ></textarea>
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
                              ? 'bg-white dark:bg-slate-900/40/20 backdrop-blur-md text-white0 cursor-not-allowed border border-slate-200 dark:border-slate-700/5'
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
                    <h2 className="text-3xl font-bold text-slate-700 font-display">My Submission Logs</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Review status, comments and feedback on your submissions</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl backdrop-blur-xl p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700/10">
                      <h4 className="font-bold text-slate-700 text-base">Your Requests Logs</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Real-time status tracking</p>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {requests.filter(r => r.agentName === currentUser?.name).length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400 space-y-2">
                          <ClipboardList className="w-10 h-10 mx-auto text-indigo-400 opacity-50" />
                          <p>You haven't submitted any scheduling requests yet.</p>
                        </div>
                      ) : (
                        requests
                          .filter(r => r.agentName === currentUser?.name)
                          .map(req => {
                            const isSwap = req.type === 'swap';
                            return (
                              <div key={req.id} className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-2xl flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 hover:border-slate-200 dark:border-slate-700/10 transition-all">
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
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                      Submitted: {new Date(req.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>

                                  <div className="space-y-0.5">
                                    {isSwap ? (
                                      <p className="text-sm font-bold text-slate-700">
                                        Swap shift for <span className="text-indigo-300">{formatDateNice((req as SwapRequest).date)}</span>
                                      </p>
                                    ) : (
                                      <p className="text-sm font-bold text-slate-700">
                                        Leave duration: <span className="text-emerald-300">{formatDateNice((req as AnnualRequest).startDate)}</span> to <span className="text-emerald-300">{formatDateNice((req as AnnualRequest).endDate)}</span>
                                      </p>
                                    )}

                                    {isSwap && (
                                      <p className="text-xs text-slate-600 dark:text-slate-300">
                                        Your Shift: <span className="font-semibold">{(req as SwapRequest).shift}</span> / Swap with Partner: <span className="font-semibold text-slate-700">{(req as SwapRequest).swapWithAgent}</span> &bull; Shift: <span className="font-semibold">{(req as SwapRequest).swapWithShift}</span>
                                      </p>
                                    )}

                                    {req.notes && (
                                      <p className="text-slate-500 dark:text-slate-400 text-xs italic mt-1 font-sans">
                                        " {req.notes} "
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 self-stretch md:self-auto border-t md:border-t-0 border-slate-200 dark:border-slate-700/5 pt-3 md:pt-0">
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
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                        Actioned by Leader {req.actionBy}
                                      </p>
                                    </div>
                                  ) : req.status === 'declined_by_partner' ? (
                                    <div className="text-right">
                                      <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md text-xs font-bold flex items-center justify-end gap-1">
                                        <XCircle className="w-3.5 h-3.5" /> Declined by Partner
                                      </span>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
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
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
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
                                <div className="w-full mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/5 md:w-full md:block basis-full">
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
                    <h2 className="text-3xl font-bold text-slate-700 font-display">Inquiries Helpdesk</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-sans">Submit questions, attach screenshots/links, and track live resolutions from Team Leaders.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Submit Inquiry Form (Left Side / Col Span 1) */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-5 rounded-3xl backdrop-blur-xl space-y-5">
                      <h3 className="text-base font-bold text-slate-700 font-display flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/5 pb-3">
                        <HelpCircle className="w-5 h-5 text-indigo-400" />
                        Submit New Inquiry
                      </h3>

                      <form onSubmit={handleSubmitInquiry} className="space-y-4">
                        {/* Mandatory Clinic Name Dropdown */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block flex items-center justify-between">
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
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer focus:ring-1 focus:ring-indigo-500/30"
                            required
                          >
                            <option value="" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">-- Select Clinic * --</option>
                            <option value="dermadent" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Dermadent</option>
                            <option value="onetouch1" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 1 AlMu'tarid</option>
                            <option value="onetouch2" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 2 Markhaniya</option>
                            <option value="welltouch" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">WellTouch</option>
                            <option value="newedge" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">New Edge</option>
                          </select>
                        </div>

                        {/* Phone Number optionally */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                            Phone Number (Optional)
                          </label>
                          <input
                            type="tel"
                            placeholder="+966 5x xxx xxxx (Optional)"
                            value={inquiryPhoneNumber}
                            onChange={(e) => setInquiryPhoneNumber(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
                          />
                        </div>

                        {/* Inquiry text details with English or Arabic typing toggles */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Inquiry Details <span className="text-rose-400 font-extrabold">*</span></label>
                            
                            {/* Direction toggle options for Arabic/English */}
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 p-0.5 rounded-lg text-[10px]">
                              <button
                                type="button"
                                onClick={() => setInquiryLanguageDir('auto')}
                                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${inquiryLanguageDir === 'auto' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                title="Auto Detect Language Direction"
                              >
                                Auto 🌐
                              </button>
                              <button
                                type="button"
                                onClick={() => setInquiryLanguageDir('ltr')}
                                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${inquiryLanguageDir === 'ltr' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                title="Force English Mode (LTR)"
                              >
                                English 🇺🇸
                              </button>
                              <button
                                type="button"
                                onClick={() => setInquiryLanguageDir('rtl')}
                                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${inquiryLanguageDir === 'rtl' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
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
                            className={`w-full px-4 py-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans placeholder-slate-500 resize-none ${inquiryLanguageDir === 'rtl' ? 'text-right' : 'text-left'}`}
                          />
                        </div>

                        {/* Photos Upload & URLs Section */}
                        {currentUser?.role !== 'agent' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Attach Photos / Screenshots</label>
                            <span className="text-[10px] text-white0">Max size 2MB</span>
                          </div>
                          
                          {/* Drag and Drop or File Upload block */}
                          <div className="relative border border-dashed border-slate-200 dark:border-slate-700/10 hover:border-indigo-500/50 rounded-xl p-4 bg-black/20 text-center transition-all group">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handlePhotoFileUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <Upload className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-400 transition-all" />
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Choose Image or drag here</p>
                              <p className="text-[9px] text-white0">Supports JPG, PNG, WebP</p>
                            </div>
                          </div>

                          {/* Manual Image URL Paste */}
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <ImageIcon className="w-3.5 h-3.5 text-white0 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Or paste external image URL..."
                                value={tempPhotoUrlInput}
                                onChange={(e) => setTempPhotoUrlInput(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-all"
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
                                <div key={index} className="relative group aspect-square rounded-lg border border-slate-200 dark:border-slate-700/10 overflow-hidden bg-black/40">
                                  <img referrerPolicy="no-referrer" src={photo} alt="Attached" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(index)}
                                    className="absolute inset-0 bg-red-600/80 text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[10px] font-bold"
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
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Attach Links</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Link className="w-3.5 h-3.5 text-white0 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="e.g. ticket link, reference..."
                                value={tempLinkInput}
                                onChange={(e) => setTempLinkInput(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-all"
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
                                <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg text-xs">
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
                              <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-700/30 border-t-white rounded-full animate-spin" />
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
                      <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl backdrop-blur-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700/5 pb-4 mb-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-700 font-display">My Submission Timeline</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">View states and answers to all inquiries you have submitted.</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500 dark:text-slate-400">Total:</span>
                            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/15 text-indigo-300 font-bold rounded">
                              {inquiries.filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase()).length}
                            </span>
                          </div>
                        </div>

                        {/* Inquiries List */}
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                          {inquiries.filter(i => i.agentName?.toLowerCase() === currentUser?.name?.toLowerCase()).length === 0 ? (
                            <div className="text-center py-12">
                              <HelpCircle className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-2.5 animate-pulse" />
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No inquiries submitted yet. Submit a case above to get started!</p>
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
                                  <div key={inq.id} className="p-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl space-y-3 hover:border-slate-200 dark:border-slate-700/10 transition-all relative">
                                    {/* Top Info row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/5 pb-2">
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
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(inq.createdAt).toLocaleString()}</span>
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
                                      <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{inq.text}</p>
                                      
                                      {/* Display Photos */}
                                      {inq.photos && inq.photos.length > 0 && (
                                        <div className="space-y-1">
                                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">Attached Screenshots ({inq.photos.length}):</span>
                                          <div className="flex flex-wrap gap-2">
                                            {inq.photos.map((photo, pIdx) => (
                                              <a
                                                key={pIdx}
                                                href={photo}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/10 hover:border-indigo-500 transition-all bg-black/55 shrink-0"
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
                                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">References & Tickets:</span>
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
                                          <span className="text-[9px] text-white0">{new Date(inq.sentAt || '').toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
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
                                          <span className="text-[9px] text-white0">{new Date(inq.answeredAt || '').toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-emerald-200 font-semibold italic leading-relaxed font-sans">
                                          "{inq.answer}"
                                        </div>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 text-right">
                                          Answered by Leader <strong>{inq.answeredBy}</strong>
                                        </p>
                                      </div>
                                    )}

                                    {/* Customer Contacted Status Dropdown */}
                                    <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700/5">
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Customer Contact Status:</span>
                                      <select
                                        value={inq.customerContacted || 'not_contacted'}
                                        onChange={(e) => handleUpdateContactedStatus(inq.id, e.target.value as any)}
                                        className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
                                      >
                                        <option value="not_contacted" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg  font-sans">❌ Not Contacted</option>
                                        <option value="contacted" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg  font-sans">📞 Contacted</option>
                                        <option value="attempted" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg  font-sans">⏳ Contact Attempted</option>
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
                      <h2 className="text-3xl font-bold text-slate-700 font-display">Time Card & Clock Desk</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-sans">Clock in your shift, log your break, lunch, or restroom visits in real-time</p>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md/80 border border-slate-200 dark:border-slate-700/5 rounded-2xl flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-semibold">
                        System Year Context: {systemTime.getFullYear()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left & Middle Column (Main Control Desk) */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Live Desk Console Panel */}
                      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl shadow-sm text-slate-700 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-6">
                        
                        {/* Pulse glow background ornament */}
                        <div className="absolute top-10 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full -z-10 animate-pulse"></div>

                        {/* Top live digital clock display */}
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold font-mono">Current Live Time</p>
                          <p className="text-5xl font-black text-slate-700 font-mono tracking-tight drop-shadow-md">
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
                          let textStyle = "text-slate-500 dark:text-slate-400";
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
                            <div className="w-full max-w-md p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl text-left space-y-3 relative overflow-hidden">
                              <div className="flex justify-between items-center font-sans">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Elapsed {conf.name} Time:</span>
                                <span className="text-xs font-bold font-mono text-slate-700">
                                  {mins.toString().padStart(2, '0')}m {secs.toString().padStart(2, '0')}s
                                  {conf.limit > 0 ? ` / ${conf.limit}m` : ''}
                                </span>
                              </div>

                              {conf.limit > 0 && (
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-1000 ${conf.barColor}`}
                                      style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-[9px] text-white0 font-mono">
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
                                  className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-700 font-black text-base tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer font-display flex items-center justify-center gap-3 uppercase animate-pulse"
                                >
                                  <CheckCircle2 className="w-5 h-5 text-slate-700 shrink-0" />
                                  Clock In For Shift
                                </button>
                              );
                            }

                            return (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black font-mono">
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
                                        ? 'bg-amber-500/25 border-amber-400 text-slate-700 shadow-lg shadow-amber-500/15 scale-[1.03]'
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
                                        ? 'bg-pink-500/25 border-pink-400 text-slate-700 shadow-lg shadow-pink-500/15 scale-[1.03]'
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
                                        ? 'bg-cyan-500/25 border-cyan-400 text-slate-700 shadow-lg shadow-cyan-500/15 scale-[1.03]'
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
                                        ? 'bg-violet-500/25 border-violet-400 text-slate-700 shadow-lg shadow-violet-500/15 scale-[1.03]'
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
                                      className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-slate-700 font-black text-xs tracking-wider rounded-xl shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 uppercase font-display"
                                    >
                                      <ArrowRight className="w-4 h-4 text-slate-700" />
                                      End AUX & Resume Active Work
                                    </button>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/5 flex gap-3">
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
                      <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                        <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5 font-display"><Info className="w-4 h-4 text-indigo-400 shrink-0" /> Time-Tracking Rules & Compliance Policy</p>
                        Your shift attendance logs, break duration accuracy, and restroom usage are logged contextually to verify real-time coverage. Overstaying lunch limits (30 min) or break periods (15 min) flags an alarm notification to Team Leaders. Please clock out correctly at the end of every daily session.
                      </div>
                    </div>

                    {/* Right Column (My Today's Stats & chronological History Log) */}
                    <div className="space-y-6">
                      
                      {/* Daily aggregates */}
                      <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl space-y-4">
                        <h3 className="font-bold text-slate-700 text-sm font-display border-b border-slate-200 dark:border-slate-700/5 pb-2">Shift Aggregates (Today)</h3>
                        
                        {(() => {
                          const stats = getAgentTodayStats(currentUser.name);
                          
                          const clockInLabel = stats.clockIn ? new Date(stats.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Clocked In Yet';
                          const clockOutLabel = stats.clockOut ? new Date(stats.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (stats.clockIn ? 'Active Shift Running' : 'Pending Out');

                          return (
                            <div className="space-y-3 text-xs leading-normal font-sans">
                              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Clock-In Time:</span>
                                <span className="font-bold text-slate-700 font-mono">{clockInLabel}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Clock-Out Time:</span>
                                <span className="font-bold text-slate-700 font-mono">{clockOutLabel}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Total Breaks:</span>
                                <span className={`font-bold font-mono ${stats.breakMins > 15 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                                  {stats.breakMins.toFixed(2)} mins used / 15m max
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Total Lunch:</span>
                                <span className={`font-bold font-mono ${stats.lunchMins > 30 ? 'text-rose-400 animate-pulse' : 'text-pink-300'}`}>
                                  {stats.lunchMins.toFixed(2)} mins used / 30m max
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Restroom Total:</span>
                                <span className="font-bold text-indigo-300 font-mono">
                                  {stats.restroomMins.toFixed(2)} mins used
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Restroom Sessions:</span>
                                <span className="font-bold text-indigo-400 font-mono">
                                  {stats.restroomCount} visits
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Team Meeting:</span>
                                <span className={`font-bold font-mono ${stats.meetingMins > 60 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                                  {stats.meetingMins.toFixed(2)} mins used / 60m max
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">1:1 Session:</span>
                                <span className={`font-bold font-mono ${stats.oneOnOneMins > 30 ? 'text-rose-400 animate-pulse' : 'text-violet-300'}`}>
                                  {stats.oneOnOneMins.toFixed(2)} mins used / 30m max
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Personal Break:</span>
                                <span className={`font-bold font-mono ${stats.personalMins > 15 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
                                  {stats.personalMins.toFixed(2)} mins used / 15m max
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Personal historical activities listing */}
                      <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl space-y-4 max-h-[400px] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/5 pb-2">
                          <h3 className="font-bold text-slate-700 text-sm font-display">Time Card Sessions</h3>
                          <span className="text-[10px] text-white0 uppercase tracking-widest font-bold">Personal Feed</span>
                        </div>

                        {(() => {
                          const myLogs = timeLogs.filter(l => l.agentName?.toLowerCase() === currentUser?.name?.toLowerCase());
                          if (myLogs.length === 0) {
                            return (
                              <p className="text-center py-10 text-xs text-white0 italic font-sans">No historical activities found.</p>
                            );
                          }
                          return (
                            <div className="space-y-4 font-sans">
                              {myLogs.map(log => (
                                <div key={log.id} className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl space-y-2 text-xs">
                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-200 dark:border-slate-700/5 pb-1 font-mono">
                                    <span className="text-indigo-300 font-bold">{log.date}</span>
                                    <span className={`px-1.5 py-0.5 rounded ${log.status === 'clocked_out' ? 'bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md text-slate-500 dark:text-slate-400' : 'bg-emerald-500/15 text-emerald-300'}`}>
                                      {log.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-slate-600 dark:text-slate-300 leading-normal">
                                    <p>Shift Clock In: <span className="text-slate-700 font-semibold font-mono">{log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span></p>
                                    {log.clockOut && <p>Shift Clock Out: <span className="text-slate-700 font-semibold font-mono">{new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>}
                                    
                                    {log.activities.length > 0 && (
                                      <div className="pt-1.5 space-y-1">
                                        <p className="text-[10px] text-white0 uppercase font-black font-mono">Logged Sub-Sessions ({log.activities.length}):</p>
                                        <div className="pl-2 border-l border-slate-200 dark:border-slate-700/10 space-y-1 text-[11px] font-mono">
                                          {log.activities.map(act => (
                                            <p key={act.id} className="text-slate-500 dark:text-slate-400">
                                              &bull; <span className="font-medium capitalize text-slate-600 dark:text-slate-300 font-sans">{act.type}</span>:&nbsp;
                                              {new Date(act.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {act.endTime ? new Date(act.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                                              {act.durationMinutes !== undefined && <span className="text-indigo-300 font-mono font-bold"> ({act.durationMinutes}m)</span>}
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
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-700/5 pb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-700 font-display">Inquiries Analytics & Command Center</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-sans font-normal">Track live resolution, clinic load distributions, and download historical reports.</p>
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
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 font-display mb-1 flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-indigo-400" />
                          Inquiries Status Ratio
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Proportion of pending versus fully resolved client responses.</p>
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
                            <p className="text-xl font-black text-slate-700">{inquiries.length}</p>
                            <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Total</p>
                          </div>
                        </div>

                        {/* Chart Legend */}
                        <div className="space-y-2 text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
                            <span className="text-slate-600 dark:text-slate-300">Answered ({inquiries.filter(i => i.status === 'answered').length})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></span>
                            <span className="text-slate-600 dark:text-slate-300">Sent ({inquiries.filter(i => i.status === 'sent').length})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-sm"></span>
                            <span className="text-slate-600 dark:text-slate-300">Submitted ({inquiries.filter(i => i.status === 'submitted').length})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Panel 2: Clinic Volume Breakdown */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-5 rounded-3xl backdrop-blur-xl lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 font-display mb-1 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-emerald-400" />
                          Clinic Load Analysis & Distribution Chart
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Total inquiries incoming from each of the five mandatory medical clinics.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-2">
                        {[
                          { key: 'dermadent', display: 'Dermadent', color: 'from-blue-400 to-indigo-500', textCol: 'text-blue-300' },
                          { key: 'onetouch1', display: 'One Touch 1 AlMu\'tarid', color: 'from-teal-400 to-emerald-500', textCol: 'text-emerald-300' },
                          { key: 'onetouch2', display: 'One Touch 2 Markhaniya', color: 'from-cyan-400 to-blue-500', textCol: 'text-blue-300' },
                          { key: 'welltouch', display: 'WellTouch', color: 'from-pink-500 to-rose-500', textCol: 'text-rose-300' },
                          { key: 'newedge', display: 'New Edge', color: 'from-amber-400 to-orange-500', textCol: 'text-amber-300' }
                        ].map((clin) => {
                          const count = inquiries.filter(i => (i.clinicName || '').toLowerCase() === clin.key.toLowerCase()).length;
                          const pct = inquiries.length > 0 ? (count / inquiries.length) * 100 : 0;
                          return (
                            <div key={clin.key} className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 p-3 rounded-2xl flex flex-col justify-between hover:border-slate-200 dark:border-slate-700/10 transition-all select-none">
                              <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase truncate">{clin.display}</p>
                                <p className="text-2xl font-black text-slate-700 mt-1">{count}</p>
                              </div>

                              <div className="mt-4">
                                <div className="flex justify-between items-center text-[9px] text-white0 font-bold mb-1">
                                  <span>Ratio</span>
                                  <span className={clin.textCol}>{pct.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white dark:bg-slate-900/50 rounded-full overflow-hidden">
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
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-white0 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by agent name, LOB, text or answer values..."
                        value={inquirySearchQuery}
                        onChange={(e) => setInquirySearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans"
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
                              : 'border-slate-200 dark:border-slate-700/5 text-slate-500 dark:text-slate-400 bg-black/20 hover:text-slate-700'
                          }`}
                        >
                          {st === 'submitted' ? 'Submitted (Unresolved)' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inquiries Records display */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl space-y-4">
                    <div className="border-b border-slate-200 dark:border-slate-700/5 pb-3">
                      <h3 className="text-base font-bold text-slate-700 font-display">Inquiry Record Pipeline</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total matched cases waiting in queue: {
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
                          <MessageSquare className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">No inquiries match the search filters or the queue is currently empty.</p>
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
                              <div key={inq.id} className="p-5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl hover:border-slate-200 dark:border-slate-700/10 transition-all space-y-4 relative">
                                {/* Agent info, LOB and date */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/5 pb-2.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8.5 h-8.5 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-xs shadow">
                                      {inq.agentName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{inq.agentName}</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase tracking-wide bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 px-2 py-0.5 rounded font-sans">{getAgentLOB(inq.agentName)}</span>
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
                                      <span className="text-[9px] text-white0 font-mono">{new Date(inq.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const details = `*Agent Name:* ${inq.agentName}\n*Clinic:* ${inq.clinicName || 'N/A'}\n*Inquiry:*\n_ ${inq.text} _\n*Answer:*\n_ ${inq.answer || 'No answer yet'} _`;
                                        navigator.clipboard.writeText(details);
                                        toast.success('Inquiry details copied!');
                                      }}
                                      className="p-1 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-700 rounded-md transition-all shrink-0 flex items-center gap-1 cursor-pointer"
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
                                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{inq.text}</p>

                                  {/* Render attachments */}
                                  {inq.photos && inq.photos.length > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">Screenshots / Attachments ({inq.photos.length}):</span>
                                      <div className="flex flex-wrap gap-2">
                                        {inq.photos.map((photo, pIdx) => (
                                          <a
                                            key={pIdx}
                                            href={photo}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/10 hover:border-indigo-400 transition-all bg-black/55 shrink-0"
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
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">Agent Reference Links ({inq.links.length}):</span>
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
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/5 space-y-3">
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
                                      <div className="flex justify-between items-center text-[10px] font-mono text-white0 border-b border-emerald-500/5 pb-1 max-sm:flex-wrap gap-1">
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
                                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/5">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                                      👤 Reassign Agent:
                                    </span>
                                    <select
                                      value={inq.agentName}
                                      onChange={(e) => handleReassignInquiry(inq.id, e.target.value)}
                                      className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
                                    >
                                      {agentsList.map(aName => (
                                        <option key={aName} value={aName} className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg  font-sans">
                                          {aName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Dialog for answering inside pipeline cards */}
                                  {answeringInquiryId === inq.id && (
                                    <div className="p-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-xl space-y-3 animate-fade-in text-left">
                                      <div className="flex justify-between items-center pb-1">
                                        <h4 className="text-xs font-bold text-slate-700 font-display">Feed Back / System Answer Details</h4>
                                        <button
                                          onClick={() => {
                                            setAnsweringInquiryId(null);
                                            setCurrentAnswerText('');
                                          }}
                                          className="text-slate-500 dark:text-slate-400 text-xs hover:text-slate-700"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                      <textarea
                                        placeholder="Type the response/answer details clearly..."
                                        value={currentAnswerText}
                                        onChange={(e) => setCurrentAnswerText(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-emerald-500 transition-all font-sans resize-none"
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
                <div id="tl-timelog-view-root" className="space-y-6 animate-fade-in col-span-1 border border-slate-200 dark:border-slate-700/5 p-2 bg-transparent/20 rounded-3xl">
                  
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-2">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-700 font-display">Your RTM (Real-Time Monitoring) Command Center</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-sans">Command center to track shift times, restroom visits, or live-status breaks</p>
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
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md hover:bg-slate-700 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                      >
                        <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
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
                    <div className="p-8 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-3xl space-y-6 animate-fade-in text-slate-700 print:p-0 print:bg-slate-50 dark:bg-slate-800 print:text-black">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/10 pb-4 print:border-black">
                        <div>
                          <h3 className="text-xl font-extrabold font-display uppercase tracking-wider">DAILY MASTER ATTENDANCE & TIMECARD REPORT</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono print:text-black mt-1">Generated: {currentTime.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => window.print()}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 print:hidden"
                        >
                          <Printer className="w-4 h-4" /> Trigger Browser Print
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans print:gap-2">
                        <div className="p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-xl print:border-black print:bg-transparent print:text-black">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold font-mono">Date Context</p>
                          <p className="text-sm font-bold mt-0.5">{currentTime.toLocaleDateString()}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-xl print:border-black print:bg-transparent print:text-black">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold font-mono">Total Agents on Duty</p>
                          <p className="text-sm font-bold mt-0.5">{activeAgentsForUI.filter(a => getActiveTimeLog(a)).length} of {activeAgentsForUI.length}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-xl print:border-black print:bg-transparent print:text-black">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold font-mono">Active on Break/Lunch</p>
                          <p className="text-sm font-bold mt-0.5">
                            {activeAgentsForUI.filter(a => {
                              const active = getActiveTimeLog(a);
                              return active && (active.status === 'break' || active.status === 'lunch');
                            }).length} agents
                          </p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-xl print:border-black print:bg-transparent print:text-black">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold font-mono">Compliance Warnings</p>
                          <p className="text-sm font-bold text-rose-400 mt-0.5 print:text-black">
                            {activeAgentsForUI.filter(a => {
                              const stats = getAgentTodayStats(a);
                              return stats.breakMins > 15 || stats.lunchMins > 30;
                            }).length} overtime flags
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/10 rounded-2xl print:border-black">
                        <table className="w-full text-left border-collapse text-xs print:text-black">
                          <thead>
                            <tr className="bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/10 text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono print:border-black print:bg-transparent print:text-black">
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
                                    {agent} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal lowercase bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md px-1.5 py-0.5 rounded ml-2 font-sans">{getAgentLOB(agent)}</span>
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
                                      'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                                    }`}>
                                      {statusText}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 font-mono">{stats.clockIn ? new Date(stats.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                  <td className="px-3 py-3 font-mono">{stats.clockOut ? new Date(stats.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (stats.clockIn ? 'Active Running' : '--:--')}</td>
                                  <td className="px-3 py-3 font-mono">{stats.breakMins.toFixed(1)} m</td>
                                  <td className="px-3 py-3 font-mono">{stats.lunchMins.toFixed(1)} m</td>
                                  <td className="px-4 py-3 font-mono">{stats.restroomMins.toFixed(1)} m ({stats.restroomCount}x)</td>
                                  <td className="px-3 py-3 font-mono text-cyan-400">{stats.meetingMins.toFixed(1)} m</td>
                                  <td className="px-3 py-3 font-mono text-violet-400">{stats.oneOnOneMins.toFixed(1)} m</td>
                                  <td className="px-3 py-3 font-mono text-emerald-400">{stats.personalMins.toFixed(1)} m</td>
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
                          className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-white dark:bg-slate-900/40/20 backdrop-blur-md cursor-pointer print:hidden"
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
                          { id: 'offline', label: 'Offline / Clocked Out', count: 0, agents: [] as string[], bgClass: 'bg-white dark:bg-slate-900/50', borderClass: 'border-slate-200 dark:border-slate-700/5', textClass: 'text-slate-500 dark:text-slate-400', badgeColor: 'bg-slate-600', headerText: 'text-white0', countText: 'text-slate-600', cardBg: 'bg-black/30', cardBorder: 'border-slate-200 dark:border-slate-700/5', cardText: 'text-white0', cardHover: '', lobText: 'text-white0 opacity-50' }
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
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-700/5 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="font-display font-medium text-slate-700">Currently Active: <span className="font-bold text-emerald-400 font-mono">{activeAgentsCount}</span> / {agentsList.length}</span>
                              </div>
                              <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 text-white0 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                  value={rtmSearch}
                                  onChange={(e) => setRtmSearch(e.target.value)}
                                  placeholder="Search agents by name..." 
                                  className="w-full pl-9 pr-4 py-2 bg-black/50 border border-slate-200 dark:border-slate-700/10 rounded-xl text-sm focus:border-indigo-500 text-slate-700 dark:text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:bg-black/70"
                                />
                              </div>
                            </div>

                            {/* Roster Grid */}
                            <div className="flex flex-col gap-6">
                              {statuses.filter(s => s.count > 0).map(group => (
                                <div key={group.id} className={`p-5 rounded-2xl border ${group.bgClass} ${group.borderClass} ${group.textClass}`}>
                                  <div className={`flex justify-between items-center mb-4 border-b pb-3 ${group.id === 'offline' ? 'border-slate-200 dark:border-slate-700/5' : group.borderClass}`}>
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
                                              <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 font-sans">Set Agent AUX</p>
                                              <select 
                                                value={group.id}
                                                onChange={(e) => {
                                                  handleTLOverrideAgentStatus(agent, e.target.value as any);
                                                  setRtmSelectedAgent(null);
                                                }}
                                                className="w-full bg-black/50 border border-slate-200 dark:border-slate-700/10 rounded text-[10px] text-slate-700 dark:text-slate-200 px-1 py-1 flex items-center justify-center focus:outline-none focus:border-indigo-500 font-medium font-sans"
                                              >
                                                <option value="working" className="bg-slate-50 dark:bg-slate-800">Online / On Duty</option>
                                                <option value="break" className="bg-slate-50 dark:bg-slate-800">On Break</option>
                                                <option value="lunch" className="bg-slate-50 dark:bg-slate-800">On Lunch</option>
                                                <option value="restroom" className="bg-slate-50 dark:bg-slate-800">Restroom</option>
                                                <option value="meeting" className="bg-slate-50 dark:bg-slate-800">In Meeting</option>
                                                <option value="one_on_one" className="bg-slate-50 dark:bg-slate-800">1:1 Session</option>
                                                <option value="personal" className="bg-slate-50 dark:bg-slate-800">Personal Time</option>
                                                <option value="clocked_out" className="bg-slate-50 dark:bg-slate-800 text-rose-300">Force Clock Out</option>
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
                                <div className="p-10 border border-slate-200 dark:border-slate-700/5 rounded-2xl text-center text-white0 flex flex-col items-center justify-center">
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
                          <div id="compliance-alerts-panel" className="p-6 bg-white dark:bg-slate-900/80 border border-rose-500/20 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-500/10 pb-3">
                              <div className="space-y-1">
                                <h4 className="text-sm font-black text-rose-300 flex items-center gap-2 font-display uppercase tracking-wider">
                                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                                  Live Compliance Alerts & Aux Watch
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
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
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">No active alarm status logs or cumulative auxiliary overtime events detected under today's schedule.</p>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                                {complianceViolations.map(entry => (
                                  <div key={entry.agentName} className="p-4 bg-black/40 border border-rose-500/15 rounded-2xl flex flex-col justify-between gap-3 text-left relative overflow-hidden group hover:border-rose-500/25 transition-all">
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="text-xs font-black text-slate-700 uppercase tracking-wide font-display">{entry.agentName}</p>
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
                                          <div key={idx} className="flex flex-col gap-1 p-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-xl text-[11px] font-sans">
                                            <div className="flex items-center justify-between font-bold">
                                              <span className="text-slate-700 dark:text-slate-200">
                                                {violation.type} Limit:
                                              </span>
                                              <span className="text-rose-400 font-mono font-black">
                                                +{violation.exceededBy.toFixed(1)}m Over
                                              </span>
                                            </div>
                                            <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                                              <span>Allotted: {violation.limit}m</span>
                                              <span className="font-mono">Logged: {violation.actual.toFixed(1)}m</span>
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
                      <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                        <div className="sm:col-span-2 relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white0">
                            <Search className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            value={tlSearchQuery}
                            onChange={(e) => setTlSearchQuery(e.target.value)}
                            placeholder="Filter status table by agent name..."
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Filter Status:</span>
                          <select
                            value={tlStatusFilter}
                            onChange={(e) => setTlStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="all" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">All Agents</option>
                            <option value="in" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Clocked In (IN)</option>
                            <option value="out" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Clocked Out (OUT)</option>
                            <option value="break_lunch" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">On Break / Lunch Activity</option>
                            <option value="overtime" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Warning / Overtime Limit Exceeded</option>
                          </select>
                        </div>
                      </div>

                      {/* Live station usage & totals board */}
                      <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <h3 className="font-bold text-slate-700 text-base font-display">Daily Presence & Break Report Sheet</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Comprehensive view of today’s logs, break, lunch, and restroom statistics per agent</p>
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
                              <p className="text-center py-16 text-xs text-slate-500 dark:text-slate-400 italic">No agent matching filters today.</p>
                            );
                          }

                          return (
                            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/5 rounded-2xl bg-black/45 overflow-visible">
                              <table className="w-full text-left border-collapse min-w-[750px]">
                                <thead>
                                  <tr className="bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/10 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 font-sans">
                                    <th className="px-5 py-3">Agent Name</th>
                                    <th className="px-3 py-3 font-medium">TL Status Override</th>
                                    <th className="px-3 py-3 font-medium">Shift Log</th>
                                    <th className="px-4 py-3 text-amber-300 font-medium">Total Break (15m limit)</th>
                                    <th className="px-4 py-3 text-pink-300 font-medium">Total Lunch (30m limit)</th>
                                    <th className="px-4 py-3 text-indigo-300 font-medium">Restroom (Total Mins)</th>
                                    <th className="px-5 py-3 text-right font-medium">Today's Compliance</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs text-slate-600 dark:text-slate-300 font-sans">
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
                                        <td className="px-5 py-4 font-bold text-slate-700 font-display uppercase tracking-wide">
                                          <div>{name}</div>
                                          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-normal lowercase tracking-wide bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 px-2 py-0.5 rounded-lg mt-1 w-max block">{getAgentLOB(name)}</div>
                                        </td>

                                        {/* Live status badge / select */}
                                        <td className="px-3 py-4">
                                          <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`}></span>
                                            <select 
                                              value={activeStatus}
                                              onChange={(e) => handleTLOverrideAgentStatus(name, e.target.value as any)}
                                              className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg text-[10px] text-slate-700 px-2 py-1 focus:outline-none focus:border-indigo-500 font-bold uppercase cursor-pointer max-w-[120px]"
                                            >
                                              <option value="working" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">On Shift (Working)</option>
                                              <option value="break" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">On Break</option>
                                              <option value="lunch" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">On Lunch</option>
                                              <option value="restroom" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">In Restroom</option>
                                              <option value="clocked_out" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Clocked Out</option>
                                              <option value="day_off" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Day Off</option>
                                              <option value="casual" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Casual Leave</option>
                                              <option value="annual" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Annual Leave</option>
                                              <option value="no_show" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">No Show</option>
                                            </select>
                                          </div>
                                        </td>

                                        {/* Shifts */}
                                        <td className="px-3 py-4 space-y-0.5">
                                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                            In: <span className="text-emerald-400 font-semibold">{stats.clockIn ? new Date(stats.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                          </p>
                                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                            Out: <span className="text-rose-400 font-semibold">{stats.clockOut ? new Date(stats.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (stats.clockIn ? 'Active shift' : '--:--')}</span>
                                          </p>
                                        </td>

                                        {/* Total Break */}
                                        <td className="px-4 py-4 space-y-1">
                                          <div className="flex justify-between text-[10px] font-mono">
                                            <span className={stats.breakMins > 15 ? 'text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                                              {stats.breakMins.toFixed(1)} mins
                                            </span>
                                            <span className="text-white0">of 15m</span>
                                          </div>
                                          <div className="w-full bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md rounded-full h-1 relative">
                                            <div
                                              className={`h-1 rounded-full transition-all duration-300 ${stats.breakMins > 15 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}
                                              style={{ width: `${Math.min(100, (stats.breakMins / 15) * 100)}%` }}
                                            ></div>
                                          </div>
                                        </td>

                                        {/* Total Lunch */}
                                        <td className="px-4 py-4 space-y-1">
                                          <div className="flex justify-between text-[10px] font-mono">
                                            <span className={stats.lunchMins > 30 ? 'text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                                              {stats.lunchMins.toFixed(1)} mins
                                            </span>
                                            <span className="text-white0">of 30m</span>
                                          </div>
                                          <div className="w-full bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md rounded-full h-1 relative">
                                            <div
                                              className={`h-1 rounded-full transition-all duration-300 ${stats.lunchMins > 30 ? 'bg-rose-500 animate-pulse' : 'bg-pink-400'}`}
                                              style={{ width: `${Math.min(100, (stats.lunchMins / 30) * 100)}%` }}
                                            ></div>
                                          </div>
                                        </td>

                                        {/* Restroom */}
                                        <td className="px-4 py-4 leading-normal">
                                          <p className="text-indigo-300 font-semibold font-mono">{stats.restroomMins.toFixed(1)} mins</p>
                                          <p className="text-[10px] text-white0 font-sans">{stats.restroomCount} sessions logged</p>
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
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Browse shift coverage, find trade partners, and publish rosters</p>
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

                  {/* Unified Modern Roster Upload Console */}
                  {isSuperAdmin && (
                    <div className="bg-white dark:bg-slate-900/50 border text-left border-slate-200 dark:border-slate-700/10 rounded-3xl p-8 shadow-sm space-y-8 animate-fade-in relative">
                      {isSyncingSheets && (
                        <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900/500 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                           <div className="p-4 bg-white dark:bg-slate-900/40 shadow-xl rounded-2xl flex items-center gap-3 border border-gray-100">
                             <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                             <span className="text-sm font-bold text-slate-700">Uploading and Processing Roster...</span>
                           </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5 gap-4">
                        <div>
                          <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                            <Upload className="w-5 h-5 text-indigo-500" />
                            Schedule Roster Upload
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Upload a spreadsheet containing agent shifts. Supports <b>.xlsx, .xls, .csv</b>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={downloadScheduleTemplate}
                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                          >
                            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            Download Template
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Box 1: File Uploader Card */}
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all bg-gray-50 ${dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
                        >
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv,.txt,.json"
                            onChange={(e) => {
                                setIsSyncingSheets(true);
                                setTimeout(() => {
                                    handleScheduleFileChange(e);
                                    setIsSyncingSheets(false);
                                }, 500); // Fake small delay to show progress state
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-16 h-16 bg-white dark:bg-slate-900/40 shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-4 text-indigo-500 group-hover:scale-105 transition-transform">
                            <Upload className="w-8 h-8" />
                          </div>
                          <h4 className="text-slate-700 font-bold text-base">Drag & drop your file here</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">or click to browse from your computer</p>
                          <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-xs mx-auto">
                            Requires Agent Name, Date, and Shift columns. Missing agents will be auto-registered.
                          </p>
                        </div>

                        {/* Box 2: Google Sheets URL Import */}
                        <div className="border border-gray-200 bg-white dark:bg-slate-900/40 shadow-sm rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-6 h-6" viewBox="0 0 48 48">
                              <path fill="#34A853" d="M41.5 8h-35C4 8 2 10 2 12.5v23C2 38 4 40 6.5 40h35c2.5 0 4.5-2 4.5-4.5v-23C46 10 44 8 41.5 8z"></path>
                              <path fill="#188038" d="M31.5 8h-25v32h25V8z"></path>
                              <path fill="#E8F0FE" d="M36 15.5h6v4h-6v-4zM36 24h6v4h-6v-4zM8 15.5h5v4H8v-4zM8 24h5v4H8v-4z"></path>
                            </svg>
                          </div>
                          <h4 className="font-bold text-slate-700">Import via Google Sheets</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-[200px] mx-auto">Automatically sync live roster from Google Workspace.</p>
                          <div className="w-full flex space-x-2 relative group">
                            <input
                              type="text"
                              value={googleSheetId}
                              onChange={(e) => {
                                let val = e.target.value;
                                const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
                                if (match) val = match[1];
                                setGoogleSheetId(val);
                                setStorageItem('sched_google_sheet_id', val);
                              }}
                              placeholder="Paste Sheets URL..."
                              className="flex-1 bg-white dark:bg-slate-900/40 border border-gray-300 text-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            />
                            <button
                              onClick={async () => {
                                if (!googleSheetId) {
                                  toast.error("Please provide a valid Google Sheet ID or URL.");
                                  return;
                                }
                                try {
                                  setIsSyncingSheets(true);
                                  setUploadError(null);
                                  setUploadSuccess(null);
                                  
                                  const text = await fetchGoogleSheetCSV(googleSheetId, '0');
                                  const result = parseScheduleCSV(text, agentsList);
                                  
                                  if (result.errors.length > 0) {
                                     setUploadError(result.errors.join('\n'));
                                  }
                                  if (result.schedules.length > 0) {
                                    setTempSchedules(result.schedules);
                                    setTempNewAgents(result.newAgents || []);
                                    setUploadSuccess("Successfully extracted shifts.");
                                  } else {
                                     setUploadError((prev) => (prev ? prev + "\n" : "") + "No schedule data found.");
                                  }
                                } catch (err) {
                                  setUploadError("Extraction failed: " + err.message);
                                } finally {
                                  setIsSyncingSheets(false);
                                }
                              }}
                              disabled={isSyncingSheets}
                              className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
                            >
                              {isSyncingSheets ? 'Syncing...' : 'Sync Data'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Display Data Summary Block */}
                      {(tempSchedules.length > 0 || uploadError) && (
                        <div className="border border-gray-200 bg-white dark:bg-slate-900/40 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-2 mt-8">
                            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-indigo-500" /> Upload Preview Summary
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review validation and any mapping errors before saving.</p>
                                </div>
                                {tempSchedules.length > 0 && (
                                   <div className="flex gap-3">
                                        <button onClick={() => { setTempSchedules([]); setUploadError(null); setUploadSuccess(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 bg-white dark:bg-slate-900/40 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors">Discard</button>
                                        <button onClick={commitSchedules} className="px-5 py-2 bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                                            <CheckCircle2 className="w-4 h-4" /> Save Schedule ({tempSchedules.length} items)
                                        </button>
                                   </div>
                                )}
                            </div>

                            {/* Show Error Rows */}
                            {uploadError && (
                                <div className="bg-red-50 p-4 border-b border-red-100">
                                    <h5 className="text-red-800 font-bold text-sm flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4"/> Parsing Errors
                                    </h5>
                                    <ul className="list-disc pl-5 text-xs text-red-600 font-mono space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-4">
                                        {uploadError.split('\n').filter(Boolean).map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Show Summary Table */}
                            {tempSchedules.length > 0 && (
                                <div className="max-h-80 overflow-y-auto">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 pl-6 font-semibold text-gray-700">Agent</th>
                                                <th className="p-3 font-semibold text-gray-700">Date</th>
                                                <th className="p-3 font-semibold text-gray-700">Shift Mapped To</th>
                                                <th className="p-3 pr-6 font-semibold text-gray-700 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {tempSchedules.slice(0, 100).map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3 pl-6 font-medium text-slate-700">{row.agentName}</td>
                                                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">{row.date}</td>
                                                    <td className="p-3"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs">{row.shiftLabel}</span></td>
                                                    <td className="p-3 pr-6 text-right">
                                                        <span className="text-emerald-600 text-xs font-semibold flex items-center justify-end gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span> Valid</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {tempSchedules.length > 100 && (
                                        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-gray-50 border-t border-gray-100">
                                            Showing top 100 entries out of {tempSchedules.length}.
                                        </div>
                                    )}
                                </div>
                            )}
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
                          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider font-display">Schedule Roster Release Status</h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {isRosterPublished 
                            ? "Published & Released: Standard agents are allowed to view the complete schedule roster and trigger shift swap requests."
                            : "Draft Mode: Full schedule calendar views are restricted to Team Leaders & Administration. Agents see custom draft shift card previews only."
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono">
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
                          <div className="w-14 h-7 bg-white dark:bg-slate-900/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black/5 dark:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-slate-50 dark:bg-slate-800 after:border-slate-200 dark:border-slate-700 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 border border-slate-200 dark:border-slate-700/10"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Manual Single-Shift Roster Submission Form */}
                  {isSuperAdmin && (
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl shadow-sm text-slate-700 p-6 shadow-2xl space-y-5 text-left">
                      <div>
                        <h3 className="font-extrabold text-slate-700 text-base font-display flex items-center gap-2">
                          <PlusCircle className="w-5 h-5 text-indigo-400" />
                          Individual Shift Assignment Submitter
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manually program, assign, or override individual agent shift allocations with custom Notes</p>
                      </div>

                      <form onSubmit={handleManualRosterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1 space-y-1.5 font-sans">
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-sans">1. Choose Agent</label>
                          <select
                            value={manualRosterAgent}
                            onChange={(e) => setManualRosterAgent(e.target.value)}
                            className="w-full px-3 py-2.5 bg-black/45 border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 outline-none cursor-pointer focus:border-indigo-500 font-sans"
                          >
                            <option value="">-- Choose Agent --</option>
                            {agentsList.map(name => (
                              <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 " key={name} value={name}>
                                {name} ({getAgentLOB(name)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-1 space-y-1.5">
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-sans">2. Coverage Date</label>
                          <input
                            type="date"
                            value={manualRosterDate}
                            onChange={(e) => setManualRosterDate(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/45 border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-500 h-[42px]"
                          />
                        </div>

                        <div className="md:col-span-1 space-y-1.5 font-sans">
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-sans">3. Schedule Shift</label>
                          <select
                            value={manualRosterShift}
                            onChange={(e) => setManualRosterShift(e.target.value)}
                            className="w-full px-3 py-2.5 bg-black/45 border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 outline-none cursor-pointer focus:border-indigo-500 font-sans"
                          >
                            {SHIFTS.map(s => (
                              <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 " key={s.id} value={s.label}>
                                {s.display} ({s.label})
                              </option>
                            ))}
                            <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 " value="Off">Rest Day (Off Day)</option>
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
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-sans">4. Roster Shift Notes (Saves to Shift details)</label>
                          <input
                            type="text"
                            placeholder="e.g. Approved temporary schedule override / Direct management assignment / Shift Notes..."
                            value={manualRosterNotes}
                            onChange={(e) => setManualRosterNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-black/45 border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 placeholder-slate-500 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </form>
                    </div>
                  )}


                  {/* Informative coverage card indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">Active Scheduled Days</p>
                      <p className="text-2xl font-black text-slate-700">
                        {allScheduleDates.length} Days Covered
                      </p>
                      <p className="text-[10px] text-indigo-300 mt-1">
                        {allScheduleDates.length > 0 
                          ? `${formatDateNice(allScheduleDates[0])} to ${formatDateNice(allScheduleDates[allScheduleDates.length - 1])}`
                          : 'Roster empty, using default rotation window'
                        }
                      </p>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">Coverage Scope</p>
                      <p className="text-2xl font-black text-slate-700">
                        {schedules.length} Assigned Shifts
                      </p>
                      <p className="text-[10px] text-emerald-300 mt-1">
                        Supporting standard rotation & manual uploads
                      </p>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1 font-mono">My Upcoming Shift</p>
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
                              <p className="text-2xl font-black text-slate-500 dark:text-slate-400">Rest / No Shift</p>
                              <p className="text-[10px] text-white0 mt-1">No upcoming scheduled shifts found</p>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <p className="text-2xl font-black text-amber-300">TL Supervision</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Roster upload and override controls enabled</p>
                        </>
                      )}
                    </div>

                    <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl backdrop-blur-sm relative overflow-hidden">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold font-mono">Sync & Queue Engine</p>
                        {forceOffline ? (
                          <span className="px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[7px] text-amber-400 font-black">OFFLINE</span>
                        ) : (
                          <span className="px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[7px] text-emerald-400 font-black tracking-widest">REALTIME</span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600 dark:text-slate-300">Pending Writes:</span>
                          <span className={`font-mono font-black text-xs ${syncStatus.pending > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`}>
                            {syncStatus.pending}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600 dark:text-slate-300">Syncs / Fails:</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                            {syncStatus.synced} / <span className="text-red-400">{syncStatus.failed}</span>
                          </span>
                        </div>

                        {syncError && (
                          <p className="text-[8px] text-red-400 font-mono truncate leading-none mt-0.5 pt-0.5 border-t border-red-500/5">
                            ⚠️ {syncError}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-1.5 mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700/5">
                          <button
                            onClick={() => {
                              const nextMode = !forceOffline;
                              setForceOffline(nextMode);
                              toast.info(nextMode ? "Forced Offline Mode Active 🔌" : "Online Synchronization Active 📡");
                            }}
                            className={`py-1 px-1.5 rounded-lg text-[8px] font-black cursor-pointer text-center select-none uppercase transition-all ${
                              forceOffline 
                                ? 'bg-amber-600/20 hover:bg-amber-600/35 text-amber-200 border border-amber-500/30' 
                                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/5'
                            }`}
                          >
                            {forceOffline ? "Go Online" : "Go Offline"}
                          </button>
                          
                          <button
                            onClick={async () => {
                              if (forceOffline) {
                                toast.error("Cannot sync: offline mode is active. Go online first!");
                                return;
                              }
                              toast.promise(syncEngine.processPending(), {
                                loading: 'Synchronizing team database...',
                                success: 'Roster synced successfully!',
                                error: 'Sync failed: network connection issue'
                              });
                            }}
                            disabled={syncStatus.pending === 0}
                            className={`py-1 px-1.5 rounded-lg text-[8px] font-black uppercase text-center cursor-pointer transition-all ${
                              syncStatus.pending > 0 
                                ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-900/10' 
                                : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700/5 cursor-not-allowed'
                            }`}
                          >
                            Sync Queue
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {false ? (
                    <div className="space-y-6">
                      <div className="p-12 text-center rounded-3xl border border-dashed border-indigo-500/30 bg-slate-50 dark:bg-slate-800/[0.02] space-y-4 shadow-xl text-left">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                          <Shield className="w-8 h-8" />
                        </div>
                        <div className="space-y-2 text-center">
                          <h3 className="text-xl font-bold text-slate-700 tracking-wide font-display">Schedule Roster Draft Status</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
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
                      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-6 shadow-xl space-y-4 text-left">
                        <div className="border-b border-slate-200 dark:border-slate-700/5 pb-3">
                          <h4 className="text-sm font-black text-indigo-300 uppercase tracking-widest font-mono">My Shift Coverage Preview</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Below are your upcoming assigned shifts as current in the administrator blueprint:</p>
                        </div>

                        {(() => {
                          const todayStr = getLocalISOString(systemTime);
                          const myShiftsArr = schedules.filter(s => s.agentName?.toLowerCase() === currentUser?.name?.toLowerCase() && s.date >= todayStr);
                          if (myShiftsArr.length === 0) {
                            return (
                              <div className="py-6 text-center text-xs text-white0 italic">
                                No upcoming scheduled shifts match your account name in this draft revision.
                              </div>
                            );
                          }
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {myShiftsArr.map(shift => {
                                const style = getShiftBadgeStyle(shift.shiftLabel);
                                return (
                                  <div key={shift.id} className="p-4 bg-slate-50 dark:bg-slate-800/[0.02] border border-slate-200 dark:border-slate-700/5 rounded-2xl flex items-center justify-between shadow">
                                    <div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">{formatDateNice(shift.date)}</p>
                                      <p className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wide">{shift.agentName}</p>
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
                      <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                      {/* Search bar */}
                      <input
                        type="text"
                        placeholder="Filter by Agent Name..."
                        value={scheduleFilterAgent}
                        onChange={(e) => setScheduleFilterAgent(e.target.value)}
                        className="px-4 py-2 bg-black/45 hover:bg-slate-700 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 focus:border-indigo-500/85 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-700 placeholder-slate-400 outline-none transition-all w-full sm:w-64"
                      />

                      {/* View Mode */}
                      <div className="flex rounded-xl bg-black/45 p-1 border border-slate-200 dark:border-slate-700/5">
                        <button
                          onClick={() => {
                            setScheduleViewMode('week');
                            setSchedulePageOffset(0);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            scheduleViewMode === 'week' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
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
                            scheduleViewMode === 'fortnight' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
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
                            scheduleViewMode === 'month' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          Full Month
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Paging Actions */}
                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Showing offsets: {safeOffset + 1} - {Math.min(safeOffset + displayDaysCount, baseDatesList.length)} of {baseDatesList.length} dates
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={safeOffset === 0}
                          onClick={() => setSchedulePageOffset(prev => Math.max(0, prev - displayDaysCount))}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/10 text-slate-700 disabled:opacity-30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          &larr; Prev
                        </button>
                        <button
                          disabled={safeOffset + displayDaysCount >= baseDatesList.length}
                          onClick={() => setSchedulePageOffset(prev => Math.min(baseDatesList.length - displayDaysCount, prev + displayDaysCount))}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/10 text-slate-700 disabled:opacity-30 rounded-lg text-xs font-bold transition-all cursor-pointer"
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
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700/5">
                      <h3 className="font-bold text-slate-700 text-base font-display"> Roster Coverage Planner</h3>
                      <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1.5 font-bold uppercase">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Active Database
                      </span>
                    </div>

                    {schedules.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 dark:text-slate-400 space-y-3">
                        <Calendar className="w-12 h-12 mx-auto text-indigo-400 opacity-40 animate-pulse" />
                        <div>
                          <p className="font-bold text-slate-700 text-base">Active schedule roster is empty</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
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
                            <div className="bg-white dark:bg-slate-900/85 border border-indigo-500/25 rounded-3xl p-5 space-y-4 mb-6 text-left shadow-2xl relative overflow-hidden backdrop-blur-xl">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/5 pb-3">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-700 flex items-center gap-2 font-display">
                                    <span className="flex h-2.5 w-2.5 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    Roster Coverage Heatmap Analytics
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
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
                                <div className="p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/5 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left transition-all">
                                  <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block font-sans">
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
                                        className="w-8 h-8 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 active:scale-95 text-slate-700 font-bold rounded-lg border border-slate-200 dark:border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="w-10 text-center font-bold text-slate-700 text-sm font-mono">
                                        {heatmapMorningTarget}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = heatmapMorningTarget + 1;
                                          setHeatmapMorningTarget(val);
                                          setStorageItem('heatmap_morning_target', val);
                                        }}
                                        className="w-8 h-8 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 active:scale-95 text-slate-700 font-bold rounded-lg border border-slate-200 dark:border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <p className="text-[8.5px] text-white0 font-sans">Ideal working agents on clock</p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block font-sans">
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
                                        className="w-8 h-8 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 active:scale-95 text-slate-700 font-bold rounded-lg border border-slate-200 dark:border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="w-10 text-center font-bold text-slate-700 text-sm font-mono">
                                        {heatmapAfternoonTarget}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = heatmapAfternoonTarget + 1;
                                          setHeatmapAfternoonTarget(val);
                                          setStorageItem('heatmap_afternoon_target', val);
                                        }}
                                        className="w-8 h-8 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 active:scale-95 text-slate-700 font-bold rounded-lg border border-slate-200 dark:border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <p className="text-[8.5px] text-white0 font-sans">Ideal working agents on clock</p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block font-sans">
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
                                        className="w-8 h-8 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 active:scale-95 text-slate-700 font-bold rounded-lg border border-slate-200 dark:border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="w-10 text-center font-bold text-slate-700 text-sm font-mono">
                                        {heatmapNightTarget}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = heatmapNightTarget + 1;
                                          setHeatmapNightTarget(val);
                                          setStorageItem('heatmap_night_target', val);
                                        }}
                                        className="w-8 h-8 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 active:scale-95 text-slate-700 font-bold rounded-lg border border-slate-200 dark:border-slate-700/10 transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <p className="text-[8.5px] text-white0 font-sans">Ideal working agents on clock</p>
                                  </div>
                                </div>
                              )}

                              {/* Heatmap Grid Matrix */}
                              <div className="overflow-x-auto pb-1 rounded-xl">
                                <div className="min-w-[850px] space-y-2">
                                  {/* Header row containing Dates */}
                                  <div className="flex">
                                    <div className="w-44 shrink-0 flex items-center pl-3 text-[10px] font-black uppercase text-indigo-300 tracking-wider font-display border-r border-slate-200 dark:border-slate-700/5">
                                      Shift vs Date
                                    </div>
                                    <div className="flex-1 flex gap-1.5 pl-3">
                                      {activeDisplayDates.map(dateStr => {
                                        const d = new Date(dateStr);
                                        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                                        const dayNum = d.getDate();
                                        return (
                                          <div key={dateStr} className="flex-1 text-center bg-white dark:bg-slate-900/30 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/5 shadow-sm">
                                            <p className="text-[9px] text-indigo-300 uppercase font-black tracking-wider leading-none">{dayLabel}</p>
                                            <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">{dayNum}</p>
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
                                        <div className="w-44 shrink-0 flex flex-col justify-center text-left pl-3 py-1 bg-white dark:bg-slate-900/30 border-r border-slate-200 dark:border-slate-700/5 rounded-l-xl select-none">
                                          <p className="text-xs font-black text-slate-700 dark:text-slate-200 font-display">{row.label}</p>
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
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 hidden group-hover:block bg-slate-950 border border-indigo-500/30 text-slate-700 rounded-xl p-3 shadow-2xl z-50 text-[10px] leading-relaxed backdrop-blur-md">
                                                  <p className="font-extrabold text-indigo-300 border-b border-indigo-500/20 pb-0.5 mb-1.5 flex items-center justify-between">
                                                    <span>📋 Coverage Details</span>
                                                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono uppercase tracking-widest">{row.term}</span>
                                                  </p>
                                                  
                                                  <p className="text-slate-500 dark:text-slate-400 text-[9px] mb-1 font-sans">{statusText} ({count} of {target} agents scheduled)</p>
                                                  <p className="text-white0 text-[8.5px] uppercase tracking-wider font-extrabold pb-0.5 border-b border-slate-200 dark:border-slate-700/5 mt-2">Active Agents:</p>
                                                  {coverage.agents.length === 0 ? (
                                                    <p className="text-slate-500 dark:text-slate-400 italic mt-1 font-mono">No agents scheduled</p>
                                                  ) : (
                                                    <div className="max-h-24 overflow-y-auto mt-1 space-y-0.5 font-mono">
                                                      {coverage.agents.map((name: string, idx2: number) => (
                                                        <div key={idx2} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                          <span className="text-emerald-400">●</span>
                                                          <span className="font-bold">{name}</span>
                                                          <span className="text-[8px] text-white0">({getAgentLOB(name)})</span>
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
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-700/5 text-[10px] text-slate-500 dark:text-slate-400">
                                {/* Heatmap Legend */}
                                <div className="flex flex-wrap gap-3 items-center">
                                  <span className="font-bold text-slate-600 dark:text-slate-300">Keys:</span>
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
                        <div className="hidden lg:block overflow-x-auto border border-slate-200 dark:border-slate-700/5 rounded-2xl bg-black/45">
                          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                            <thead>
                              <tr className="bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/5">
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 w-52 font-display bg-white dark:bg-slate-900/40 backdrop-blur-lg border-r border-slate-200 dark:border-slate-700/5 shadow-md sticky left-0 z-10">
                                  Agent Name
                                </th>
                                {activeDisplayDates.map(dateStr => {
                                  // Parse date
                                  const d = new Date(dateStr);
                                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                                  const dayNum = d.getDate();
                                  const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                                  return (
                                    <th key={dateStr} className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-700/5 min-w-[90px]">
                                      <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">{dayName}</p>
                                      <p className="text-base font-black text-slate-700">{dayNum}</p>
                                      <p className="text-[9px] text-slate-500 dark:text-slate-400">{monthName}</p>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {visibleAgents.length === 0 ? (
                                <tr>
                                  <td colSpan={activeDisplayDates.length + 1} className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 italic">
                                    No agents match your filter criteria.
                                  </td>
                                </tr>
                              ) : (
                                visibleAgents.map(agentName => (
                                  <tr key={agentName} className="border-b border-slate-200 dark:border-slate-700/5 hover:bg-slate-700 transition-all">
                                    <td className="px-5 py-3 text-xs font-bold text-slate-700 font-sans bg-white dark:bg-slate-900/40 backdrop-blur-lg border-r border-slate-200 dark:border-slate-700/5 shadow-sm sticky left-0 z-10 truncate min-w-[140px]">
                                      {agentName}
                                      <span className="block text-[8px] text-slate-500 dark:text-slate-400 font-normal lowercase tracking-wide font-sans">{getAgentLOB(agentName)}</span>
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
                                          className={`p-1 border-r border-slate-200 dark:border-slate-700/5 hover:bg-slate-700/40 transition-all relative group ${isSuperAdmin && findShift ? 'cursor-pointer hover:ring-1 ring-inset ring-indigo-500/50' : 'cursor-help'}`}
                                        >
                                          <div className={`mx-auto rounded-lg px-2 py-2 text-center border text-[10px] font-bold ${style.bg} transition-all flex items-center justify-center gap-1 relative overflow-hidden`}>
                                            <span className="relative z-10">{style.display}</span>
                                            {findShift?.shiftNotes && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0 relative z-10" />
                                            )}
                                            {findShift?.activities && findShift.activities.length > 0 && (
                                              <div className="absolute bottom-0 left-0 right-0 h-1 flex bg-white dark:bg-slate-900/40">
                                                {findShift.activities.map((a, i) => (
                                                  <div key={i} className={`flex-1 h-full ${a.label === 'Break' ? 'bg-amber-400' : a.label === 'Lunch' ? 'bg-orange-500' : typeof a.label === 'string' && a.label.includes('Meeting') ? 'bg-indigo-500' : 'bg-cyan-500'}`} title={a.label} />
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          {(findShift?.shiftNotes || (findShift?.activities && findShift.activities.length > 0) || isSuperAdmin) && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-white dark:bg-slate-900 border border-indigo-400/40 text-slate-700 rounded-xl p-3 shadow-2xl z-50 text-[10px] leading-relaxed backdrop-blur-md">
                                              <p className="font-extrabold text-indigo-300 border-b border-indigo-400/20 pb-0.5 mb-1.5 flex items-center justify-between font-display">
                                                <span>📌 Details</span>
                                                <span className="text-slate-500 dark:text-slate-400 font-mono scale-75">{dateStr}</span>
                                              </p>
                                              
                                              {findShift?.shiftNotes && (
                                                <p className="text-slate-600 dark:text-slate-300 font-sans break-words mb-2 italic">"{findShift.shiftNotes}"</p>
                                              )}
                                              
                                              {findShift?.activities && findShift.activities.length > 0 && (
                                                <div className="space-y-1 mb-2">
                                                  <p className="text-[9px] font-bold uppercase text-white0 tracking-wider">Intraday Timeline:</p>
                                                  {[...findShift.activities].sort((a,b)=>a.startTime.localeCompare(b.startTime)).map((act, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 justify-between bg-black/40 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/5">
                                                       <span className="font-mono text-[9px] text-indigo-200">{act.startTime}-{act.endTime}</span>
                                                       <span className="font-bold text-slate-600 dark:text-slate-300 truncate">{act.label}</span>
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
                            <p className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 italic">No agents match your filter criteria.</p>
                          ) : (
                            visibleAgents.map(agentName => {
                              const agentShifts = schedules.filter(s => s && s.agentName && s.agentName?.toLowerCase() === (agentName || '').toLowerCase() && activeDisplayDates.includes(s.date));
                              return (
                                <div key={agentName} className="p-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl space-y-2">
                                  <p className="text-xs font-bold text-slate-700 border-b border-slate-200 dark:border-slate-700/5 pb-1 font-display flex justify-between items-center">
                                    <span>{agentName}</span>
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal lowercase tracking-wide bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 px-1.5 py-0.5 rounded-lg">{getAgentLOB(agentName)}</span>
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
                                          className={`p-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-xl flex flex-col justify-between items-stretch relative ${isSuperAdmin && findShift ? 'cursor-pointer hover:border-indigo-500/50' : ''}`}
                                        >
                                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mb-1 truncate block">{dayLabel}</span>
                                          <span className={`px-1.5 py-1 rounded border text-[9px] font-semibold text-center truncate block ${style.bg} relative overflow-hidden`}>
                                            <span className="relative z-10">{style.display}</span>
                                            {findShift?.activities && findShift.activities.length > 0 && (
                                              <div className="absolute bottom-0 left-0 right-0 h-1 flex bg-white dark:bg-slate-900/40 opacity-70">
                                                {findShift.activities.map((a, i) => (
                                                  <div key={i} className={`flex-1 h-full ${a.label === 'Break' ? 'bg-amber-400' : a.label === 'Lunch' ? 'bg-orange-500' : typeof a.label === 'string' && a.label.includes('Meeting') ? 'bg-indigo-500' : 'bg-cyan-500'}`} />
                                                ))}
                                              </div>
                                            )}
                                          </span>
                                          {findShift?.shiftNotes && (
                                            <div className="mt-1.5 border-t border-slate-200 dark:border-slate-700/5 pt-1 text-[9px] text-indigo-300 font-sans italic break-words flex items-start gap-1 leading-normal text-left">
                                              <span className="shrink-0 text-[10px]">📝</span>
                                              <span>{findShift.shiftNotes}</span>
                                            </div>
                                          )}
                                          {findShift?.activities && findShift.activities.length > 0 && (
                                            <div className="mt-1.5 border-t border-slate-200 dark:border-slate-700/5 pt-1 text-[8px] text-slate-500 dark:text-slate-400 font-sans flex flex-col gap-0.5">
                                              {[...findShift.activities].sort((a,b)=>a.startTime.localeCompare(b.startTime)).slice(0, 2).map((act, i) => (
                                                <div key={i} className="flex justify-between">
                                                  <span className="font-mono text-white0">{act.startTime}</span>
                                                  <span className="truncate ml-1">{act.label}</span>
                                                </div>
                                              ))}
                                              {findShift.activities.length > 2 && <span className="text-center text-[7px] mt-0.5 bg-white dark:bg-slate-900/50 py-0.5 rounded">+{findShift.activities.length - 2} more</span>}
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
                        <div className="flex flex-wrap justify-start gap-4 text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700/5">
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
                            <span className="w-2.5 h-2.5 rounded bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 block"></span>
                            Off Day (Rest Day)
                          </span>
                        </div>
                      </>
                    )}
                    </div>

                    {/* P2P Shift Swap Trade Market & Trade Hub */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl shadow-sm text-slate-700 p-5 sm:p-6 shadow-2xl space-y-6 mt-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-700/5 pb-4">
                        <div>
                          <h3 className="font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-lg font-display flex items-center gap-2">
                            <GitPullRequest className="w-5 h-5 text-indigo-400 rotate-90" />
                            P2P Shift Exchange Board
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Teammates can directly declare trading availability, find coverage, or swap assignments within LOBs</p>
                        </div>
                        <div className="flex bg-black/35 rounded-xl p-1 border border-slate-200 dark:border-slate-700/5 text-[9px] font-black uppercase text-indigo-300 tracking-wider">
                          Peer To Peer Market
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Interactive Trade Listing Launcher Form */}
                        <div className="bg-slate-50 dark:bg-slate-800/[0.01] p-5 border border-slate-200 dark:border-slate-700/5 rounded-2xl space-y-4 text-left">
                          <div>
                            <p className="text-xs font-black text-rose-450 uppercase tracking-widest">Publish Open Trade Offer</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Offer up one of your scheduled shifts for peer coverage</p>
                          </div>

                          <div className="space-y-3.5">
                            {/* Selected Date */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase font-sans">1. Select Your Shift Event</label>
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
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 outline-none cursor-pointer"
                                  >
                                    <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="">-- Choose Assigned Date --</option>
                                    {myShedList.map(s => (
                                      <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  key={s.id} value={s.date}>
                                        {formatDateNice(s.date)} (Your Duty: {s.shiftLabel})
                                      </option>
                                    ))}
                                  </select>
                                );
                              })()}
                            </div>

                            {/* Target Partner Agent */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase font-sans">2. Targeted Trading Partner</label>
                              <select
                                value={p2pTargetAgent}
                                onChange={(e) => setP2pTargetAgent(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 outline-none cursor-pointer"
                              >
                                <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="">-- Let Any Peer in LOB Grab It --</option>
                                {agentsList
                                  .filter(a => a?.toLowerCase() !== currentUser?.name?.toLowerCase() && getAgentLOB(a) === getAgentLOB(currentUser.name))
                                  .map(aName => (
                                    <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  key={aName} value={aName}>
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
                              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase font-sans">3. Shift You Want to Gain</label>
                              <select
                                value={p2pTargetShift}
                                onChange={(e) => setP2pTargetShift(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 outline-none cursor-pointer"
                              >
                                {SHIFTS.map(s => (
                                  <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  key={s.id} value={s.label}>
                                    {s.display} ({s.label})
                                  </option>
                                ))}
                                <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="Off">Rest Day (Off Day)</option>
                              </select>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase font-sans">4. Optional Offer Description</label>
                              <input
                                type="text"
                                placeholder="I have a doctor appt / Need early shift..."
                                value={p2pNotes}
                                onChange={(e) => setP2pNotes(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 placeholder-slate-500 outline-none"
                              />
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

                                toast.success("Successfully published shift trade listing to board!");
                                setP2pSelectedDate('');
                                setP2pTargetAgent('');
                                setP2pNotes('');
                              }}
                              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                            >
                              <PlusCircle className="w-4 h-4 text-slate-700" />
                              Publish Trade Offer
                            </button>
                          </div>
                        </div>

                        {/* Available Trades Board Listings */}
                        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-700/5 rounded-2xl flex flex-col justify-between space-y-4 font-sans">
                          <div className="text-left font-sans">
                            <p className="text-xs font-black text-[#22d3ee] uppercase tracking-widest font-sans">Available Trades Board Listings</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Review peer postings, accept direct proposals, or review status</p>
                          </div>

                          <div className="border border-slate-200 dark:border-slate-700/5 rounded-xl bg-black/40 overflow-hidden text-left h-72 overflow-y-auto">
                            {(() => {
                              const swapRequests = requests.filter(r => r.type === 'swap') as SwapRequest[];
                              if (swapRequests.length === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 py-12 text-xs space-y-2 italic font-sans animate-pulse">
                                    <GitPullRequest className="w-8 h-8 text-indigo-400/40" />
                                    <span>No active trade proposals loaded on board</span>
                                  </div>
                                );
                              }
                              return (
                                <table className="w-full text-xs font-sans">
                                  <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-700/5 font-sans">
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
                                        <tr key={req.id} className="hover:bg-slate-50 dark:bg-slate-800/[0.02] transition-colors">
                                          <td className="px-4 py-3.5 font-bold text-slate-700">
                                            {req.agentName}
                                            <span className="block text-[8px] text-slate-500 dark:text-slate-400 font-normal lowercase">{getAgentLOB(req.agentName)}</span>
                                          </td>
                                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{formatDateNice(req.date)}</td>
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
                                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/5">
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
                                                  className="px-2 py-1 bg-white dark:bg-slate-900/50 hover:bg-rose-500/20 hover:text-rose-400 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700/5 cursor-pointer font-sans"
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
                                                  toast.info("Deleted your trade offer listing.");
                                                }}
                                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-300 hover:text-white rounded text-[10px] font-bold transition-all cursor-pointer font-sans"
                                              >
                                                Rescind
                                              </button>
                                            ) : (
                                              <span className="text-[10px] text-white0 italic font-sans">No action</span>
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

                          <div className="text-[10px] text-white0 italic text-left font-sans">
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
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-200 dark:border-slate-700/5 pb-4">
                    <div>
                      {isClientCommsTab ? (
                        <>
                          <h2 className="text-3xl font-bold text-slate-700 font-display">Client Communication</h2>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Submit and monitor requests for Chat and Social Media agents.</p>
                        </>
                      ) : isComplaintsTab ? (
                        <>
                          <h2 className="text-3xl font-bold text-slate-700 font-display">Complaints Desk</h2>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Register, monitor, and resolve patient complaints.</p>
                        </>
                      ) : (
                        <>
                          <h2 className="text-3xl font-bold text-slate-700 font-display">Tabby & Tamara Desk</h2>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Submit installment requests and monitor active contact resolution timers.</p>
                        </>
                      )}
                    </div>

                    {/* Sub Navigation */}
                  </div>

                  {/* Summary Metric Cards */}
                  {localSubTab === 'requests' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* ... existing requests metrics ... */}
                      <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">Total Submissions</p>
                        <p className="text-2xl font-black text-slate-700">
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
                      <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">Total Complaints</p>
                        <p className="text-2xl font-black text-slate-700">
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
                      <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">Total Requests</p>
                        <p className="text-2xl font-black text-slate-700">
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
                          <div className="p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-3xl space-y-4 shadow-2xl">
                            <h3 className="text-lg font-bold text-slate-700 font-display flex items-center gap-2 text-left">
                              <PlusCircle className="w-5 h-5 text-indigo-400" />
                              New Installment Request
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal text-left">
                              Complete the fields below to submit an installment transaction request through Tabby or Tamara.
                            </p>
                            
                            <form onSubmit={handleSubmitTabbyTamara} className="space-y-4 pt-2 text-left">
                              {/* Patient Name */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Patient Name *</label>
                                <input
                                  type="text"
                                  placeholder="Enter full patient name"
                                  value={ttPatientName}
                                  onChange={(e) => setTtPatientName(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                                  required
                                />
                              </div>

                              {/* File Number */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">File Number (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="Patient file / folder number"
                                  value={ttFileNumber}
                                  onChange={(e) => setTtFileNumber(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                                />
                              </div>

                              {/* Old Customer Switch & ID Number */}
                              <div className="space-y-3.5 p-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-2xl text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">Is this an Old Customer?</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={ttIsOldCustomer}
                                      onChange={(e) => setTtIsOldCustomer(e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white dark:bg-slate-900/40/20 backdrop-blur-md peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black/5 dark:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-50 dark:bg-slate-800 after:border-slate-200 dark:border-slate-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
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
                                      className="w-full bg-black/45 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-amber-500 font-mono"
                                      required={!ttIsOldCustomer}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Price */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Price *</label>
                                <div className="relative">
                                  <span className="absolute left-[13px] top-[11.5px] text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">SAR</span>
                                  <input
                                    type="text"
                                    placeholder="0.00"
                                    value={ttPriceWithoutTax}
                                    onChange={(e) => setTtPriceWithoutTax(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                                    required
                                  />
                                </div>
                                {ttPriceWithoutTax && !isNaN(Number(ttPriceWithoutTax)) && (
                                  <p className="text-[10px] text-indigo-300 font-medium">
                                    * Note: 5% automatically added on this price. Total: SAR {(Number(ttPriceWithoutTax) * 1.05).toFixed(2)}
                                  </p>
                                )}
                              </div>

                              {/* Phone Number */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block font-mono">Phone Number *</label>
                                <input
                                  type="tel"
                                  placeholder="+966 5x xxx xxxx"
                                  value={ttPhoneNumber}
                                  onChange={(e) => setTtPhoneNumber(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                                  required
                                />
                              </div>

                              {/* Platform selector */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Payment Platform / Type *</label>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setTtPlatform('tabby')}
                                    className={`py-2 rounded-xl text-[11px] font-black uppercase transition-all tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer ${
                                      ttPlatform === 'tabby'
                                        ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-md'
                                        : 'bg-black/25 border-slate-200 dark:border-slate-700/5 text-slate-500 dark:text-slate-400 hover:bg-slate-700'
                                    }`}
                                  >
                                    💳 Tabby
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTtPlatform('tamara')}
                                    className={`py-2 rounded-xl text-[11px] font-black uppercase transition-all tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer ${
                                      ttPlatform === 'tamara'
                                        ? 'bg-pink-500 border-pink-400 text-slate-700 shadow-md'
                                        : 'bg-black/25 border-slate-200 dark:border-slate-700/5 text-slate-500 dark:text-slate-400 hover:bg-slate-700'
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
                                        : 'bg-black/25 border-slate-200 dark:border-slate-700/5 text-slate-500 dark:text-slate-400 hover:bg-slate-700'
                                    }`}
                                  >
                                    💰 One Time
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block ml-1" htmlFor="tt-clinic">Clinic Name *</label>
                                <select
                                  id="tt-clinic"
                                  value={ttClinicName}
                                  onChange={(e) => setTtClinicName(e.target.value)}
                                  className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer focus:ring-1 focus:ring-indigo-500/30"
                                  required
                                >
                                  <option value="" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Select a Clinic</option>
                                  <option value="dermadent" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Dermadent</option>
                                  <option value="onetouch1" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 1 AlMu'tarid</option>
                                  <option value="onetouch2" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 2 Markhaniya</option>
                                  <option value="welltouch" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">WellTouch</option>
                                  <option value="newedge" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">New Edge</option>
                                </select>
                              </div>

                              {/* Notes */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Additional Notes (Optional)</label>
                                <textarea
                                  placeholder="Any special treatment, payment plan terms, etc."
                                  value={ttNotes}
                                  onChange={(e) => setTtNotes(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans min-h-[70px] resize-y"
                                />
                              </div>

                              <ScreenshotUpload 
                                screenshot={activeScreenshot}
                                onScreenshotChange={setActiveScreenshot}
                                label="Payment / Identity Screenshot"
                              />

                              <button
                                type="submit"
                                disabled={isFormSubmitting}
                                className={`w-full py-3.5 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-sans shadow ${isFormSubmitting ? 'bg-indigo-800 opacity-65 pointer-events-none' : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-[0.99] shadow-indigo-500/10'}`}
                              >
                                {isFormSubmitting ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-700/30 border-t-white rounded-full animate-spin" />
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
                          <div className="p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-3xl space-y-4 shadow-2xl animate-fade-in">
                            <h3 className="text-lg font-bold text-slate-700 font-display flex items-center gap-2 text-left">
                              <AlertTriangle className="w-5 h-5 text-pink-500" />
                              Log New Complaint
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal text-left">
                              Register a service or clinical complaint for team evaluation and prompt resolution.
                            </p>

                            <form onSubmit={handleSubmitTabbyTamaraComplaint} className="space-y-4 pt-2 text-left">
                              {/* Patient Name */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Patient Name *</label>
                                <input
                                  type="text"
                                  placeholder="Enter patient name"
                                  value={tcPatientName}
                                  onChange={(e) => setTcPatientName(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-pink-500 font-sans font-medium"
                                  required
                                />
                              </div>

                              {/* File Number */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">File Number (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="File / folder reference"
                                  value={tcFileNumber}
                                  onChange={(e) => setTcFileNumber(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-pink-500 font-mono"
                                />
                              </div>

                              {/* Old Customer Switch */}
                              <div className="space-y-3.5 p-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/5 rounded-2xl text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 font-sans">Is this an Old Customer?</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={tcIsOldCustomer}
                                      onChange={(e) => setTcIsOldCustomer(e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white dark:bg-slate-900/40/20 backdrop-blur-md peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black/5 dark:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-50 dark:bg-slate-800 after:border-slate-200 dark:border-slate-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
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
                                      className="w-full bg-black/45 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-amber-500 font-mono"
                                      required={!tcIsOldCustomer}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Photo / Screenshot */}
                              <ScreenshotUpload 
                                screenshot={activeScreenshot}
                                onScreenshotChange={setActiveScreenshot}
                                label="Complaint Evidence / Screenshot"
                              />

                              {/* Phone Number */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block font-mono">Phone Number *</label>
                                <input
                                  type="tel"
                                  placeholder="+966 5x xxx xxxx"
                                  value={tcPhoneNumber}
                                  onChange={(e) => setTcPhoneNumber(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-pink-500 font-mono"
                                  required
                                />
                              </div>

                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block ml-1" htmlFor="tc-clinic">Clinic Name *</label>
                                <select
                                  id="tc-clinic"
                                  value={tcClinicName}
                                  onChange={(e) => setTcClinicName(e.target.value)}
                                  className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer focus:ring-1 focus:ring-indigo-500/30"
                                  required
                                >
                                  <option value="" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Select a Clinic</option>
                                  <option value="dermadent" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Dermadent</option>
                                  <option value="onetouch1" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 1 AlMu'tarid</option>
                                  <option value="onetouch2" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 2 Markhaniya</option>
                                  <option value="welltouch" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">WellTouch</option>
                                  <option value="newedge" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">New Edge</option>
                                </select>
                              </div>

                              {/* Complaint details */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Customer Complaint / Issue Details *</label>
                                <textarea
                                  placeholder="Patient notes or description of the issue or service failure..."
                                  value={tcComplaintDetails}
                                  onChange={(e) => setTcComplaintDetails(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-pink-500 font-sans min-h-[80px] resize-y font-medium"
                                  required
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isFormSubmitting}
                                className={`w-full py-3.5 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-sans shadow ${isFormSubmitting ? 'bg-pink-900 opacity-65 pointer-events-none' : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:brightness-110 active:scale-[0.99] shadow-pink-500/10'}`}
                              >
                                {isFormSubmitting ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-700/30 border-t-white rounded-full animate-spin" />
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
                            <div className="p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-3xl space-y-4 shadow-2xl animate-fade-in">
                              <h3 className="text-lg font-bold text-slate-700 font-display flex items-center gap-2 text-left">
                                <MessageSquare className="w-5 h-5 text-indigo-400" />
                                Submit Communication Request
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal text-left">
                                Submit a request for Chat or Social Media agents to contact a client and follow up.
                              </p>

                              <form onSubmit={handleSubmitClientComms} className="space-y-4 pt-2 text-left">
                                {/* Clinic Name */}
                                <div className="space-y-1 sm:col-span-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block ml-1">Clinic Name *</label>
                                  <select
                                    value={ccClinicName}
                                    onChange={(e) => setCcClinicName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer focus:ring-1 focus:ring-indigo-500/30"
                                    required
                                  >
                                    <option value="" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Select a Clinic</option>
                                    <option value="dermadent" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Dermadent</option>
                                    <option value="onetouch1" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 1 AlMu'tarid</option>
                                    <option value="onetouch2" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 2 Markhaniya</option>
                                    <option value="welltouch" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">WellTouch</option>
                                    <option value="newedge" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">New Edge</option>
                                  </select>
                                </div>

                                {/* Phone Number */}
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block font-mono">Phone Number *</label>
                                  <input
                                    type="tel"
                                    placeholder="+966 5x xxx xxxx"
                                    value={ccPhoneNumber}
                                    onChange={(e) => setCcPhoneNumber(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                                    required
                                  />
                                </div>

                                {/* Language */}
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Language Priority *</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setCcLanguage('Arabic')}
                                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center border cursor-pointer ${
                                        ccLanguage === 'Arabic'
                                          ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                                          : 'bg-black/25 border-slate-200 dark:border-slate-700/5 text-slate-500 dark:text-slate-400'
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
                                          : 'bg-black/25 border-slate-200 dark:border-slate-700/5 text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      English
                                    </button>
                                  </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Inquiry Details / Notes *</label>
                                  <textarea
                                    placeholder="Explain the required follow up..."
                                    value={ccNotes}
                                    onChange={(e) => setCcNotes(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans min-h-[80px] resize-y font-medium"
                                    required
                                  />
                                </div>

                                <ScreenshotUpload 
                                  screenshot={activeScreenshot}
                                  onScreenshotChange={setActiveScreenshot}
                                  label="Customer Inquiry Screenshot"
                                />

                                <button
                                  type="submit"
                                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-[0.99] text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-sans shadow shadow-indigo-500/10"
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
                      <div className="p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-3xl space-y-4 shadow-2xl">
                        
                        {/* Filters and search Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-700/5 pb-4">
                          <h3 className="text-lg font-bold text-slate-700 font-sans flex items-center gap-2">
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
                            <span className="absolute left-3 top-2.5 text-slate-500 dark:text-slate-400">
                              <Search className="w-4 h-4" />
                            </span>
                            <input
                              type="text"
                              placeholder={localSubTab === 'client-comms' ? "Search clinic, phone..." : "Search patient, phone, file..."}
                              value={ttSearchQuery}
                              onChange={(e) => setTtSearchQuery(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                            />
                          </div>
                        </div>

                        {/* Dropdown Filters and status segment selection buttons */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-left">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold font-sans">Filter status:</span>
                          <div className="flex items-center gap-1.5 bg-black/35 p-1 rounded-xl border border-slate-200 dark:border-slate-700/5">
                            <button
                              onClick={() => setTtFilterStatus('all')}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer ${ttFilterStatus === 'all' ? 'bg-indigo-600 text-white font-sans' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 font-sans'}`}
                            >
                              <History className="w-3 h-3" />
                              All History
                            </button>
                            <button
                              onClick={() => setTtFilterStatus('not_confirmed')}
                              className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer ${ttFilterStatus === 'not_confirmed' ? 'bg-amber-400/20 text-amber-300 border border-amber-500/20 font-sans' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 font-sans'}`}
                            >
                              {localSubTab === 'requests' ? '⏳ Pending Confirm' : localSubTab === 'complaints' ? '⏳ Pending TL' : '⏳ Pending Contact'}
                            </button>
                            <button
                              onClick={() => setTtFilterStatus('confirmed')}
                              className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer ${ttFilterStatus === 'confirmed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20 font-sans' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 font-sans'}`}
                            >
                              {localSubTab === 'requests' ? '📞 Pending Contact' : localSubTab === 'complaints' ? '📞 Pending Contact' : '✅ Contacted'}
                            </button>
                            {localSubTab !== 'client-comms' && (
                              <button
                                onClick={() => setTtFilterStatus('contacted')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] uppercase cursor-pointer ${ttFilterStatus === 'contacted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-sans' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 font-sans'}`}
                              >
                                {localSubTab === 'requests' ? '✅ Contacted' : '✅ Closed'}
                              </button>
                            )}
                          </div>

                          <span className="text-slate-500 dark:text-slate-400 font-semibold font-sans ml-auto">
                            {localSubTab === 'requests' ? 'Platform:' : 'Clinic:'}
                          </span>
                          {localSubTab !== 'requests' ? (
                            <select
                              value={tcFilterClinic}
                              onChange={(e) => setTcFilterClinic(e.target.value)}
                              className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-2.5 py-1 text-[11px] text-slate-700 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
                            >
                              <option value="all" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">All Clinics</option>
                              <option value="dermadent" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Dermadent</option>
                              <option value="onetouch1" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 1 AlMu'tarid</option>
                              <option value="onetouch2" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Touch 2 Markhaniya</option>
                              <option value="welltouch" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">WellTouch</option>
                              <option value="newedge" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">New Edge</option>
                            </select>
                          ) : (
                            <select
                              value={ttFilterProvider}
                              onChange={(e) => setTtFilterProvider(e.target.value as any)}
                              className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-2.5 py-1 text-[11px] text-slate-700 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
                            >
                              <option value="all" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">All Providers</option>
                              <option value="tabby" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Tabby Only</option>
                              <option value="tamara" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">Tamara Only</option>
                              <option value="one_time_payment" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">One Time Payment</option>
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
                                    r.patientName.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    r.fileNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    r.phoneNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    r.agentName?.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
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
                                <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/10 bg-slate-50 dark:bg-slate-800/[0.02] space-y-2">
                                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900/50 flex items-center justify-center mx-auto text-white0">
                                    <Wallet className="w-6 h-6" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-700 font-sans">No installment requests matching criteria.</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Requests will be logged here with live status loops and response timers.</p>
                                </div>
                              ) : (
                                
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {tabbyTamaraRequests
                                    .filter(r => {
                                      const isMyRequest = r.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
                                      if (!isTLOreSupport && !isMyRequest) return false;

                                      const matchesSearch = 
                                        r.patientName.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        r.fileNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        r.phoneNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        r.agentName?.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
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
                                          className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-md overflow-hidden bg-white dark:bg-slate-900/40 backdrop-blur-lg/60 ${
                                            isPendingContact 
                                              ? 'border-rose-500/30 bg-gradient-to-b from-rose-950/10 to-transparent animate-pulse' 
                                              : isAwaitingConfirm 
                                              ? 'border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent' 
                                              : 'border-slate-200 dark:border-slate-700/5'
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
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">File: {req.fileNumber || 'N/A'}</span>
                                                {req.clinicName && (
                                                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/10 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300">
                                                    🏥 {req.clinicName}
                                                  </span>
                                                )}
                                              </div>
                                              <h4 className="text-sm font-black text-slate-700 font-sans mt-1">{req.patientName}</h4>
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
                                          <div className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl space-y-2 text-xs text-left">
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                              <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submitting Agent:</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-bold truncate">{req.agentName}</p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Type:</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-bold font-sans">
                                                  {req.isOldCustomer ? '👤 Old Customer' : '🆕 New Customer'}
                                                </p>
                                              </div>
                                            </div>

                                            {!req.isOldCustomer && req.idNumber && (
                                              <div className="border-t border-slate-200 dark:border-slate-700/5 pt-1">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID Number:</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-mono font-bold">{req.idNumber}</p>
                                              </div>
                                            )}

                                            <div className="border-t border-slate-200 dark:border-slate-700/5 pt-1.5 grid grid-cols-2 gap-2">
                                              <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price:</p>
                                                <p className="text-emerald-400 font-mono font-extrabold font-sans text-xs">
                                                  SAR {req.priceWithoutTax} <span className="text-[10px] text-indigo-400 font-medium ml-1">({!isNaN(Number(req.priceWithoutTax)) ? (Number(req.priceWithoutTax) * 1.05).toFixed(2) : '-'})</span>
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone number:</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-mono font-bold truncate">{req.phoneNumber}</p>
                                              </div>
                                            </div>

                                            {req.notes && (
                                              <div className="border-t border-slate-200 dark:border-slate-700/5 pt-1 text-[11px] text-slate-600 dark:text-slate-300 italic">
                                                <span className="font-bold text-slate-500 dark:text-slate-400 not-italic">Notes: </span>"{req.notes}"
                                              </div>
                                            )}

                                            {req.paymentScreenshot && (
                                              <div className="border-t border-slate-200 dark:border-slate-700/5 pt-2">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                  <ImageIcon className="w-3 h-3 text-indigo-400" />
                                                  Screenshot
                                                </p>
                                                <img 
                                                  src={req.paymentScreenshot} 
                                                  alt="Payment Screenshot" 
                                                  className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700/10 cursor-zoom-in hover:brightness-110 transition-all"
                                                  onClick={() => window.open(req.paymentScreenshot, '_blank')}
                                                />
                                              </div>
                                            )}

                                            {req.paymentLink && (
                                              <div className="border-t border-slate-200 dark:border-slate-700/5 pt-2 flex justify-between items-center bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                                                <div className="space-y-0.5 truncate mr-2">
                                                  <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold">💳 Payment Link / URL:</p>
                                                  <p className="text-xs text-slate-700 dark:text-slate-200 truncate font-mono">{req.paymentLink}</p>
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
                                                <p className="bg-white dark:bg-slate-900/5 p-2 rounded-lg border border-amber-500/10 text-slate-700 dark:text-slate-200 leading-normal font-sans">
                                                  {req.tlNotes}
                                                </p>
                                              </div>
                                            )}

                                            {req.tlLinks && (
                                              <div className="border-t border-slate-200 dark:border-slate-700/5 pt-1.5 text-xs">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">🔗 TL Provided Links:</p>
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
                                                          Link {idx + 1}
                                                        </a>
                                                        <button
                                                          onClick={() => {
                                                            navigator.clipboard.writeText(trimmed);
                                                            toast.success('Link copied!');
                                                          }}
                                                          className="p-1 hover:bg-slate-50 dark:bg-slate-800/80 rounded text-slate-500 dark:text-slate-400 hover:text-white"
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
                                            <div className="p-4 bg-white dark:bg-slate-900/90 border border-amber-500/20 rounded-xl space-y-3.5 text-left animate-fade-in mt-2 mb-2">
                                              <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">Payment Link / URL *</label>
                                                <input
                                                  type="text"
                                                  placeholder="https://..."
                                                  value={tlFintechPaymentLink}
                                                  onChange={(e) => setTlFintechPaymentLink(e.target.value)}
                                                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-700/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans"
                                                />
                                              </div>

                                              <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">TL Notes & Guidance (Optional)</label>
                                                <textarea
                                                  placeholder="Add notes, pointers, or remarks..."
                                                  value={tlFintechNotes}
                                                  onChange={(e) => setTlFintechNotes(e.target.value)}
                                                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-700/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans min-h-[60px]"
                                                />
                                              </div>

                                              <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">Links / anything else (Optional, comma-separated)</label>
                                                <input
                                                  type="text"
                                                  placeholder="https://link1.com, https://link2.com"
                                                  value={tlFintechLinks}
                                                  onChange={(e) => setTlFintechLinks(e.target.value)}
                                                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-700/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans"
                                                />
                                              </div>

                                              <div className="flex gap-2 justify-end">
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveFintechHandlingId(null)}
                                                  className="px-2.5 py-1.5 hover:bg-slate-850 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
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
                                            <div className="p-3 bg-black/15 rounded-xl border border-slate-200 dark:border-slate-700/[0.02] flex items-center justify-between text-xs font-sans">
                                              <div className="space-y-0.5 text-left">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Confirmed by {req.confirmedBy}:</p>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300">{new Date(req.confirmedAt || req.createdAt).toLocaleString()}</p>
                                              </div>

                                              <div className="text-right space-y-0.5">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">{isCompleted ? 'Turnaround' : 'Pending Contact time'}:</p>
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
                                          <div className="flex gap-2 justify-end pt-1 border-t border-slate-200 dark:border-slate-700/5">
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
                                                  const details = `*Platform:* ${req.platform}\n*File Number:* ${req.fileNumber || 'N/A'}\n*Patient Name:* ${req.patientName}\n*ID/ID Number:* ${req.idNumber || 'N/A'}\n*Phone Number:* ${req.phoneNumber}\n*Price (Without Tax):* SAR ${req.priceWithoutTax}\n*Notes:*\n_ ${req.notes || 'None'} _`;
                                                  navigator.clipboard.writeText(details);
                                                  toast.success('Payment request details copied!');
                                                }}
                                                className="px-2.5 py-1.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/10 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-700 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
                                                className="px-3 py-1.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold font-sans text-[10px] rounded-lg border border-slate-200 dark:border-slate-700/5 transition-all cursor-pointer flex items-center gap-1"
                                              >
                                                Undo Contact
                                              </button>
                                            )}
                                          </div>
                                          
                                          <div className="w-full mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/5">
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
                                    c.patientName.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    c.fileNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    c.phoneNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    c.agentName?.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
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
                                <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/10 bg-slate-50 dark:bg-slate-800/[0.02] space-y-2 animate-fade-in">
                                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900/50 flex items-center justify-center mx-auto text-white0">
                                    <AlertTriangle className="w-6 h-6 text-pink-500" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-700 font-sans">No complaints matching criteria.</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Logged complaints, issues and dispute timelines will load here.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in font-sans">
                                  {tabbyTamaraComplaints
                                    .filter(c => {
                                      const isMyComplaint = c.agentName?.toLowerCase() === currentUser?.name?.toLowerCase();
                                      if (!isTLOreSupport && !isMyComplaint) return false;

                                      const matchesSearch = 
                                        c.patientName.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        c.fileNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        c.phoneNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                        c.agentName?.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
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
                                          className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-md overflow-hidden bg-white dark:bg-slate-900/40 backdrop-blur-lg/60 ${
                                            isNeedContact 
                                              ? 'border-pink-500/30 bg-gradient-to-b from-pink-955/10 to-transparent animate-pulse' 
                                              : isPendingTL 
                                              ? 'border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent' 
                                              : 'border-slate-200 dark:border-slate-700/5'
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
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">File: {comp.fileNumber}</span>
                                                {comp.clinicName && (
                                                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/10 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300">
                                                    🏥 {comp.clinicName}
                                                  </span>
                                                )}
                                              </div>
                                              <h4 className="text-sm font-black text-slate-700 font-sans mt-1">{comp.patientName}</h4>
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
                                          <div className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl space-y-2 text-xs text-left">
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                              <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submitting Agent:</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-bold truncate">{comp.agentName}</p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Type:</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-bold font-sans">
                                                  {comp.isOldCustomer ? '👤 Old Customer' : '🆕 New Customer'}
                                                </p>
                                              </div>
                                            </div>

                                            {!comp.isOldCustomer && comp.idNumber && (
                                              <div className="border-t border-slate-200 dark:border-slate-700/5 pt-1">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID Number:</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-mono font-bold">{comp.idNumber}</p>
                                              </div>
                                            )}

                                            <div className="border-t border-slate-200 dark:border-slate-700/5 pt-1.5 grid grid-cols-2 gap-2">
                                              {comp.imageUrl ? (
                                                <div className="col-span-2">
                                                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Photo / Screenshot:</p>
                                                  <img src={comp.imageUrl} alt="Complaint Attachment" className="max-h-32 rounded-lg border border-slate-200 dark:border-slate-700/10" />
                                                </div>
                                              ) : (
                                                <div>
                                                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Photo URL:</p>
                                                  <p className="text-white0 font-mono font-bold font-sans text-xs">N/A</p>
                                                </div>
                                              )}
                                              <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone number:</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-mono font-bold truncate">{comp.phoneNumber}</p>
                                              </div>
                                            </div>

                                            {comp.complaintDetails && (
                                              <div className="border-t border-slate-200 dark:border-slate-700/5 pt-1.5 text-xs text-slate-600 dark:text-slate-300">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 font-bold">Complaint Issue:</p>
                                                <p className="bg-black/25 p-2 rounded-lg border border-slate-200 dark:border-slate-700/[0.03] text-slate-600 dark:text-slate-300 leading-normal font-sans italic">
                                                  "{comp.complaintDetails}"
                                                </p>
                                              </div>
                                            )}

                                            {comp.tlComment && (
                                              <div className="border-t border-rose-500/20 pt-1.5 text-xs text-amber-300">
                                                <p className="text-[9px] text-rose-400 uppercase tracking-wider mb-0.5 font-bold">💬 Team Leader Answer ({comp.tlName || 'TL'}):</p>
                                                <p className="bg-rose-950/10 p-2 rounded-lg border border-pink-500/10 text-slate-700 dark:text-slate-200 leading-normal font-sans">
                                                  {comp.tlComment}
                                                </p>
                                              </div>
                                            )}
                                          </div>

                                          {/* Timers */}
                                          {isNeedContact && (
                                            <div className="p-3 bg-black/15 rounded-xl border border-slate-200 dark:border-slate-700/[0.02] flex items-center justify-between text-xs font-sans">
                                              <div className="space-y-0.5 text-left">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Commented on:</p>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300">{comp.commentedAt ? new Date(comp.commentedAt).toLocaleString() : 'N/A'}</p>
                                              </div>

                                              <div className="text-right space-y-0.5">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold text-rose-400">Timer on Agent:</p>
                                                <p className="font-mono text-xs font-black px-2 py-0.5 rounded text-rose-400 bg-rose-500/10 animate-pulse">
                                                  {getElapsedTimerString(comp.commentedAt || comp.createdAt)}
                                                </p>
                                              </div>
                                            </div>
                                          )}

                                          {isClosed && (
                                            <div className="p-3 bg-black/15 rounded-xl border border-slate-200 dark:border-slate-700/[0.02] flex items-center justify-between text-xs font-sans">
                                              <div className="space-y-0.5 text-left">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Closed on:</p>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300">{comp.closedAt ? new Date(comp.closedAt).toLocaleString() : 'N/A'}</p>
                                              </div>

                                              <div className="text-right space-y-0.5">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Completion SLA:</p>
                                                <p className="font-mono text-xs font-black px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10">
                                                  {getElapsedTimerString(comp.createdAt, comp.closedAt)}
                                                </p>
                                              </div>
                                            </div>
                                          )}

                                          {/* Inline TL Reply Input Form */}
                                          {activeComplaintHandlingId === comp.id && isTLOreSupport && (
                                            <div className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-xl space-y-2 text-left animate-fade-in mt-1">
                                              <label className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest block">TL Commentary / Answer *</label>
                                              <textarea
                                                placeholder="Write comment/resolution details to update status to Pending Contact..."
                                                value={tlComplaintComment}
                                                onChange={(e) => setTlComplaintComment(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans min-h-[60px]"
                                                required
                                              />
                                              <div className="flex gap-2 justify-end">
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveComplaintHandlingId(null)}
                                                  className="px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleTLCommentComplaint(comp.id, tlComplaintComment)}
                                                  className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-pink-600 hover:brightness-110 active:scale-95 text-slate-700 text-[10px] font-bold rounded-lg shadow cursor-pointer transition-all flex items-center gap-1"
                                                >
                                                  Submit Issue Review
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Action Footers */}
                                          <div className="flex gap-2 justify-end pt-1 border-t border-slate-200 dark:border-slate-700/5">
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
                                                  const details = `*Complaint ID:* ${comp.id}\n*Patient Name:* ${comp.patientName}\n*File Number:* ${comp.fileNumber || 'N/A'}\n*Phone Number:* ${comp.phoneNumber}\n*Complaint Text:*\n_ ${comp.text} _\n*TL Comment:*\n_ ${comp.tlComment || 'No comment yet'} _`;
                                                  navigator.clipboard.writeText(details);
                                                  toast.success('Complaint details copied!');
                                                }}
                                                className="px-2.5 py-1.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/10 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-700 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
                                                className="px-3 py-1.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold font-sans text-[10px] rounded-lg border border-slate-200 dark:border-slate-700/5 transition-all cursor-pointer flex items-center gap-1"
                                              >
                                                Reopen Complaint
                                              </button>
                                            )}
                                          </div>
                                          
                                          <div className="w-full mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/5 mx-[2px]">
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
                                    c.phoneNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    c.callCenterAgentName?.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
                                    (c.handledBy && c.handledBy.toLowerCase().includes(ttSearchQuery.toLowerCase()));

                                  const matchesStatus = 
                                    ttFilterStatus === 'all' ||
                                    (ttFilterStatus === 'not_confirmed' || ttFilterStatus === 'confirmed' ? c.status === 'pending' : false) ||
                                    (ttFilterStatus === 'contacted' && c.status === 'contacted');

                                  const matchesClinic = tcFilterClinic === 'all' || c.clinicName?.toLowerCase() === tcFilterClinic.toLowerCase();

                                  return matchesSearch && matchesStatus && matchesClinic;
                                }).length === 0 ? (
                                <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/10 bg-slate-50 dark:bg-slate-800/[0.02] space-y-2 animate-fade-in">
                                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900/50 flex items-center justify-center mx-auto text-white0">
                                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-700 font-sans">No communication requests matching criteria.</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Requests for Chat and Social Media agents will appear here.</p>
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
                                        c.phoneNumber.toLowerCase().includes(ttSearchQuery.toLowerCase()) ||
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
                                          className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-md overflow-hidden bg-white dark:bg-slate-900/40 backdrop-blur-lg/60 ${
                                            isPending 
                                              ? 'border-indigo-500/30 bg-gradient-to-b from-indigo-950/10 to-transparent' 
                                              : 'border-slate-200 dark:border-slate-700/5'
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
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/10 ${req.language === 'Arabic' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-blue-500/10 text-blue-300'}`}>
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
                                          <div className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl space-y-2 text-xs text-left">
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                              <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requested By:</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-bold truncate">{req.callCenterAgentName}</p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone number:</p>
                                                <p className="text-indigo-300 font-mono font-bold truncate">{req.phoneNumber}</p>
                                              </div>
                                            </div>

                                            <div className="border-t border-slate-200 dark:border-slate-700/5 pt-1.5 text-xs text-slate-600 dark:text-slate-300">
                                              <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 font-bold">Notes / Inquiry:</p>
                                              <p className="bg-black/25 p-2 rounded-lg border border-slate-200 dark:border-slate-700/[0.03] text-slate-600 dark:text-slate-300 leading-normal font-sans italic">
                                                "{req.notes}"
                                              </p>
                                            </div>

                                            {req.screenshot && (
                                              <div className="border-t border-slate-200 dark:border-slate-700/5 pt-2">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                  <ImageIcon className="w-3 h-3 text-indigo-400" />
                                                  Screenshot
                                                </p>
                                                <img 
                                                  src={req.screenshot} 
                                                  alt="Communication Request Evidence" 
                                                  className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700/10 cursor-zoom-in hover:brightness-110 transition-all shadow-md"
                                                  onClick={() => window.open(req.screenshot, '_blank')}
                                                />
                                              </div>
                                            )}

                                            {req.handlingNotes && (
                                              <div className="border-t border-indigo-500/20 pt-1.5 text-xs text-indigo-300">
                                                <p className="text-[9px] text-indigo-400 uppercase tracking-wider mb-0.5 font-bold">💬 Resolution Notes ({req.handledBy}):</p>
                                                <p className="bg-indigo-950/20 p-2 rounded-lg border border-indigo-500/10 text-slate-700 dark:text-slate-200 leading-normal font-sans">
                                                  {req.handlingNotes}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Timers */}
                                          <div className="p-3 bg-black/15 rounded-xl border border-slate-200 dark:border-slate-700/[0.02] flex items-center justify-between text-xs font-sans">
                                            <div className="space-y-0.5 text-left">
                                              <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">{isClosed ? 'Closed By' : 'Submitted'}:</p>
                                              <p className="text-[10px] text-slate-600 dark:text-slate-300">
                                                {isClosed ? req.handledBy : new Date(req.createdAt).toLocaleString()}
                                              </p>
                                            </div>

                                            <div className="text-right space-y-0.5">
                                              <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">{isClosed ? 'Turnaround Time' : (isInProgress ? 'Time Active' : 'Time Waiting')}:</p>
                                              <p className={`font-mono text-xs font-black px-2 py-0.5 rounded ${isClosed ? 'text-emerald-400 bg-emerald-500/10' : (isInProgress ? 'text-indigo-400 bg-indigo-500/10 animate-pulse' : 'text-amber-400 bg-amber-500/10animate-pulse')}`}>
                                                {isClosed && req.handledAt ? getElapsedTimerString(req.createdAt, req.handledAt) : getElapsedTimerString(req.createdAt)}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Inline Handling form */}
                                          {activeCcHandlingId === req.id && (
                                            <div className="p-3 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-xl space-y-2 text-left animate-fade-in mt-1">
                                              <label className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest block">Handling Notes *</label>
                                              <textarea
                                                placeholder="What was the outcome of contacting the client?"
                                                value={ccHandlingNotes}
                                                onChange={(e) => setCcHandlingNotes(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans min-h-[60px]"
                                                required
                                              />
                                              <div className="flex gap-2 justify-end">
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveCcHandlingId(null)}
                                                  className="px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
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
                                          <div className="flex gap-2 justify-end pt-1 border-t border-slate-200 dark:border-slate-700/5">
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
                                                  const details = `*Call Center Request ID:* ${req.id}\n*Requested By:* ${req.callCenterAgentName}\n*Clinic:* ${req.clinicName}\n*Language:* ${req.language}\n*Phone Number:* ${req.phoneNumber}\n*Notes:*\n_ ${req.notes} _\n*Resolution Notes:*\n_ ${req.handlingNotes || 'Pending response'} _`;
                                                  navigator.clipboard.writeText(details);
                                                  toast.success('Client communication details copied!');
                                                }}
                                                className="px-2.5 py-1.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/10 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-700 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
                                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 text-slate-700 font-sans font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                              >
                                                📞 Finalize Handled
                                              </button>
                                            )}
                                          </div>
                                          
                                          <div className="w-full mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/5 mx-[2px]">
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
                    return f.tlName.toLowerCase() === currentUser?.name?.toLowerCase();
                  }
                  // Amira can filter by TL name
                  if (feedbackFilterTl !== 'all') {
                    return f.tlName.toLowerCase() === feedbackFilterTl.toLowerCase();
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
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-200 dark:border-slate-700/5 pb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-amber-400 font-display flex items-center gap-3">
                          <CheckCircle2 className="w-8 h-8 text-amber-400 animate-pulse" />
                          {currentUser.role === 'tl' ? "Director Hub" : "TL Hub"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{currentUser.role === 'tl' ? "Exclusive feedback and communication portal with the Director." : "View feedback and updates from the Team Leaders and Director."}</p>
                      </div>

                      {/* Filter by Team Leader for Amira */}
                      {isAmira && (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <label className="text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium font-sans">Filter by TL:</label>
                          <select
                            value={feedbackFilterTl}
                            onChange={(e) => setFeedbackFilterTl(e.target.value)}
                            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-400 font-sans w-full sm:w-48"
                          >
                            <option value="all" className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">All Team Leaders</option>
                            {availableTlsForSelect.map(tl => (
                              <option key={tl} value={tl} className="bg-slate-50 dark:bg-slate-800 text-slate-700 ">{tl}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Amira Hassan Submission Console */}
                    {isAmira && (
                      <div className="bg-white dark:bg-slate-900/50 border text-slate-700 border-slate-200 dark:border-slate-700/10 rounded-3xl shadow-sm p-6 space-y-4">
                        <div className="border-b border-slate-200 dark:border-slate-700/5 pb-3">
                          <h3 className="font-bold text-slate-700 text-base font-display flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            Compose Feedback to Team Leader
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Choose a TL, type notes with markdown instructions and any @mentions. Optional file upload as attachment.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1">
                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-bold font-sans">Target Team Leader:</label>
                            <select
                              value={selectedTlForFeedback}
                              onChange={(e) => setSelectedTlForFeedback(e.target.value)}
                              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-amber-400 font-sans w-full cursor-pointer"
                            >
                              <option value="" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg">-- Choose TL --</option>
                              {availableTlsForSelect.map(tl => (
                                <option key={tl} value={tl} className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg">{tl}</option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-bold font-sans">Attach File (Images/Documents):</label>
                            <div className="flex gap-3">
                              <label className="flex-1 flex items-center justify-between px-3.5 py-2 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/10 rounded-xl cursor-pointer transition-all">
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate pr-2">
                                  {feedbackAttachmentName || 'Choose file or drag & drop...'}
                                </span>
                                <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
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
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-bold font-sans">Feedback & Action Plan Notes:</label>
                          <textarea
                            value={feedbackNotes}
                            onChange={(e) => setFeedbackNotes(e.target.value)}
                            rows={4}
                            placeholder="Type details... Bold text is supported by using **double asterisks**. Tag anyone using @Name, they will get an instant ping notification!"
                            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl text-sm text-slate-700 px-4 py-3 focus:outline-none focus:border-amber-400 w-full placeholder:text-white0 font-sans leading-relaxed"
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
                        <div className="py-12 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-3xl text-center">
                          <MessageSquare className="w-12 h-12 text-white0 opacity-40 mx-auto mb-3" />
                          <h4 className="font-bold text-slate-700 text-base">No Feedbacks Logged</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">There are no records in the selected Category.</p>
                        </div>
                      ) : (
                        filteredFeedbacks.map((f) => {
                          return (
                            <div key={f.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl space-y-6 text-left">
                              {/* Card Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-700/5 pb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-400 font-mono">
                                    TL
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-slate-700 text-base">{f.tlName}</h4>
                                      <span className="text-[10px] text-white0 font-medium">Addressed to TL</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Created by Director: {f.directorName} • {new Date(f.createdAt).toLocaleString()}</p>
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
                                <div className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                  {/* Format inline mentions and bold */}
                                  {f.notes.split('\n').map((line, idx) => (
                                    <p key={idx} className="mb-2">
                                      {line.split(/(\s+)/).map((word, wIdx) => {
                                        if (word.startsWith('@')) {
                                          return <span key={wIdx} className="bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded text-xs">{word}</span>;
                                        }
                                        if (word.startsWith('**') && word.endsWith('**')) {
                                          return <strong key={wIdx} className="font-extrabold text-slate-700">{word.slice(2, -2)}</strong>;
                                        }
                                        return word;
                                      })}
                                    </p>
                                  ))}
                                </div>

                                {/* Attachment block */}
                                {f.attachment && (
                                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl">
                                    <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                      <p className="text-xs text-slate-700 font-semibold truncate">{f.attachmentName || 'evaluation_attachment'}</p>
                                      <p className="text-[10px] text-white0 font-mono">Attachment Available</p>
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
                              <div className="border-t border-slate-200 dark:border-slate-700/5 pt-5 space-y-4">
                                <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-display">Conversation Logs & Replies</h5>
                                
                                {f.replies.length === 0 ? (
                                  <p className="text-white0 text-xs italic">No replies in this micro-thread yet.</p>
                                ) : (
                                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-2">
                                    {f.replies.map((r) => {
                                      const isSenderAmira = r.senderName.toLowerCase() === 'amira hassan';

                                      return (
                                        <div 
                                          key={r.id} 
                                          className={`p-3.5 rounded-2xl border transition-all ${
                                            isSenderAmira 
                                              ? 'bg-indigo-950/10 border-indigo-500/10 ml-8' 
                                              : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/10 mr-8'
                                          }`}
                                        >
                                          <div className="flex justify-between items-center mb-1.5">
                                            <span className={`text-xs font-bold ${isSenderAmira ? 'text-indigo-300' : 'text-amber-400'}`}>
                                              {isSenderAmira ? '👑 ' : '👤 '} {r.senderName}
                                            </span>
                                            <span className="text-[9px] text-white0 font-mono">{new Date(r.createdAt).toLocaleString()}</span>
                                          </div>
                                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {r.text.split(/(\s+)/).map((word, wIdx) => {
                                              if (word.startsWith('@')) {
                                                return <span key={wIdx} className="bg-indigo-550/20 text-indigo-200 font-bold px-1 py-0.5 rounded text-[11px]">{word}</span>;
                                              }
                                              return word;
                                            })}
                                          </p>

                                          {/* Reply Attachment */}
                                          {r.attachment && (
                                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg mt-2 justify-between">
                                              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{r.attachmentName || 'reply_attachment'}</span>
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
                                <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/10 space-y-3 mt-2">
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                      <textarea
                                        value={feedbackReplies[f.id] || ''}
                                        onChange={(e) => setFeedbackReplies(prev => ({ ...prev, [f.id]: e.target.value }))}
                                        rows={2}
                                        placeholder="Type your reply notes..."
                                        className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl text-xs text-slate-700 px-3 py-2 focus:outline-none focus:border-amber-400 w-full placeholder:text-white0 font-sans"
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

              {/* Headcount / Directory Panel */}
              {activeTab === 'directory' && (() => {
                const globalMeta = getAgentMeta();
                return (
                  <div id="directory-desk-root" className="space-y-6 animate-fade-in text-left">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-200 dark:border-slate-700/5 pb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-cyan-400 font-display flex items-center gap-3">
                          <UserCheck className="w-8 h-8" />
                          Headcount / Directory
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">View comprehensive agent data and personal contacts</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-64">
                          <span className="absolute left-3 top-2.5 text-slate-500 dark:text-slate-400">
                            <Search className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            placeholder="Search names, phones, emails..."
                            value={directorySearchQuery}
                            onChange={(e) => setDirectorySearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 font-sans font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Headcount Upload Console directly under directory tab for Hesham & Amira */}
                    {isSuperAdmin && (
                      <div className="bg-white dark:bg-slate-900/50 border text-slate-700 border-slate-200 dark:border-slate-700/10 rounded-3xl shadow-sm p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-700/5 gap-3">
                          <div className="text-left">
                            <h3 className="font-bold text-slate-700 text-base font-display flex items-center gap-2">
                              <Upload className="w-5 h-5 text-cyan-400" />
                              Upload Directory / Headcount File
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Import CSV or Google Sheet to overwrite all agent metadata and contact directories</p>
                          </div>
                          <button
                            onClick={() => {
                              const csvContent = "Agent Name,Email,Phone,LOB,LOB Team,Role,Team Leader\nJohn Doe,john@example.com,555-0199,Chat,Support,agent,Amira Hassan\nJane Smith,jane@example.com,555-0122,Social Media,Moderator,tl,Hesham Sobhy";
                              const blob = new Blob([csvContent], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'headcount_directory_template.csv';
                              a.click();
                            }}
                            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Templates
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* CSV File Upload Section */}
                          <div
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700/10 hover:border-slate-200 dark:border-slate-700/20 bg-black/30 rounded-2xl p-6 text-center transition-all relative flex flex-col items-center justify-center gap-3 min-h-[160px]"
                          >
                            <input
                              type="file"
                              accept=".csv,.xlsx,.json,.xls"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                handleDirectoryFile(file);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/25 rounded-2xl flex items-center justify-center">
                              <Upload className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">Drag or Browse Headcount File</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Accepts .CSV, .XLSX, and .JSON files</p>
                            </div>
                          </div>

                          {/* Google Sheets Link Integration */}
                          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center transition-all">
                            <div className="w-10 h-10 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-2xl flex items-center justify-center shadow-inner">
                              <svg className="w-5 h-5 bg-slate-50 dark:bg-slate-800 rounded-full p-0.5" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                              </svg>
                            </div>
                            <div className="w-full space-y-2">
                              <input
                                type="text"
                                placeholder="Paste Google Sheets URL or Document ID..."
                                value={googleSheetId}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    const idMatch = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
                                    const gidMatch = val.match(/gid=([0-9]+)/);
                                    
                                    if (idMatch) {
                                      const id = idMatch[1];
                                      setGoogleSheetId(id);
                                      setStorageItem('sched_google_sheet_id', id);
                                    } else {
                                      setGoogleSheetId(val);
                                      setStorageItem('sched_google_sheet_id', val);
                                    }

                                    if (gidMatch) {
                                      const gid = gidMatch[1];
                                      setGoogleSheetGid(gid);
                                      setStorageItem('sched_google_sheet_gid', gid);
                                    }
                                }}
                                className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 text-slate-700 placeholder-emerald-500/40 text-xs rounded-xl px-3 py-2 w-full focus:outline-none focus:border-emerald-500 text-center"
                              />
                              <button
                                onClick={async () => {
                                  if (!googleSheetId) {
                                     toast.error("Please provide a valid Google Sheet ID or URL.");
                                     return;
                                  }
                                  try {
                                    setIsSyncingSheets(true);
                                    const csvText = await fetchGoogleSheetCSV(googleSheetId, googleSheetGid);
                                    if (!csvText || csvText.trim().length === 0) {
                                       throw new Error("No data found in the sheet.");
                                    }
                                    const result = parseAgentDirectoryCSV(csvText);
                                    if (result.errors.length > 0) {
                                       toast.error(`Warnings: ${result.errors.slice(0, 3).join(', ')}`);
                                    }
                                    if (result.directory.length > 0) {
                                       setAgentDirectory(result.directory);
                                       setDirectoryHeaders(result.headers);
                                       setStorageItem('sched_agent_directory', result.directory);
                                       setStorageItem('sched_agent_directory_headers', result.headers);
                                       
                                       const allKnown = new Set(agentsList);
                                       result.directory.forEach(a => allKnown.add(a.agentName));
                                       const updatedList = Array.from(allKnown);
                                       setAgentsList(updatedList);
                                       setStorageItem('sched_agents_list', updatedList);

                                       const newMeta = { ...getAgentMeta() };
                                       let hasMetaUpdate = false;
                                       const tlHeader = result.headers.find(h => {
                                           const lh = h.toLowerCase().trim();
                                           return lh === 'tl' || lh === 'team leader' || lh.includes('manager') || lh.includes('supervisor') || lh.includes('lead') || lh === 'tl name';
                                       });
                                       const roleHeader = result.headers.find(h => {
                                           const lh = h.toLowerCase().trim();
                                           return lh === 'role' || lh === 'lob' || lh.includes('account') || lh.includes('designation') || lh.includes('job title') || lh.includes('department') || lh.includes('function') || lh.includes('business');
                                       });
                                       if (tlHeader || roleHeader) {
                                           result.directory.forEach(a => {
                                               let updated = false;
                                               if (!newMeta[a.agentName]) newMeta[a.agentName] = { roleType: '', tlName: '' };
                                               if (tlHeader && a.data[tlHeader]) {
                                                   const val = a.data[tlHeader].trim();
                                                   if (val) {
                                                       newMeta[a.agentName].tlName = val;
                                                       updated = true;
                                                   }
                                               }
                                               if (roleHeader && a.data[roleHeader]) {
                                                   const val = a.data[roleHeader].trim();
                                                   if (val) {
                                                       newMeta[a.agentName].roleType = val;
                                                       updated = true;
                                                   }
                                               }
                                               if (updated) hasMetaUpdate = true;
                                           });
                                           if (hasMetaUpdate) {
                                               setStorageItem('sched_agent_meta', newMeta);
                                           }
                                        }
                                       toast.success(`Excel extraction applied! Directory has ${result.directory.length} agents.`);
                                    } else {
                                       toast.error('No agent data parsed from sheet.');
                                    }
                                  } catch (err: any) {
                                    toast.error("Extraction failed: " + err.message);
                                  } finally {
                                    setIsSyncingSheets(false);
                                  }
                                }}
                                disabled={isSyncingSheets}
                                className={`w-full py-2 text-center rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all ${
                                  isSyncingSheets ? 'bg-emerald-500/50 text-slate-700 dark:text-slate-200' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                }`}
                              >
                                {isSyncingSheets ? 'Syncing...' : 'Sync Directory Sheet'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(() => {
                      const displayDirectory = [...agentDirectory];
                      const dirNames = new Set(displayDirectory.map(r => r.agentName?.toLowerCase()));
                      agentsList.forEach(aName => {
                        if (!dirNames.has(aName?.toLowerCase())) {
                           displayDirectory.push({
                              id: 'syn_' + Math.random().toString(36),
                              agentName: aName,
                              data: {
                                'Role': globalMeta[aName]?.roleType || '-',
                                'Team Leader': globalMeta[aName]?.tlName || '-',
                              }
                           });
                        }
                      });
                      
                      const displayHeaders = directoryHeaders.length > 0 ? directoryHeaders : ['Role', 'Team Leader'];

                      if (displayDirectory.length === 0) {
                        return (
                          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/10 bg-slate-50 dark:bg-slate-800/[0.02] space-y-3 shadow-xl">
                            <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900/50 flex items-center justify-center mx-auto text-white0 shadow-inner">
                              <UserCheck className="w-8 h-8 text-cyan-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 tracking-wide">No Directory Data Available</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">The Headcount roster document has not been compiled or mapped yet.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="bg-white dark:bg-slate-900/50 border border-cyan-500/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                              <tr className="bg-gradient-to-r from-cyan-950/40 to-slate-900 border-b border-cyan-500/20 text-[10px] font-black uppercase tracking-widest text-cyan-300 font-sans">
                                <th className="px-5 py-4 rounded-tl-2xl whitespace-nowrap">Agent Name</th>
                                {displayHeaders.map((h, i) => (
                                  <th key={`${h}-${i}`} className="px-3 py-4 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 text-xs text-slate-600 dark:text-slate-300 font-sans border-b border-slate-200 dark:border-slate-700/10">
                              {(() => {
                                const filteredData = displayDirectory.filter(row => {
                                  if (!directorySearchQuery) return true;
                                  const q = directorySearchQuery.toLowerCase();
                                  if (row.agentName?.toLowerCase().includes(q)) return true;
                                  return Object.values(row.data).some(val => typeof val === 'string' && val.toLowerCase().includes(q));
                                });

                                if (filteredData.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={displayHeaders.length + 1} className="py-12 text-center text-white0 font-sans">
                                        <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                        No agents match your search criteria.
                                      </td>
                                    </tr>
                                  );
                                }

                                return filteredData.sort((a,b) => a.agentName.localeCompare(b.agentName)).map(row => (
                                  <tr key={row.id} className="hover:bg-cyan-500/10 transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600/30 to-blue-500/30 text-cyan-300 flex items-center justify-center font-black border border-cyan-500/40 shadow-inner">
                                        {row.agentName.substring(0,2).toUpperCase()}
                                      </div>
                                      <span className="font-bold text-slate-700 font-display text-sm relative group-hover:text-cyan-400 transition-colors">
                                        {row.agentName}
                                        {globalMeta[row.agentName]?.roleType === 'TL' && (
                                           <span className="absolute -top-3.5 left-0 px-1.5 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black uppercase tracking-widest">Team Lead</span>
                                        )}
                                      </span>
                                    </td>
                                    {displayHeaders.map((h, i) => {
                                      const value = row.data[h] || '-';
                                      const isEmail = h.toLowerCase().includes('email');
                                      const isPhone = h.toLowerCase().includes('phone') || h.toLowerCase().includes('mobile') || h.toLowerCase().includes('number');
                                      const isRole = h.toLowerCase().includes('role') || h.toLowerCase().includes('lob');
                                      const isTL = h.toLowerCase().includes('tl') || h.toLowerCase().includes('leader') || h.toLowerCase().includes('manager');
                                      
                                      return (
                                        <td key={`${h}-${i}`} className="px-3 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                          {isEmail && value !== '-' ? (
                                            <a href={`mailto:${value}`} className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5 transition-colors text-xs font-mono font-bold bg-cyan-500/10 px-2.5 py-1 rounded-lg w-max border border-cyan-500/20">
                                              <Mail className="w-3 h-3" /> {value}
                                            </a>
                                          ) : isPhone && value !== '-' ? (
                                            <a href={`tel:${value}`} className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1.5 transition-colors text-xs font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg w-max border border-emerald-500/20">
                                              <Phone className="w-3 h-3" /> {value}
                                            </a>
                                          ) : isRole && value !== '-' ? (
                                            <span className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700/10 shadow-sm">
                                              {value}
                                            </span>
                                          ) : isTL && value !== '-' ? (
                                            <span className="text-amber-400/90 font-bold text-xs flex items-center gap-1.5">
                                              <Shield className="w-3 h-3" /> {value}
                                            </span>
                                          ) : (
                                            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{value}</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Internal Cases Full-Page Panel */}
              {activeTab === 'cases' && (() => {
                const canSeeAllCases = isTLOreSupport || isSuperAdmin;

                // SECURE MANDATE:
                // Normal agents see ONLY their own cases.
                // TLs can see everything but "per day" by default, and can filter dates name agent anything.
                const securedCases = cases.filter((c: any) => {
                  if (!canSeeAllCases) {
                    return String(c.agentName || '').toLowerCase() === currentUser?.name?.toLowerCase();
                  }
                  return true;
                });

                // Compute unique list of agent names from all cases to populate TL dropdown
                const uniqueAgentNamesInCases = Array.from(new Set(cases.map((c: any) => String(c.agentName || ''))))
                  .map(String)
                  .filter(name => name && name.trim().length > 0)
                  .sort();

                // Compute final filtered cases list
                const finalFilteredCases = securedCases.filter((c: any) => {
                  const query = caseSearchQuery.trim().toLowerCase();
                  const matchesSearch = !query || (
                    String(c.patientName || '').toLowerCase().includes(query) ||
                    (c.phoneNumber && String(c.phoneNumber).includes(query)) ||
                    String(c.id || '').toLowerCase().includes(query) ||
                    String(c.agentName || '').toLowerCase().includes(query) ||
                    (c.inquiry && String(c.inquiry).toLowerCase().includes(query)) ||
                    (c.branch && String(c.branch).toLowerCase().includes(query)) ||
                    (c.service && String(c.service).toLowerCase().includes(query)) ||
                    (c.leadSource && String(c.leadSource).toLowerCase().includes(query))
                  );

                  // Date match
                  const matchesDate = !caseDateFilter || String(c.createdAt || '').startsWith(caseDateFilter);

                  // Agent match (only TLs can filter other agents, normal agents are secured anyway)
                  const matchesAgent = !canSeeAllCases || caseAgentFilter === 'all' || String(c.agentName || '').toLowerCase() === caseAgentFilter.toLowerCase();

                  return matchesSearch && matchesDate && matchesAgent;
                });

                return (
                  <div id="cases-desk-root" className="space-y-6 animate-fade-in text-left">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-200 dark:border-slate-700/5 pb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-slate-700 font-display flex items-center gap-2.5">
                          <ClipboardList className="w-8 h-8 text-emerald-400" />
                          {canSeeAllCases ? "Organization Booking Registry" : "My Internal Cases"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          {canSeeAllCases 
                            ? "Team Leaders Consolidated Desk — inspect, search, and audit all agent booking performance" 
                            : "Submit and track your internal patient booking cases secure desk."}
                        </p>
                      </div>
                    </div>

                    {/* Integrated Interactive Control Center */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-2xl p-4 flex flex-col md:flex-row flex-wrap items-center gap-4 shadow-xl">
                      {/* Search client input */}
                      <div className="relative flex-1 min-w-[200px] w-full font-sans">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                          <Search className="w-4 h-4" />
                        </span>
                        <input 
                          type="text"
                          placeholder="Search patient, phone, ref, branch..."
                          className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-sans"
                          value={caseSearchQuery}
                          onChange={(e) => setCaseSearchQuery(e.target.value)}
                          id="case-search-input"
                        />
                      </div>

                      {/* Date Filter Picker */}
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0 font-sans">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 shrink-0 select-none">Date</span>
                        <div className="relative flex items-center gap-1.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl px-2.5 py-1.5">
                          <input 
                            type="date"
                            value={caseDateFilter}
                            onChange={(e) => setCaseDateFilter(e.target.value)}
                            className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none font-mono cursor-pointer border-none"
                            style={{ colorScheme: 'dark' }}
                          />
                          {caseDateFilter ? (
                            <button 
                              onClick={() => setCaseDateFilter('')}
                              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-1 hover:bg-rose-500/10 rounded whitespace-nowrap transition-colors"
                              title="Clear Date Filter (Show All Days)"
                            >
                              Show All
                            </button>
                          ) : (
                            <button 
                              onClick={() => setCaseDateFilter(getLocalISOString())}
                              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-1 hover:bg-emerald-500/10 rounded whitespace-nowrap transition-colors"
                              title="Set Date to Today"
                            >
                              Today
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Agent Filter Picker (TL ONLY) */}
                      {canSeeAllCases && (
                        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 font-sans">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 shrink-0 select-none">Agent</span>
                          <select 
                            id="case-agent-filter"
                            value={caseAgentFilter}
                            onChange={(e) => setCaseAgentFilter(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl py-1.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 font-semibold cursor-pointer font-sans"
                          >
                            <option value="all">All Agents</option>
                            {uniqueAgentNamesInCases.map(name => (
                              <option key={name} value={name.toLowerCase()}>{formatAgentName(name)}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Form */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-3xl sticky top-6">
                          <div className="flex items-center gap-3 mb-6">
                            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                              <Wallet className="w-5 h-5" />
                            </span>
                            <h3 className="text-xl font-bold text-slate-700 font-display">Submit Case</h3>
                          </div>
                          
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (isFormSubmitting) return;
                            if (!currentUser || !casePatientName || !casePhoneNumber || !caseInquiry || !caseLeadSource) {
                              toast.error("Please fill in all mandatory fields including Lead Source.");
                              return;
                            }
                            setIsFormSubmitting(true);
                            try {
                              const finalLeadSource = (caseLeadSource.toLowerCase().includes('blogger') || caseLeadSource.toLowerCase().includes('bloger')) && caseBloggerName
                                ? `${caseLeadSource} (${caseBloggerName})`
                                : caseLeadSource;

                              const newCase = {
                                id: 'case_' + Date.now(),
                                agentName: currentUser.name,
                                patientName: casePatientName,
                                phoneNumber: casePhoneNumber,
                                inquiry: caseInquiry,
                                leadSource: finalLeadSource,
                                createdAt: new Date().toISOString(),
                                screenshot: activeScreenshot || undefined
                              };
                              const updated = [newCase, ...cases];
                              setCases(updated);
                              setStorageItem('sched_cases', updated);
                              
                              // Sync to Firestore
                              await setDoc(doc(db, "cases", newCase.id), newCase);
                              
                              setCasePatientName('');
                              setCasePhoneNumber('');
                              setCaseInquiry('');
                              setCaseLeadSource('');
                              setCaseBloggerName('');
                              setActiveScreenshot(null);
                              setCaseBranch('');
                              setCaseService('');
                              setCaseCallType('');
                              setCaseTicketStatus('Closed');
                              setCasePatientType('New');
                              setCaseTicketType('Inquiry');
                              
                              addSystemNotification(`📋 New Case Logged`, `${currentUser.name} submitted a new case for ${casePatientName} (${casePhoneNumber})`, 'general', 'tl');
                              
                              setSubmissionConfirmation({
                                title: "Case Successfully Filed! 📋",
                                message: `The case entry has been added successfully to the patient history registry. Duplicity block holds.`,
                                type: 'case',
                                referenceId: newCase.id
                              });
                            } catch (err) {
                              console.error(err);
                              toast.error("Error submitting case. Please try again.");
                            } finally {
                              setIsFormSubmitting(false);
                            }
                          }} className="space-y-4">
                            
                            <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors">
                              <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Patient/Client Name *</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 opacity-50">
                                  <UserIcon className="w-4 h-4" />
                                </span>
                                <input required type="text" placeholder="John Doe" value={casePatientName} onChange={e => setCasePatientName(e.target.value)} className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/5 transition-all font-sans" />
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors">
                              <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Phone Number *</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 opacity-50">
                                  <PhoneCall className="w-4 h-4" />
                                </span>
                                <input required type="text" placeholder="0500000000" value={casePhoneNumber} onChange={e => setCasePhoneNumber(e.target.value)} className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/5 transition-all font-mono tracking-widest" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors">
                                <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Patient Type *</label>
                                <select value={casePatientType} onChange={e => setCasePatientType(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer">
                                  <option value="New">New</option>
                                  <option value="Follow up / Existing">Follow up / Existing</option>
                                </select>
                              </div>
                              <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors">
                                <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Service *</label>
                                <select value={caseService} onChange={e => setCaseService(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer" required>
                                  <option value="">Select service...</option>
                                  <option value="Dental">Dental</option>
                                  <option value="Derma">Derma</option>
                                  <option value="Facial">Facial</option>
                                  <option value="Hijama">Hijama</option>
                                  <option value="Laser">Laser</option>
                                  <option value="Plastic Surgery">Plastic Surgery</option>
                                  <option value="Slimming">Slimming</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors">
                                <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Branch *</label>
                                <select value={caseBranch} onChange={e => setCaseBranch(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer" required>
                                  <option value="">Select branch...</option>
                                  <option value="Dermadent VIP">Dermadent VIP</option>
                                  <option value="Dermadent">Dermadent</option>
                                  <option value="One Touch 1 AlMu'tarid">One Touch 1 AlMu'tarid</option>
                                  <option value="One Touch 2 Markhaniya">One Touch 2 Markhaniya</option>
                                  <option value="WellTouch">WellTouch</option>
                                  <option value="New Edge">New Edge</option>
                                </select>
                              </div>
                              <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors">
                                <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Source * (Mandatory)</label>
                                <select required value={caseLeadSource} onChange={e => { setCaseLeadSource(e.target.value); if (!e.target.value.toLowerCase().includes('blogger')) setCaseBloggerName(''); }} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer">
                                  <option value="">Select source...</option>
                                  <option value="Blogger">Blogger</option>
                                  <option value="Existing">Existing</option>
                                  <option value="Google map">Google map</option>
                                  <option value="Instagram">Instagram</option>
                                  <option value="SMS">SMS</option>
                                  <option value="Snap Chat">Snap Chat</option>
                                  <option value="TikTok">TikTok</option>
                                  <option value="Whats app">Whats app</option>
                                  <option value="facebook">facebook</option>
                                  <option value="location">location</option>
                                  <option value="referral">referral</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors">
                                <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Ticket Type *</label>
                                <select value={caseTicketType} onChange={e => setCaseTicketType(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer">
                                  <option value="Inquiry">Inquiry</option>
                                  <option value="Complaint">Complaint</option>
                                  <option value="Appointment">Appointment</option>
                                </select>
                              </div>
                              <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors">
                                <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Call Type *</label>
                                <select value={caseCallType} onChange={e => setCaseCallType(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer" required>
                                  <option value="">Select call type...</option>
                                  <option value="Inquiry only">Inquiry only</option>
                                  <option value="Booked">Booked</option>
                                  <option value="Call dropped / hang up">Call dropped / hang up</option>
                                  <option value="Cancel">Cancel</option>
                                  <option value="Complain">Complain</option>
                                  <option value="Customer said he will call Back">Customer said he will call Back</option>
                                  <option value="Customer said that he booked">Customer said that he booked</option>
                                  <option value="Didnt book / expensive">Didnt book / expensive</option>
                                  <option value="Job Application">Job Application</option>
                                  <option value="Long Distance">Long Distance</option>
                                  <option value="Reschedule">Reschedule</option>
                                  <option value="Silent Chat">Silent Chat</option>
                                  <option value="Want to be contacted through What's app">Want to be contacted through What's app</option>
                                  <option value="Want to be contacted through calls">Want to be contacted through calls</option>
                                  <option value="Wrong Audience">Wrong Audience</option>
                                </select>
                              </div>
                            </div>

                            {/* Blogger Name Text Field */}
                            {(caseLeadSource.toLowerCase().includes('blogger') || caseLeadSource.toLowerCase().includes('bloger')) && (
                              <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors animate-fade-in">
                                <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Blogger Name * (Mandatory)</label>
                                <input
                                  required
                                  type="text"
                                  placeholder="Type blogger name..."
                                  value={caseBloggerName}
                                  onChange={e => setCaseBloggerName(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-900/30 transition-all font-sans"
                                />
                              </div>
                            )}

                            <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors">
                              <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Inquiry / Details *</label>
                              <div className="relative">
                                <textarea required rows={4} placeholder="Specific diagnostic or financial inquiry details..." value={caseInquiry} onChange={e => setCaseInquiry(e.target.value)} className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/5 transition-all font-sans" />
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 focus-within:text-emerald-400 text-slate-500 dark:text-slate-400 transition-colors bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-slate-700/5">
                              <label className="text-[10px] font-bold uppercase tracking-widest block font-sans">Ticket Status</label>
                              <select value={caseTicketStatus} onChange={e => setCaseTicketStatus(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer">
                                <option value="Closed">Closed</option>
                                <option value="Open">Open</option>
                              </select>
                              <p className="text-[10px] opacity-60">Default is closed — open it if still in progress</p>
                            </div>

                            <ScreenshotUpload 
                              screenshot={activeScreenshot}
                              onScreenshotChange={setActiveScreenshot}
                              label="Evidence / Screenshot"
                            />
                            
                            <button type="submit" className="w-full py-2.5 px-4 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold font-sans text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                              <Send className="w-4 h-4" />
                              Log My Case
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Right: Feed */}
                      <div className="lg:col-span-8 flex flex-col space-y-4">
                        <div className="space-y-3 pt-6 sm:pt-0">
                          {finalFilteredCases.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/5 border-dashed rounded-3xl bg-white dark:bg-slate-900/40/[0.02] backdrop-blur-xl font-sans space-y-2">
                              <Search className="w-8 h-8 text-slate-600 mx-auto opacity-40 mb-1" />
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No matching cases found</p>
                              <p className="text-xs text-white0 max-w-sm mx-auto">
                                {canSeeAllCases 
                                  ? "No case records match your set search filters, selected date, or agent selection." 
                                  : "You haven't logged any cases matching the selected search terms or date range."}
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {finalFilteredCases.map(c => (
                                  <div key={c.id} className="p-5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-2xl flex flex-col gap-3 font-sans relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 flex gap-2">
                                      {isWithinFiveMinutes(c.createdAt) && (
                                        <button
                                          onClick={() => setEditingItem({ type: 'case', id: c.id, data: { ...c } })}
                                          className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                          title={`Edit case (${getRemainingEditTimeStr(c.createdAt)})`}
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          const ref = c.id.split('_')[1];
                                          const details = `*Case Ref:* #${ref}\n*Patient Name:* ${c.patientName}\n*Phone Number:* ${c.phoneNumber}\n*Source:* ${c.leadSource || 'N/A'}\n*Branch:* ${c.branch || 'N/A'}\n*Service:* ${c.service || 'N/A'}\n*Call Type:* ${c.callType || 'N/A'}\n*Inquiry:*\n_ ${c.inquiry} _`;
                                          navigator.clipboard.writeText(details);
                                          toast.success('Case details + Ref copied!');
                                        }}
                                        className="p-1.5 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-700 rounded-lg transition-all cursor-pointer"
                                        title="Copy Case Details"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>
                                      {isSuperAdmin && (
                                        <button
                                          onClick={() => {
                                            if (!window.confirm('Are you sure you want to delete this case?')) return;
                                            const updated = cases.filter(item => item.id !== c.id);
                                             deleteDoc(doc(db, "cases", c.id)).catch(e => console.error("Case Delete Error:", e));
                                            setCases(updated);
                                            setStorageItem('sched_cases', updated);
                                          }}
                                          className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                          title="Delete Case"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest flex items-center justify-between">
                                         <span className="flex items-center gap-2">
                                           Case Ref: #{c.id.split('_')[1]?.slice(-6) || 'XXXXXX'}
                                         </span>
                                         {c.leadSource && (
                                           <span className="text-[9px] cursor-default font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none normal-case font-display italic">
                                             📢 {c.leadSource}
                                           </span>
                                         )}
                                       </p>
                                       <p className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                         <UserIcon className="w-4 h-4 text-emerald-400" />
                                         {c.patientName}
                                       </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {c.patientType && (
                                        <span className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-900/50 rounded-md text-emerald-400 border border-slate-200 dark:border-slate-700/5">
                                          {c.patientType} Patient
                                        </span>
                                      )}
                                      {c.branch && (
                                        <span className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-900/50 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/5">
                                          🏥 {c.branch}
                                        </span>
                                      )}
                                      {c.service && (
                                        <span className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-900/50 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/5">
                                          ✨ {c.service}
                                        </span>
                                      )}
                                      {c.ticketType && (
                                        <span className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-900/50 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/5">
                                          🎫 {c.ticketType}
                                        </span>
                                      )}
                                      {c.callType && (
                                        <span className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-900/50 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/5">
                                          📞 {c.callType}
                                        </span>
                                      )}
                                      {c.ticketStatus && (
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border text-white ${c.ticketStatus === 'Open' ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'bg-slate-500/20 border-slate-500/30 text-slate-600 dark:text-slate-300'}`}>
                                          Status: {c.ticketStatus}
                                        </span>
                                      )}
                                    </div>
                                    <div className="space-y-1 bg-white dark:bg-slate-900/50 p-2 rounded-lg mt-2 font-mono">
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold font-sans">Contact Details</p>
                                      <p className="text-xs text-slate-700 tracking-widest flex items-center gap-2">
                                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                                        {c.phoneNumber}
                                      </p>
                                    </div>
                                    <div className="text-sm mt-3 text-slate-600 dark:text-slate-300">
                                      <span className="text-[10px] uppercase font-bold text-white0 block mb-1">Inquiry / Details</span>
                                      <p className="bg-white dark:bg-slate-900/40 backdrop-blur-lg/40 p-3 rounded-lg whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300">
                                        {c.inquiry}
                                      </p>
                                    </div>
                                    
                                    {c.screenshot && (
                                      <div className="mt-3">
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1 ml-1 flex items-center gap-1.5">
                                          <ImageIcon className="w-3 h-3 text-emerald-400" />
                                          Attached Screenshot
                                        </p>
                                        <div className="relative group cursor-zoom-in">
                                          <img 
                                            src={c.screenshot} 
                                            alt="Case Attachment" 
                                            className="w-full h-auto rounded-xl border border-slate-200 dark:border-slate-700/10 group-hover:brightness-110 transition-all shadow-xl"
                                            onClick={() => window.open(c.screenshot, '_blank')}
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px] pointer-events-none">
                                            <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">Click to View Full Size</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between text-[10px] text-white0 border-t border-slate-200 dark:border-slate-700/5 pt-3 mt-1">
                                      <span>By: <span className="font-bold text-slate-600 dark:text-slate-300">{formatAgentName(c.agentName)}</span></span>
                                      <span>{new Date(c.createdAt).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                      })}</span>
                                    </div>
                                    <div className="w-full mt-2 mx-[1px]">
                                      <RequestReplyThread request={c} currentUser={currentUser} collectionName="cases" />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* History Full-Page Panel */}
              {activeTab === 'history' && currentUser && (() => {
                  // Aggregate history items
                  const allHistoryItems: any[] = [];
                  if (historyFilter === 'all' || historyFilter === 'scheduling') {
                     requests.filter(r => r.agentName === currentUser.name).forEach(r => {
                        allHistoryItems.push({
                           id: r.id,
                           type: r.type === 'swap' ? 'Swap Request' : 'Annual Leave',
                           date: r.createdAt,
                           summary: r.type === 'swap' ? `Swap with ${r.swapWithAgent} on ${(r as SwapRequest).date}` : `Leave from ${(r as AnnualRequest).startDate} to ${(r as AnnualRequest).endDate}`,
                           status: r.status,
                           icon: <Calendar className="w-4 h-4 text-blue-400" />
                        });
                     });
                  }
                  if (historyFilter === 'all' || historyFilter === 'inquiries') {
                     inquiries.filter(i => i.agentName === currentUser.name).forEach(i => {
                        allHistoryItems.push({
                           id: i.id,
                           type: 'Inquiry',
                           date: i.createdAt,
                           summary: i.text,
                           status: i.status === 'answered' ? 'approved' : (i.status === 'sent' ? 'pending' : 'pending'),
                           icon: <HelpCircle className="w-4 h-4 text-purple-400" />
                        });
                     });
                  }
                  if (historyFilter === 'all' || historyFilter === 'tabby') {
                     tabbyTamaraRequests.filter(r => r.agentName === currentUser.name).forEach(r => {
                        allHistoryItems.push({
                           id: r.id,
                           type: 'Tabby/Tamara',
                           date: r.createdAt,
                           summary: `Patient: ${r.patientName}`,
                           status: r.status === 'confirmed' ? 'approved' : 'pending',
                           icon: <Wallet className="w-4 h-4 text-amber-400" />
                        });
                     });
                  }
                  if (historyFilter === 'all' || historyFilter === 'complaints') {
                     tabbyTamaraComplaints.filter(c => c.agentName === currentUser.name).forEach(c => {
                        allHistoryItems.push({
                           id: c.id,
                           type: 'Complaint',
                           date: c.createdAt,
                           summary: `Patient: ${c.patientName}`,
                           status: c.status === 'closed' ? 'approved' : 'pending',
                           icon: <AlertTriangle className="w-4 h-4 text-rose-400" />
                        });
                     });
                  }
                  if (historyFilter === 'all' || historyFilter === 'comms') {
                     clientComms.filter(c => c.callCenterAgentName === currentUser.name || c.handledBy === currentUser.name).forEach(c => {
                        allHistoryItems.push({
                           id: c.id,
                           type: 'Client Comms',
                           date: c.createdAt,
                           summary: `Clinic: ${c.clinicName} • Phone: ${c.phoneNumber}`,
                           status: c.status === 'contacted' ? 'approved' : 'pending',
                           icon: <MessageCircle className="w-4 h-4 text-indigo-400" />
                        });
                     });
                  }
                  if (historyFilter === 'all' || historyFilter === 'cases') {
                     cases.filter(c => c.agentName === currentUser.name).forEach(c => {
                        allHistoryItems.push({
                           id: c.id,
                           type: 'Internal Case',
                           date: c.createdAt,
                           summary: `Patient: ${c.patientName} • Inquiry: ${c.inquiry.substring(0, 30)}...`,
                           status: 'approved',
                           icon: <FileText className="w-4 h-4 text-emerald-400" />
                        });
                     });
                  }

                  // Sort by date desc
                  allHistoryItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  return (
                    <div id="history-desk-root" className="space-y-6 animate-fade-in text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h2 className="text-3xl font-bold text-slate-700 font-display">My History</h2>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Review your submitted requests, inquiries and completed cases.</p>
                        </div>
                        
                        <div className="flex bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-xl p-1.5 w-full sm:w-auto relative">
                          <History className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-3" />
                          <select
                            value={historyFilter}
                            onChange={(e) => setHistoryFilter(e.target.value as any)}
                            className="w-full sm:w-auto bg-transparent border-none text-sm text-slate-700 focus:outline-none font-sans font-medium pl-8 pr-4 py-1.5 appearance-none cursor-pointer"
                          >
                            <option value="all" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg">All History ({allHistoryItems.length})</option>
                            <option value="scheduling" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg">Scheduling Requests</option>
                            <option value="inquiries" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg">Inquiries / Ask TL</option>
                            <option value="tabby" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg">Tabby & Tamara Requests</option>
                            <option value="complaints" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg">Complaints Desk</option>
                            <option value="comms" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg">Client Comms</option>
                            <option value="cases" className="bg-slate-50 dark:bg-slate-800 text-slate-700 backdrop-blur-lg">Internal Cases</option>
                          </select>
                          <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute right-3 top-3 rotate-90" />
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                          <History className="w-64 h-64 text-blue-500" />
                        </div>

                        {allHistoryItems.length === 0 ? (
                            <div className="py-12 text-center flex flex-col items-center">
                              <History className="w-12 h-12 text-indigo-500/50 mb-3" />
                              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No history records match current filter</p>
                            </div>
                        ) : (
                            <div className="space-y-3 relative z-10">
                              {allHistoryItems.map((item, idx) => (
                                <div key={`${item.id}-${idx}`} className="flex items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 hover:border-slate-200 dark:border-slate-700/10 rounded-2xl transition-all gap-4 flex-col sm:flex-row">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 flex items-center justify-center shrink-0">
                                      {item.icon}
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-700 text-sm">{item.type}</p>
                                        <span className="text-[10px] text-white0 font-mono tracking-wider">{new Date(item.date).toLocaleString()}</span>
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 md:line-clamp-1">{item.summary}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="shrink-0">
                                    {item.status === 'approved' && (
                                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                        Resolved / Approved
                                      </span>
                                    )}
                                    {item.status === 'pending' && (
                                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        Pending
                                      </span>
                                    )}
                                    {item.status === 'declined' && (
                                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                        Declined
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                        )}
                      </div>
                    </div>
                  );
              })()}

              {activeTab === 'qa-scorecard' && currentUser && (
                <QAScorecards 
                  currentUser={currentUser}
                  qaScores={qaScores}
                  agentsList={agentsList}
                  qaTemplate={qaTemplate}
                  onUpdateQATemplate={(newTemplate) => {
                    setQaTemplate(newTemplate);
                    setStorageItem('sched_qa_template', newTemplate);
                    setDoc(doc(db, "system", "sched_qa_template"), { data: newTemplate }).catch(console.error);
                  }}
                  addSystemNotification={addSystemNotification}
                  onSubmitScore={(score) => {
                    const newScores = [score, ...qaScores];
                    setQaScores(newScores);
                    setStorageItem('sched_qa_scores', newScores);
                    setDoc(doc(db, "qa_scores", score.id), score).catch(e => console.error("QA Save Error:", e));
                  }}
                />
              )}

              {activeTab === 'kpi-calculator' && (isTLOreSupport || isMasterAdmin) && (() => {
                
                const calculateAchievement = (metric: typeof kpiMetrics[0]) => {
                  if (metric.formula && metric.formula.trim()) {
                    return evaluateKpiFormula(metric.formula, metric.actual, metric.target);
                  }
                  if (metric.target === 0) return 0;
                  if (metric.type === 'higher') {
                    return Math.min(100, Math.max(0, (metric.actual / metric.target) * 100));
                  } else {
                    return Math.min(100, Math.max(0, (metric.target / metric.actual) * 100)); // simple inverse
                  }
                };

                const totalWeight = kpiMetrics.reduce((sum, m) => sum + m.weight, 0);
                
                let totalScore = 0;
                if (totalWeight > 0) {
                  totalScore = kpiMetrics.reduce((sum, metric) => {
                    return sum + (calculateAchievement(metric) * (metric.weight / totalWeight));
                  }, 0);
                }

                const payoutBonus = (totalScore / 100) * kpiMaxBonus;

                return (
                  <div className="space-y-6 animate-fade-in text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-3xl font-bold text-purple-400 font-display flex items-center gap-3">
                          <Calculator className="w-8 h-8" />
                          KPIs Bonus Calculator
                        </h2>
                        <p className="text-purple-300/70 text-sm">Target vs Actual Performance Payout Calculation in EGP</p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/50 border text-slate-700 border-slate-200 dark:border-slate-700/10 rounded-3xl shadow-sm p-6 space-y-6">
                       
                       <div className="flex flex-col md:flex-row gap-4 mb-6">
                         <div className="flex-1 space-y-1">
                           <label className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Select Agent</label>
                           <select
                              value={kpiAgentTarget}
                              onChange={(e) => setKpiAgentTarget(e.target.value)}
                              className="w-full bg-black/40 border border-slate-200 dark:border-slate-700/10 rounded-xl px-4 py-2 text-sm text-slate-700 outline-none focus:border-purple-500"
                           >
                             <option value="">Select an Agent...</option>
                             {agentsList.map(a => <option key={a} value={a}>{a}</option>)}
                           </select>
                         </div>
                         <div className="flex-1 space-y-1">
                           <label className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Max Bonus Target (EGP)</label>
                           <input
                              type="number"
                              value={kpiMaxBonus}
                              onChange={(e) => setKpiMaxBonus(Number(e.target.value))}
                              className="w-full bg-black/40 border border-slate-200 dark:border-slate-700/10 rounded-xl px-4 py-2 text-sm text-slate-700 outline-none focus:border-purple-500"
                              placeholder="e.g. 3000"
                           />
                         </div>
                       </div>

                       <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse min-w-[700px]">
                           <thead>
                             <tr className="border-b border-slate-200 dark:border-slate-700/10 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                               <th className="pb-3 px-4">Metric / KPI Name</th>
                               <th className="pb-3 px-4">Target</th>
                               <th className="pb-3 px-4">Actual</th>
                               <th className="pb-3 px-4">Weight (%)</th>
                               <th className="pb-3 px-4">Type</th>
                               <th className="pb-3 px-4">Equation / Formula</th>
                               <th className="pb-3 px-4 text-right">Achievement</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                             {kpiMetrics.map((metric, i) => {
                               const ach = calculateAchievement(metric);
                               return (
                                 <tr key={metric.id} className="text-sm">
                                   <td className="py-3 px-4">
                                      <input 
                                        type="text"
                                        value={metric.name}
                                        onChange={e => {
                                          const newM = [...kpiMetrics];
                                          newM[i].name = e.target.value;
                                          setKpiMetrics(newM);
                                        }}
                                        className="bg-black/20 border border-slate-200 dark:border-slate-700/5 rounded px-2 py-1 w-full text-slate-700"
                                      />
                                   </td>
                                   <td className="py-3 px-4">
                                      <input 
                                        type="number"
                                        value={metric.target}
                                        onChange={e => {
                                          const newM = [...kpiMetrics];
                                          newM[i].target = Number(e.target.value);
                                          setKpiMetrics(newM);
                                        }}
                                        className="bg-black/20 border border-slate-200 dark:border-slate-700/5 rounded px-2 py-1 w-24 text-slate-700"
                                      />
                                   </td>
                                   <td className="py-3 px-4">
                                      <input 
                                        type="number"
                                        value={metric.actual}
                                        onChange={e => {
                                          const newM = [...kpiMetrics];
                                          newM[i].actual = Number(e.target.value);
                                          setKpiMetrics(newM);
                                        }}
                                        className="bg-black/20 border border-slate-200 dark:border-slate-700/5 rounded px-2 py-1 w-24 text-slate-700"
                                      />
                                   </td>
                                   <td className="py-3 px-4">
                                      <input 
                                        type="number"
                                        value={metric.weight}
                                        onChange={e => {
                                          const newM = [...kpiMetrics];
                                          newM[i].weight = Number(e.target.value);
                                          setKpiMetrics(newM);
                                        }}
                                        className="bg-black/20 border border-slate-200 dark:border-slate-700/5 rounded px-2 py-1 w-20 text-slate-700"
                                      />
                                   </td>
                                   <td className="py-3 px-4">
                                      <select 
                                        value={metric.type}
                                        onChange={e => {
                                          const newM = [...kpiMetrics];
                                          newM[i].type = e.target.value as any;
                                          setKpiMetrics(newM);
                                        }}
                                        className="bg-black/20 border border-slate-200 dark:border-slate-700/5 rounded px-2 py-1 text-slate-700"
                                      >
                                        <option value="higher">Higher = Better</option>
                                        <option value="lower">Lower = Better</option>
                                      </select>
                                   </td>
                                   <td className="py-3 px-4">
                                      <input 
                                        type="text"
                                        value={metric.formula || ''}
                                        onChange={e => {
                                          const newM = [...kpiMetrics];
                                          newM[i].formula = e.target.value;
                                          setKpiMetrics(newM);
                                        }}
                                        placeholder="e.g. (actual / target) * 100"
                                        className="bg-black/20 border border-slate-200 dark:border-slate-700/5 rounded px-2 py-1 w-44 text-slate-700 font-mono text-xs"
                                      />
                                   </td>
                                   <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                     {ach.toFixed(1)}%
                                   </td>
                                 </tr>
                               );
                             })}
                           </tbody>
                         </table>
                       </div>

                       <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700/5 mt-4">
                         <div className="flex items-center gap-6">
                            <div>
                               <span className="block text-xs uppercase text-white0 font-bold mb-1">Total Weight</span>
                               <span className={`text-lg font-mono font-black ${totalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                 {totalWeight}% 
                                 {totalWeight !== 100 && <span className="text-xs ml-2 opacity-60 font-sans tracking-tight">Should be 100%</span>}
                               </span>
                            </div>
                            <div>
                               <span className="block text-xs uppercase text-white0 font-bold mb-1">Final Score</span>
                               <span className="text-lg font-mono font-black text-indigo-400">{totalScore.toFixed(1)}%</span>
                            </div>
                         </div>
                         <div className="text-right flex flex-col justify-end">
                           <span className="block text-xs uppercase text-white0 font-bold mb-1">Calculated Bonus Payout</span>
                           <span className="text-3xl font-black text-rose-500 font-mono tracking-tight">EGP {payoutBonus.toFixed(2)}</span>
                           <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">Based on {kpiMaxBonus} EGP Target Bonus</p>
                         </div>
                       </div>

                       <div className="flex gap-3 justify-end pt-4">
                         <button
                           onClick={() => {
                             setKpiMetrics([...kpiMetrics, { id: Date.now().toString(), name: 'New Metric', target: 0, actual: 0, weight: 0, type: 'higher', formula: '(actual / target) * 100' }]);
                           }}
                           className="px-4 py-2 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 text-white rounded-xl text-xs font-bold transition-colors"
                         >
                           + Add Metric
                         </button>
                       </div>
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'submissions-log' && (isTLOreSupport || isMasterAdmin) && (() => {
                // Compile all interactive records
                const items: any[] = [];
                inquiries.forEach(i => items.push({
                  id: i.id,
                  type: 'Inquiry',
                  category: 'General',
                  agent: i.agentName,
                  patient: 'N/A',
                  clinic: i.clinicName || 'N/A',
                  date: i.createdAt,
                  details: i.text,
                  status: i.status || 'sent',
                  badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                  raw: i
                }));
                tabbyTamaraRequests.forEach(r => items.push({
                  id: r.id,
                  type: 'TT Request',
                  category: r.platform || 'Tabby/Tamara',
                  agent: r.agentName,
                  patient: r.patientName,
                  clinic: r.clinicName || 'N/A',
                  date: r.createdAt,
                  details: `Amount: SAR ${r.priceWithoutTax || 'N/A'}`,
                  status: r.status || 'confirmed',
                  badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
                  raw: r
                }));
                tabbyTamaraComplaints.forEach(c => items.push({
                  id: c.id,
                  type: 'Complaint',
                  category: 'Fintech',
                  agent: c.agentName,
                  patient: c.patientName,
                  clinic: c.clinicName || 'N/A',
                  date: c.createdAt,
                  details: c.complaintDetails,
                  status: c.status || 'pending',
                  badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
                  raw: c
                }));
                clientComms.forEach(cc => items.push({
                  id: cc.id,
                  type: 'Client Comm',
                  category: 'Call Center',
                  agent: cc.callCenterAgentName,
                  patient: cc.patientName || 'N/A',
                  clinic: cc.clinicName || 'N/A',
                  date: cc.createdAt,
                  details: cc.notes,
                  status: cc.status || 'contacted',
                  badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
                  raw: cc
                }));
                // Apply Filters
                const filtered = items.filter(item => {
                  const agentMatch = logAgentFilter === 'all' || item.agent.toLowerCase() === logAgentFilter.toLowerCase();
                  let typeMatch = false; if (logTypeFilter === 'pending') { typeMatch = item.status.toLowerCase() === 'pending'; } else { typeMatch = logTypeFilter === 'all' || item.type.toLowerCase() === logTypeFilter.toLowerCase(); }
                  
                  const queryLower = logSearchQuery.toLowerCase().trim();
                  const searchMatch = !queryLower || 
                    item.agent.toLowerCase().includes(queryLower) ||
                    item.patient.toLowerCase().includes(queryLower) ||
                    item.clinic.toLowerCase().includes(queryLower) ||
                    item.details.toLowerCase().includes(queryLower) ||
                    item.type.toLowerCase().includes(queryLower);

                  return agentMatch && typeMatch && searchMatch;
                });

                // Sort: Newest submissions first
                filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                // Key metrics counts
                const totalCount = filtered.length;
                const inquiryCount = filtered.filter(f => f.type === 'Inquiry').length;
                const requestCount = filtered.filter(f => f.type === 'TT Request').length;
                const complaintCount = filtered.filter(f => f.type === 'Complaint').length;
                const commsCount = filtered.filter(f => f.type === 'Client Comm').length;
                const pendingCount = filtered.filter(f => f.status.toLowerCase() === 'pending').length;

                return (
                  <div className="space-y-6 animate-fade-in text-left">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-700 font-display flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 text-purple-400" />
                        Agent Submissions Log
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time consolidated database feed of all patient inquiries, cases, and payment requests logged by agents.</p>
                    </div>

                    {/* Stats Summary Bento Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="bg-white dark:bg-slate-900/40/[0.02] border border-slate-200 dark:border-slate-700/5 p-4 rounded-2xl">
                        <span className="block text-xs uppercase text-white0 font-bold mb-1">Total Submissions</span>
                        <span className="text-2xl font-black font-mono text-purple-400">{totalCount}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900/40/[0.02] border border-slate-200 dark:border-slate-700/5 p-4 rounded-2xl">
                        <span className="block text-xs uppercase text-white0 font-bold mb-1">Pending Actions</span>
                        <span className="text-2xl font-black font-mono text-orange-400">{pendingCount}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900/40/[0.02] border border-slate-200 dark:border-slate-700/5 p-4 rounded-2xl">
                        <span className="block text-xs uppercase text-white0 font-bold mb-1">TT Requests</span>
                        <span className="text-2xl font-black font-mono text-rose-400">{requestCount}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900/40/[0.02] border border-slate-200 dark:border-slate-700/5 p-4 rounded-2xl">
                        <span className="block text-xs uppercase text-white0 font-bold mb-1">Inquiries</span>
                        <span className="text-2xl font-black font-mono text-amber-400">{inquiryCount}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900/40/[0.02] border border-slate-200 dark:border-slate-700/5 p-4 rounded-2xl col-span-2 lg:col-span-1">
                        <span className="block text-xs uppercase text-white0 font-bold mb-1">Complaints & Comms</span>
                        <span className="text-2xl font-black font-mono text-sky-400">{complaintCount + commsCount}</span>
                      </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/5 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1 w-full relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white0" />
                        <input
                          type="text"
                          value={logSearchQuery}
                          onChange={e => setLogSearchQuery(e.target.value)}
                          placeholder="Search patient, clinic, agency, keyword..."
                          className="w-full bg-black/40 border border-slate-200 dark:border-slate-700/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-500 font-sans outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="w-full md:w-48">
                        <select
                          value={logTypeFilter}
                          onChange={e => setLogTypeFilter(e.target.value)}
                          className="w-full bg-black/40 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-bold"
                        >
                          <option value="all">All Category Types</option>
                          <option value="inquiry">Inquiries</option>
                          <option value="tt request">TT Requests</option>
                          <option value="complaint">Complaints</option>
                          <option value="client comm">Client Comms</option>
                          <option value="pending">Pending Queue (All items)</option>
                        </select>
                      </div>
                      <div className="w-full md:w-48">
                        <select
                          value={logAgentFilter}
                          onChange={e => setLogAgentFilter(e.target.value)}
                          className="w-full bg-black/40 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-bold"
                        >
                          <option value="all">All Agents</option>
                          {agentsList.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Main Log List */}
                    <div className="space-y-4">
                      {filtered.length === 0 ? (
                        <div className="p-16 text-center text-white0 bg-black/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/10 font-sans">
                          No submissions matched your current search filters.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filtered.map(item => (
                            <div key={item.id} className="p-5 bg-gradient-to-br from-slate-900 via-slate-950/40 to-black border border-slate-200 dark:border-slate-700/10 rounded-2xl flex flex-col gap-3 backdrop-blur-xl relative hover:border-purple-500/40 transition-all font-sans">
                              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700/5 pb-2.5">
                                <div className="space-y-1">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                                    {item.type}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 pt-1">
                                    Patient: {item.patient}
                                  </h4>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  {new Date(item.date).toLocaleDateString(undefined, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/40/[0.02] p-3 rounded-xl border border-slate-200 dark:border-slate-700/5 leading-relaxed italic">
                                "{item.details}"
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/5 pt-3">
                                <div>
                                  <span className="block text-[8px] uppercase text-white0 font-bold">Logged By</span>
                                  <span className="font-bold text-slate-600 dark:text-slate-300">{item.agent}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] uppercase text-white0 font-bold">Clinic / Location</span>
                                  <span className="font-bold text-slate-600 dark:text-slate-300">{item.clinic}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'admin' && isMasterAdmin && (() => {
                const globalMeta = getAgentMeta();
                const availableTLs = ['Unassigned', ...agentsList.filter(a => globalMeta[a]?.roleType === 'TL' || isTLName(a) || a === 'Hesham Sobhy')];
                return (
                  <div id="master-admin-root" className="space-y-6 animate-fade-in text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-3xl font-bold text-rose-500 font-display flex items-center gap-3">
                          <ShieldCheck className="w-8 h-8" />
                          Master Control
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Super Admin privileges. Manage agent LOBs, assign TLs, and upload Headcount sheet.</p>
                      </div>
                      
                      <button
                        onClick={handleExportCloudBackup}
                        className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-500/10"
                      >
                        <Download className="w-4 h-4" />
                        Export Cloud Backup (JSON)
                      </button>
                    </div>

                    {/* Add Agent Manually */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                      <h3 className="font-bold text-slate-700 text-base mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-emerald-400" />
                        Add User Manually
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full">
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Full Name</label>
                          <input 
                            type="text" 
                            id="manual-agent-name"
                            placeholder="e.g. John Doe"
                            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-lg text-sm text-slate-700 px-3 py-2 focus:outline-none focus:border-emerald-500 w-full"
                          />
                        </div>
                        <div className="w-full sm:w-48">
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Role</label>
                          <select 
                            id="manual-agent-role"
                            className="text-slate-700 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-lg   px-3 py-2 focus:outline-none focus:border-emerald-500 w-full"
                          >
                            <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="Call Center">Call Center</option>
                            <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="Social Media">Social Media</option>
                            <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="TL">Team Leader (TL)</option>
                            <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="Director">Director</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => {
                            const nameInput = document.getElementById('manual-agent-name') as HTMLInputElement;
                            const roleInput = document.getElementById('manual-agent-role') as HTMLSelectElement;
                            if (!nameInput || !roleInput) return;
                            const name = nameInput.value.trim();
                            const role = roleInput.value;
                            if (!name) return toast.error("Please enter a name.");
                            
                            if (agentsList.map(a => a?.toLowerCase()).includes(name.toLowerCase())) {
                               return toast.error("User already exists!");
                            }
                            const updatedList = [...agentsList, name];
                            setAgentsList(updatedList);
                            setStorageItem('sched_agents_list', updatedList);
                            
                            const newMeta = { ...getAgentMeta() };
                            newMeta[name] = { roleType: role, tlName: 'Unassigned' };
                            setStorageItem('sched_agent_meta', newMeta);
                            
                            nameInput.value = '';
                            toast.success(`Added ${name} as ${role}.`);
                          }}
                          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 whitespace-nowrap transition-all"
                        >
                          Add User
                        </button>
                      </div>
                    </div>


                    {/* Admin Headcount Upload Control */}
                    {isMasterAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl flex flex-col gap-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                 <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                               </div>
                               <div>
                                 <h3 className="text-slate-700 font-bold text-sm">Upload CSV File</h3>
                                 <p className="text-xs text-indigo-300/70">Upload the raw exported CSV</p>
                               </div>
                             </div>
                             <label className="w-full text-center px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-indigo-500/20 transition-all block">
                                Upload CSV File
                                <input
                                  type="file"
                                  accept=".csv,.xlsx,.json,.xls"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    handleDirectoryFile(file);
                                  }}
                                />
                             </label>
                          </div>
                          
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col gap-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                 <svg className="w-5 h-5 bg-slate-50 dark:bg-slate-800 rounded-full p-0.5" viewBox="0 0 48 48">
                                   <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                   <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                   <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                   <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                 </svg>
                               </div>
                               <div>
                                 <h3 className="text-slate-700 font-bold text-sm">Import via Google Sheets Link</h3>
                                 <p className="text-xs text-emerald-300/70">Requires permission to read the Sheet</p>
                               </div>
                             </div>
                             <input
                               type="text"
                               placeholder="Paste Google Sheets Link..."
                               value={googleSheetId}
                               onChange={(e) => {
                                  let val = e.target.value;
                                  const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
                                  if (match) val = match[1];
                                  setGoogleSheetId(val);
                                  setStorageItem('sched_google_sheet_id', val);
                               }}
                               className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 text-slate-700 placeholder-slate-500 text-xs rounded-lg px-3 py-2.5 w-full focus:outline-none focus:border-emerald-500"
                             />
                             <button
                               onClick={async () => {
                                 if (!googleSheetId) return toast.error("Please provide a Google Sheets Link.");
                                 
                                 setIsSyncingSheets(true);
                                 try {
                                   const csvText = await fetchGoogleSheetCSV(googleSheetId, googleSheetGid);
                                   
                                   if (!csvText || csvText.trim().length === 0) {
                                      throw new Error("No data found in the sheet.");
                                   }
                                   
                                   const result = parseAgentDirectoryCSV(csvText);
                                   if (result.errors.length > 0) {
                                      toast.error(`Warnings: ${result.errors.slice(0, 3).join(', ')}`);
                                   }
                                   if (result.directory.length > 0) {
                                      setAgentDirectory(result.directory);
                                      setDirectoryHeaders(result.headers);
                                      setStorageItem('sched_agent_directory', result.directory);
                                      setStorageItem('sched_agent_directory_headers', result.headers);
                                      
                                      // Make sure any newly found agents are implicitly registered for future login!
                                      const allKnown = new Set(agentsList);
                                      result.directory.forEach(a => allKnown.add(a.agentName));
                                      const updatedList = Array.from(allKnown);
                                      setAgentsList(updatedList);
                                      setStorageItem('sched_agents_list', updatedList);
  
                                      // Check for TL and Role columns
                                      const newMeta = { ...getAgentMeta() };
                                      let hasMetaUpdate = false;
                                      const tlHeader = result.headers.find(h => {
                                          const lh = h.toLowerCase().trim();
                                          return lh === 'tl' || lh === 'team leader' || lh.includes('manager');
                                      });
                                      const roleHeader = result.headers.find(h => {
                                          const lh = h.toLowerCase().trim();
                                          return lh === 'role' || lh === 'lob' || lh.includes('account');
                                      });
                                      
                                      if (tlHeader || roleHeader) {
                                          result.directory.forEach(a => {
                                              let updated = false;
                                              if (!newMeta[a.agentName]) newMeta[a.agentName] = { roleType: '', tlName: '' };
                                              
                                              if (tlHeader && a.data[tlHeader]) {
                                                  const val = a.data[tlHeader].trim();
                                                  if (val) {
                                                      newMeta[a.agentName].tlName = val;
                                                      updated = true;
                                                  }
                                              }
                                              if (roleHeader && a.data[roleHeader]) {
                                                  const val = a.data[roleHeader].trim();
                                                  if (val) {
                                                      newMeta[a.agentName].roleType = val;
                                                      updated = true;
                                                  }
                                              }
                                              if (updated) hasMetaUpdate = true;
                                          });
                                          if (hasMetaUpdate) {
                                              setStorageItem('sched_agent_meta', newMeta);
                                          }
                                      }
  
                                      toast.success(`Successfully extracted ${result.directory.length} agents from Google Sheet!`);
                                   } else {
                                      toast.error('No agent data could be extracted.');
                                   }
                                 } catch (err: any) {
                                   toast.error("Extraction failed: " + err.message);
                                 } finally {
                                   setIsSyncingSheets(false);
                                 }
                               }}
                               disabled={isSyncingSheets}
                               className={`w-full py-2.5 text-center ${isSyncingSheets ? 'bg-emerald-500/50' : 'bg-emerald-500 hover:bg-emerald-600'} text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg transition-all`}
                             >
                               {isSyncingSheets ? 'Extracting Data...' : 'Extract From Sheet'}
                             </button>
                          </div>
                        </div>
                    )}


                    {/* Add Agent Manually */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                      <h3 className="font-bold text-slate-700 text-base mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-emerald-400" />
                        Add User Manually
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full">
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Full Name</label>
                          <input 
                            type="text" 
                            id="manual-agent-name"
                            placeholder="e.g. John Doe"
                            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-lg text-sm text-slate-700 px-3 py-2 focus:outline-none focus:border-emerald-500 w-full"
                          />
                        </div>
                        <div className="w-full sm:w-48">
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Role</label>
                          <select 
                            id="manual-agent-role"
                            className="text-slate-700 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-lg   px-3 py-2 focus:outline-none focus:border-emerald-500 w-full"
                          >
                            <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="Call Center">Call Center</option>
                            <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="Social Media">Social Media</option>
                            <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="TL">Team Leader (TL)</option>
                            <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 "  value="Director">Director</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => {
                            const nameInput = document.getElementById('manual-agent-name') as HTMLInputElement;
                            const roleInput = document.getElementById('manual-agent-role') as HTMLSelectElement;
                            if (!nameInput || !roleInput) return;
                            const name = nameInput.value.trim();
                            const role = roleInput.value;
                            if (!name) return toast.error("Please enter a name.");
                            
                            if (agentsList.map(a => a?.toLowerCase()).includes(name.toLowerCase())) {
                               return toast.error("User already exists!");
                            }
                            const updatedList = [...agentsList, name];
                            setAgentsList(updatedList);
                            setStorageItem('sched_agents_list', updatedList);
                            
                            const newMeta = { ...getAgentMeta() };
                            newMeta[name] = { roleType: role, tlName: 'Unassigned' };
                            setStorageItem('sched_agent_meta', newMeta);
                            
                            nameInput.value = '';
                            toast.success(`Added ${name} as ${role}.`);
                          }}
                          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 whitespace-nowrap transition-all"
                        >
                          Add User
                        </button>
                      </div>
                    </div>

                  {/* Admin Upload Console */}
                  {isMasterAdmin && (
                    <div className="bg-white dark:bg-slate-900/50 border text-slate-700 border-slate-200 dark:border-slate-700/10 rounded-3xl shadow-sm p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-700/5 gap-3">
                        <div>
                          <h3 className="font-bold text-slate-700 text-base font-display flex items-center gap-2">
                            <Upload className="w-5 h-5 text-indigo-400" />
                            Upload Schedule Roster File
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Import CSV documents containing weekly or monthly coverage calendars</p>
                        </div>
                        <button
                          onClick={downloadScheduleTemplate}
                          className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download CSV Template
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{/* Drag & Drop Board */}
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative flex flex-col items-center justify-center gap-3 ${
                          dragActive 
                            ? 'border-indigo-400 bg-indigo-500/10' 
                            : 'border-slate-200 dark:border-slate-700/10 bg-black/30 hover:border-slate-200 dark:border-slate-700/20'
                        }`}
                      >
                        <input
                          id="csv-file-selector"
                          type="file"
                          accept=".xlsx,.xls,.csv,.txt,.json"
                          onChange={handleScheduleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-center justify-center">
                          <Upload className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Drag and drop your schedule roster file here</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports Excel (.xlsx, .xls), CSV, JSON, and text plans</p>
                        </div>
                        <span className="px-3 py-1 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-mono">
                          Supports any sheet layout containing Agent Name, Date & Shift columns!
                        </span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center transition-all min-h-[220px]">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center shadow-inner">
                          <svg className="w-6 h-6 bg-slate-50 dark:bg-slate-800 rounded-full p-0.5" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Import via Google Sheets Link</p>
                          <p className="text-xs text-emerald-300 mt-1">Extract schedules directly from a linked Google Sheet</p>
                        </div>
                        <div className="w-full mt-2 space-y-2">
                           <input
                             type="text"
                             placeholder="Paste Google Sheets Link..."
                             value={googleSheetId}
                             onChange={(e) => {
                                let val = e.target.value;
                                const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
                                if (match) val = match[1];
                                setGoogleSheetId(val);
                                setStorageItem('sched_google_sheet_id', val);
                             }}
                             className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 text-slate-700 placeholder-emerald-500/50 text-xs rounded-lg px-3 py-2.5 w-full focus:outline-none focus:border-emerald-500 text-center"
                           />
                           <button
                             onClick={async () => {
                               if (!googleSheetId) {
                                  toast.error("Please provide a valid Google Sheet ID or URL.");
                                  return;
                               }
                               try {
                                 setIsSyncingSheets(true);
                                 setUploadError(null);
                                 setUploadSuccess(null);
                                 
                                 const csvText = await fetchGoogleSheetCSV(googleSheetId, googleSheetGid);
                                 
                                 if (!csvText || csvText.trim().length === 0) {
                                    throw new Error("No data found in the sheet.");
                                 }
                                 
                                 const result = parseScheduleCSV(csvText, agentsList);
                                 if (result.errors.length > 0) {
                                    setUploadError(result.errors.join('\n'));
                                 }
                                 if (result.schedules.length > 0) {
                                    const newAgentsList: string[] = [];
                                    const oldAgentsSet = new Set(agentsList.map(a => a?.toLowerCase()));
                                    result.schedules.forEach(s => {
                                       if (!oldAgentsSet.has(s.agentName?.toLowerCase()) && !newAgentsList.some(n => n?.toLowerCase() === s.agentName?.toLowerCase())) {
                                          newAgentsList.push(s.agentName);
                                       }
                                    });
                                    setTempNewAgents(newAgentsList);
                                    setTempSchedules(result.schedules);
                                    setUploadSuccess(`Successfully extracted ${result.schedules.length} shifts spanning ${new Set(result.schedules.map(r => r.date)).size} days.`);
                                 } else {
                                    setUploadError((prev) => (prev ? prev + "\n    </>\n" : "") + "No schedule data parsed from sheet.");
                                 }
                               } catch (err: any) {
                                 setUploadError("Extraction failed: " + err.message);
                               } finally {
                                 setIsSyncingSheets(false);
                               }
                             }}
                             disabled={isSyncingSheets}
                             className={`w-full py-2 text-center ${isSyncingSheets ? 'bg-emerald-500/50' : 'bg-emerald-500 hover:bg-emerald-600'} text-slate-700 rounded-lg font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg transition-all`}
                           >
                             {isSyncingSheets ? 'Extracting...' : 'Extract From Sheet'}
                           </button>
                        </div>
                      </div>
</div>

                      {/* Feedback Panel */}
                      {uploadError && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/15 rounded-2xl flex items-start gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-rose-300">Roster file parsing warnings/errors:</p>
                            <pre className="text-[10px] font-mono text-rose-200 mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto leading-normal">
                              {uploadError}
                            </pre>
                          </div>
                        </div>
                      )}

                      {uploadSuccess && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl space-y-3">
                          <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-emerald-300">Successfully interpreted schedule roster contents!</p>
                              <p className="text-[11px] text-emerald-100 mt-1">{uploadSuccess}</p>
                            </div>
                          </div>

                          {tempNewAgents.length > 0 && (
                            <div className="p-3 bg-black/20 rounded-xl space-y-1">
                              <p className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                                <UserPlus className="w-3.5 h-3.5" /> Newly Registered Agents Detected ({tempNewAgents.length}):
                              </p>
                              <p className="text-[11px] text-indigo-200 leading-relaxed font-mono">
                                {tempNewAgents.join(', ')}
                              </p>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400">These agents will be auto-registered and can sign in instantly once you commit.</p>
                            </div>
                          )}

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => {
                                setUploadSuccess(null);
                                setTempSchedules([]);
                                setTempNewAgents([]);
                              }}
                              className="px-4 py-2 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/10 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Discard Upload
                            </button>
                            <button
                              onClick={commitSchedules}
                              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 font-display"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Save & Set Active Schedule
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}



                  {/* Kill Switch (Hesham Only) */}
                  {currentUser?.name === 'Hesham Sobhy' && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex flex-col gap-4 mt-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                          <h3 className="text-slate-700 font-bold text-sm">System Kill Switch</h3>
                          <p className="text-xs text-rose-300">Danger zone: Shut down the entire application</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <input 
                            type={showKillSwitchPassword ? "text" : "password"} 
                            placeholder="Enter your password to confirm"
                            value={killSwitchPassword} 
                            onChange={e => setKillSwitchPassword(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 bg-black/40 border border-rose-500/30 text-rose-100 rounded-xl text-xs outline-none focus:border-rose-500" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowKillSwitchPassword(!showKillSwitchPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-300 transition-colors"
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
                          className="w-full px-3 py-2 bg-black/40 border border-rose-500/30 text-rose-100 rounded-xl text-xs outline-none focus:border-rose-500" 
                        />
                        <button 
                          onClick={() => {
                            if (killSwitchPassword === credentials['Hesham Sobhy'] && killSwitchCar === 'BMW') {
                              setDoc(doc(db, "system", "app_status"), { isKilled: true, killedAt: new Date().toISOString() }, {merge: true});
                              setIsAppKilled(true);
                              setKillSwitchPassword('');
                              setKillSwitchCar('');
                              toast.success("Application has been shut down.");
                            } else {
                               toast.error("Incorrect password or security answer.");
                            }
                          }}
                          className="w-full text-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-rose-500/20 transition-all">
                          EXECUTE SHUTDOWN
                        </button>
                      </div>
                    </div>
                  )}

                    <div className="bg-white dark:bg-slate-900/50 border border-rose-500/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl overflow-x-auto">
                      {(() => {
                        // Create a unique set of names/usernames from both agents list and registered users list
                        const uniqueNamesSet = new Set<string>();

                        agentsList.forEach(a => {
                          if (a) uniqueNamesSet.add(capitalizeName(a.trim()));
                        });

                        registeredUsers.forEach(u => {
                          if (u && u.name) {
                            const resolvedName = findAgentByUsername(u.name, agentsList) || u.name;
                            uniqueNamesSet.add(capitalizeName(resolvedName.trim()));
                          }
                        });

                        const sortedUniqueList = Array.from(uniqueNamesSet).sort((a, b) => a.localeCompare(b));

                        return (
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-rose-500/10 border-b border-rose-500/20 text-[10px] font-black uppercase tracking-widest text-rose-300 font-sans">
                                <th className="px-5 py-3 rounded-tl-xl">Account / Username (Total: {sortedUniqueList.length})</th>
                                <th className="px-3 py-3">Account LOB Role</th>
                                <th className="px-3 py-3">Assigned TL</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-600 dark:text-slate-300 font-sans">
                              {sortedUniqueList.map(agent => {
                                const curRole = globalMeta[agent]?.roleType || getAgentLOB(agent);
                                const curTL = globalMeta[agent]?.tlName || getAgentTL(agent);
                                
                                const username = getUsernameFromFullName(agent) || agent.toLowerCase();
                                const isLocked = lockedAccounts.includes(username) || 
                                                 lockedAccounts.includes(username.toLowerCase()) ||
                                                 lockedAccounts.includes(agent) || 
                                                 lockedAccounts.includes(agent.toLowerCase());

                                return (
                                  <tr key={agent} className="hover:bg-rose-500/5 transition-all">
                                    <td className="px-5 py-4 font-bold text-slate-700 uppercase tracking-wide">
                                      <div className="flex flex-col gap-1.5 justify-start text-left">
                                        <div className="flex items-center gap-2">
                                          <span>{agent}</span>
                                          {isLocked && (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse">
                                              <Lock className="w-3 h-3 text-rose-400" />
                                              LOCKED
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wide lowercase">
                                            username: <strong className="text-cyan-400">{username}</strong>
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-4">
                                      <select
                                        value={curRole}
                                        onChange={(e) => {
                                          const newMeta = { ...getAgentMeta() };
                                          if (!newMeta[agent]) newMeta[agent] = { roleType: '', tlName: '' };
                                          newMeta[agent].roleType = e.target.value;
                                          setStorageItem('sched_agent_meta', newMeta);
                                          setAgentMeta(newMeta);
                                          setDoc(doc(db, "system", "sched_agent_meta"), { data: newMeta }).catch(console.error);
                                          toast.success(`Updated ${agent}'s role to ${e.target.value}`);
                                        }}
                                        className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg text-xs text-slate-700 px-3 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer w-full max-w-[150px]"
                                      >
                                        <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 " value="Call Center">Call Center</option>
                                        <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 " value="Social Media">Social Media</option>
                                        <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 " value="General">General</option>
                                        <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 " value="TL">Team Leader (TL)</option>
                                        <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 " value="Medical">Medical</option>
                                      </select>
                                    </td>
                                    <td className="px-3 py-4">
                                      <select
                                        value={curTL}
                                        onChange={(e) => {
                                          const newMeta = { ...getAgentMeta() };
                                          if (!newMeta[agent]) newMeta[agent] = { roleType: '', tlName: '' };
                                          newMeta[agent].tlName = e.target.value;
                                          setStorageItem('sched_agent_meta', newMeta);
                                          setAgentMeta(newMeta);
                                          setDoc(doc(db, "system", "sched_agent_meta"), { data: newMeta }).catch(console.error);
                                          toast.success(`Assigned ${agent} to TL: ${e.target.value}`);
                                        }}
                                        className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/10 rounded-lg text-xs text-slate-700 px-3 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer w-full max-w-[180px]"
                                      >
                                        {availableTLs.map(tl => <option className="bg-slate-50 dark:bg-slate-800 text-slate-700 " key={tl} value={tl}>{tl}</option>)}
                                      </select>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      {isMasterAdmin ? (
                                        <div className="flex items-center justify-end gap-2 text-right">
                                          {isLocked && (
                                            <button
                                              onClick={() => {
                                                if (confirm(`Unlock account for ${agent}?`)) {
                                                  const userKey1 = agent;
                                                  const userKey2 = agent.toLowerCase();
                                                  const userKey3 = username;
                                                  const userKey4 = username.toLowerCase();

                                                  const updatedLocked = lockedAccounts.filter(a => 
                                                    a !== userKey1 && a !== userKey2 && a !== userKey3 && a !== userKey4
                                                  );
                                                  setLockedAccounts(updatedLocked);
                                                  setStorageItem('sched_locked_accounts', updatedLocked);
                                                  setDoc(doc(db, "system", "sched_locked_accounts"), { data: updatedLocked }).catch(console.error);

                                                  const updatedAttempts = { ...failedAttempts };
                                                  delete updatedAttempts[userKey1];
                                                  delete updatedAttempts[userKey2];
                                                  delete updatedAttempts[userKey3];
                                                  delete updatedAttempts[userKey4];
                                                  setFailedAttempts(updatedAttempts);
                                                  setStorageItem('sched_failed_attempts', updatedAttempts);
                                                  setDoc(doc(db, "system", "sched_failed_attempts"), { data: updatedAttempts }).catch(console.error);

                                                  toast.success(`Account for ${agent} has been unlocked!`);
                                                }
                                              }}
                                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                            >
                                              Unlock
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              if (confirm(`Are you sure you want to reset password for ${agent}?`)) {
                                                const userKey1 = agent;
                                                const userKey2 = agent.toLowerCase();
                                                const userKey3 = username;
                                                const userKey4 = username.toLowerCase();

                                                const creds = { ...credentials };
                                                delete creds[userKey1];
                                                delete creds[userKey2];
                                                delete creds[userKey3];
                                                delete creds[userKey4];
                                                setStorageItem('sched_credentials', creds);
                                                setCredentials(creds);
                                                setDoc(doc(db, "system", "sched_credentials"), { data: creds }).catch(console.error);

                                                // Also unlock just in case
                                                const updatedLocked = lockedAccounts.filter(a => 
                                                  a !== userKey1 && a !== userKey2 && a !== userKey3 && a !== userKey4
                                                );
                                                setLockedAccounts(updatedLocked);
                                                setStorageItem('sched_locked_accounts', updatedLocked);
                                                setDoc(doc(db, "system", "sched_locked_accounts"), { data: updatedLocked }).catch(console.error);

                                                const updatedAttempts = { ...failedAttempts };
                                                delete updatedAttempts[userKey1];
                                                delete updatedAttempts[userKey2];
                                                delete updatedAttempts[userKey3];
                                                delete updatedAttempts[userKey4];
                                                setFailedAttempts(updatedAttempts);
                                                setStorageItem('sched_failed_attempts', updatedAttempts);
                                                setDoc(doc(db, "system", "sched_failed_attempts"), { data: updatedAttempts }).catch(console.error);

                                                toast.success(`Password for ${agent} has been wiped and account unlocked!`);
                                              }
                                            }}
                                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded border-rose-500/30 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                          >
                                            Reset Pass
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-white0 font-bold uppercase tracking-widest select-none">
                                          🔒 Restricted
                                        </span>
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
                  </div>
                );
              })()}

            {/* Overtime Popup Alerts / Floating warnings */}
            {currentUser && currentUser.role === 'agent' && (() => {
              const elapsed = getActiveActivityElapsed(currentUser.name);
              if (!elapsed || !elapsed.exceeded) return null;

              const stats = getAgentTodayStats(currentUser.name);

              if (isOvertimeAlertMinimized) {
                // Compact Floating Badge at Bottom-Right
                return (
                  <div className="fixed bottom-6 right-6 z-50 animate-bounce cursor-pointer scale-100 hover:scale-[1.03] active:scale-[0.98] transition-all" onClick={() => setIsOvertimeAlertMinimized(false)}>
                    <div className="bg-rose-600 hover:bg-rose-700 text-slate-700 font-bold p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400/40 select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-50 dark:bg-slate-800 animate-ping"></span>
                      <span className="text-xs font-mono">
                        🚨 OVERTIME: {elapsed.type.toUpperCase()} +{elapsed.exceededBy.toFixed(1)}m
                      </span>
                      <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-lg">Expand &rarr;</span>
                    </div>
                  </div>
                );
              }

              // Full Interactive Modal Overlay
              return (
                <div className="fixed inset-0 bg-transparent/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900/40 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden space-y-6 text-center animate-fade-in">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 animate-pulse"></div>
                    
                    {/* Pulsing warning circle icon */}
                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Coffee className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-700 font-display tracking-wide uppercase">
                        ⚠️ Overtime Limit Notice!
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-sans px-2 leading-relaxed">
                        You have exceeded your allocated <span className="font-bold underline text-slate-700 capitalize">{elapsed.type}</span> limit of <span className="text-rose-300 font-bold font-mono">{elapsed.limit}</span> minutes.
                      </p>
                    </div>

                    {/* Overtime breakdown banner */}
                    <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl space-y-1 text-center">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider font-mono">Elapsed Session Time</p>
                      <p className="text-3xl font-black text-rose-400 font-mono">
                        {elapsed.duration.toFixed(2)}m
                      </p>
                      <p className="text-[11px] font-bold text-slate-700 font-sans animate-pulse">
                        Exceeding limit by: <span className="font-mono text-xs underline">+{elapsed.exceededBy.toFixed(1)} minutes</span>
                      </p>
                    </div>

                    {/* Show cumulative aggregates */}
                    <div className="p-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 rounded-2xl text-left space-y-2.5">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 font-display border-b border-slate-200 dark:border-slate-700/5 pb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded bg-indigo-400 animate-pulse"></span>
                        Your Timecard Totals (Today):
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl">
                          <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Break</p>
                          <p className={`font-bold font-mono ${stats.breakMins > 15 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                            {stats.breakMins.toFixed(1)}m
                          </p>
                          <p className="text-[8px] text-white0">Max 15m</p>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl">
                          <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Lunch</p>
                          <p className={`font-bold font-mono ${stats.lunchMins > 30 ? 'text-rose-400 animate-pulse' : 'text-pink-300'}`}>
                            {stats.lunchMins.toFixed(1)}m
                          </p>
                          <p className="text-[8px] text-white0">Max 30m</p>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl">
                          <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Restroom</p>
                          <p className="text-indigo-400 font-bold font-mono">
                            {stats.restroomMins.toFixed(1)}m
                          </p>
                          <p className="text-[8px] text-white0">{stats.restroomCount} sessions</p>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl">
                          <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Meeting</p>
                          <p className={`font-bold font-mono ${stats.meetingMins > 60 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                            {stats.meetingMins.toFixed(1)}m
                          </p>
                          <p className="text-[8px] text-white0">Max 60m</p>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl">
                          <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">1:1 Session</p>
                          <p className={`font-bold font-mono ${stats.oneOnOneMins > 30 ? 'text-rose-400 animate-pulse' : 'text-violet-300'}`}>
                            {stats.oneOnOneMins.toFixed(1)}m
                          </p>
                          <p className="text-[8px] text-white0">Max 30m</p>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 rounded-xl">
                          <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Pers. Break</p>
                          <p className={`font-bold font-mono ${stats.personalMins > 15 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
                            {stats.personalMins.toFixed(1)}m
                          </p>
                          <p className="text-[8px] text-white0">Max 15m</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => handleEndActivity()}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-700 font-black text-xs tracking-wider rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 uppercase font-sans border border-emerald-400/20 active:scale-[0.99] transition-all"
                      >
                        <ArrowRight className="w-4 h-4 text-slate-700" />
                        End Activity & Continue Shift
                      </button>
                      <button
                        onClick={() => setIsOvertimeAlertMinimized(true)}
                        className="w-full py-2.5 bg-white dark:bg-slate-900/40 backdrop-blur-lg hover:bg-slate-700 backdrop-blur-xl border border-slate-200 dark:border-slate-700/20 text-slate-600 dark:text-slate-300 hover:text-slate-700 rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.99] transition-all"
                      >
                        Minimize Alert Temporarily
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            </motion.div>
          </AnimatePresence>
        </main>

      {/* Dynamic Sliding Notification Drawer */}
      <AnimatePresence>
        {isNotifDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotifDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-transparent border-l border-slate-200 dark:border-slate-700/10 shadow-2xl flex flex-col p-6 overflow-y-auto z-10 text-left cursor-default"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700/10">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-700 font-display">Real-time Sync Inbox</h2>
                </div>
                <button
                  onClick={() => setIsNotifDrawerOpen(false)}
                  className="p-1 px-3 text-xs bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 py-4 space-y-3 overflow-y-auto pr-1">
                {visibleNotifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-white0">
                    <Bell className="w-12 h-12 stroke-1 mb-3 opacity-30" />
                    <p className="text-xs">No notifications on file.</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Real-time status announcements and TL feedback logs will populate here.</p>
                  </div>
                ) : (
                  visibleNotifs.map(notif => {
                    const isUnread = !notif.seenByUsers || !notif.seenByUsers.includes(currentUser?.name || '');
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkSingleNotifAsRead(notif.id)}
                        className={`p-4 rounded-xl border transition-all text-left relative cursor-pointer group ${
                          isUnread
                            ? 'bg-indigo-500/10 border-indigo-500/30'
                            : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/5 hover:border-slate-200 dark:border-slate-700/10'
                        }`}
                      >
                        {isUnread && (
                          <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        )}
                        <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-300 font-mono mb-1">
                          {notif.type}
                        </p>
                        <p className="text-xs font-bold text-slate-700 mb-1">{notif.title}</p>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed mb-2">{notif.message}</p>
                        <p className="text-[9px] text-white0">{new Date(notif.createdAt).toLocaleTimeString()} - {new Date(notif.createdAt).toLocaleDateString()}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {visibleNotifs.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/10 flex flex-col gap-2">
                  <button
                    onClick={handleMarkAllNotifsAsRead}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10"
                  >
                    Mark All as Read
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Clear notifications?")) {
                        if (!currentUser) return;
                        
                        visibleNotifs.forEach(n => {
                          const clearedSet = new Set(n.clearedByUsers || []);
                          clearedSet.add(currentUser.name);
                          
                          const updatedNotif = { ...n, clearedByUsers: Array.from(clearedSet) };
                          updateDoc(doc(db, "notifications", n.id), { clearedByUsers: updatedNotif.clearedByUsers })
                            .catch(e => console.error("Error clearing notification:", e));
                            
                          // Update local state early for responsiveness
                          setNotifications(prev => prev.map(pn => pn.id === n.id ? updatedNotif : pn));
                        });
                        
                        toast.success("Inbox cleared.");
                      }
                    }}
                    className="w-full py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Clear My Inbox
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
          </div>
// removed
      {selectedShiftForActivities && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] p-4 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700/5 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  Intraday Activity Planner
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">Agent: {selectedShiftForActivities.agentName} | Date: {selectedShiftForActivities.date}</p>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Base Shift: {selectedShiftForActivities.shiftLabel}</p>
              </div>
              <button 
                onClick={() => setSelectedShiftForActivities(null)}
                className="text-white0 hover:text-slate-600 dark:text-slate-300 px-2 py-1 bg-white dark:bg-slate-900/50 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {(!selectedShiftForActivities.activities || selectedShiftForActivities.activities.length === 0) ? (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700/10 rounded-xl bg-black/20">
                  <p className="text-xs text-white0">No intraday activities configured.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...selectedShiftForActivities.activities].sort((a,b) => a.startTime.localeCompare(b.startTime)).map((act, idx) => (
                    <div key={act.id} className="flex items-center gap-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 p-3 rounded-xl">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <select 
                          value={act.label}
                          onChange={(e) => {
                            const newActs = [...(selectedShiftForActivities.activities || [])];
                            newActs[idx].label = e.target.value;
                            setSelectedShiftForActivities({...selectedShiftForActivities, activities: newActs});
                          }}
                          className="bg-black/50 border border-slate-200 dark:border-slate-700/10 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-200"
                        >
                          <option value="Work">Work</option>
                          <option value="Break">Break</option>
                          <option value="Lunch">Lunch</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Coaching">Coaching</option>
                          <option value="Training">Training</option>
                          <option value="Project">Project</option>
                        </select>
                        <input 
                          type="time" 
                          value={act.startTime}
                          onChange={(e) => {
                            const newActs = [...(selectedShiftForActivities.activities || [])];
                            newActs[idx].startTime = e.target.value;
                            setSelectedShiftForActivities({...selectedShiftForActivities, activities: newActs});
                          }}
                          className="bg-black/50 border border-slate-200 dark:border-slate-700/10 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-200" 
                        />
                        <input 
                          type="time" 
                          value={act.endTime}
                          onChange={(e) => {
                            const newActs = [...(selectedShiftForActivities.activities || [])];
                            newActs[idx].endTime = e.target.value;
                            setSelectedShiftForActivities({...selectedShiftForActivities, activities: newActs});
                          }}
                          className="bg-black/50 border border-slate-200 dark:border-slate-700/10 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-200" 
                        />
                      </div>
                      <button 
                        onClick={() => {
                           const newActs = selectedShiftForActivities.activities!.filter(a => a.id !== act.id);
                           setSelectedShiftForActivities({...selectedShiftForActivities, activities: newActs});
                        }}
                        className="text-rose-400 hover:text-rose-300 bg-rose-500/10 p-1.5 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  const newActs = [...(selectedShiftForActivities.activities || [])];
                  newActs.push({
                    id: `act_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
                    label: 'Break',
                    startTime: '12:00',
                    endTime: '12:30'
                  });
                  setSelectedShiftForActivities({...selectedShiftForActivities, activities: newActs});
                }}
                className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 border-dashed rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Add Activity Interval
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/5">
              <button 
                onClick={() => setSelectedShiftForActivities(null)}
                className="px-4 py-2 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const mergedSchedules = [...schedules];
                  const existingIdx = mergedSchedules.findIndex(s => s.id === selectedShiftForActivities.id);
                  if (existingIdx !== -1) {
                    mergedSchedules[existingIdx] = selectedShiftForActivities;
                  } else {
                    mergedSchedules.push(selectedShiftForActivities);
                  }
                  setSchedules(mergedSchedules);
                  setStorageItem('sched_schedules', mergedSchedules);
                  setDoc(doc(db, "schedules", selectedShiftForActivities.id), selectedShiftForActivities).catch(e => console.error("Write Error:", e));
                  
                  setSelectedShiftForActivities(null);
                  toast.success("Intraday Schedule Updated Successfully!");
                }}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg text-xs font-black shadow-lg shadow-emerald-500/20"
              >
                Save Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99999] p-4 flex items-center justify-center overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5 max-w-lg w-full max-h-[90vh] overflow-y-auto text-left relative">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700/5 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-emerald-400" />
                  Edit {editingItem.type === 'inquiry' ? 'Inquiry' : 
                        editingItem.type === 'scheduling_request' ? 'Scheduling Request' :
                        editingItem.type === 'tt_request' ? 'Fintech Installment Request' :
                        editingItem.type === 'tt_complaint' ? 'Fintech Dispute / Complaint' :
                        editingItem.type === 'client_comm' ? 'Client Comm Request' :
                        editingItem.type === 'case' ? 'Case Record' : 'Item'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                  Time Remaining: <span className="text-emerald-400 font-bold">{getRemainingEditTimeStr(editingItem.data.createdAt)}</span>
                </p>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-white0 hover:text-slate-600 dark:text-slate-300 px-2.5 py-1 bg-white dark:bg-slate-900/50 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              {editingItem.type === 'inquiry' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Patient Name</label>
                    <input 
                      type="text" 
                      value={editingItem.data.patientName || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, patientName: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Phone Number</label>
                    <input 
                      type="text" 
                      value={editingItem.data.phoneNumber || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, phoneNumber: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Inquiry Description</label>
                    <textarea 
                      value={editingItem.data.inquiry || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, inquiry: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 min-h-[100px]"
                      required
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'scheduling_request' && (
                <>
                  {editingItem.data.type === 'swap' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Date</label>
                        <input 
                          type="date" 
                          value={editingItem.data.date || ''} 
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, date: e.target.value }
                          })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Shift</label>
                        <input 
                          type="text" 
                          value={editingItem.data.shift || ''} 
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, shift: e.target.value }
                          })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Swap With Agent</label>
                        <input 
                          type="text" 
                          value={editingItem.data.swapWithAgent || ''} 
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, swapWithAgent: e.target.value }
                          })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Swap With Shift</label>
                        <input 
                          type="text" 
                          value={editingItem.data.swapWithShift || ''} 
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, swapWithShift: e.target.value }
                          })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Start Date</label>
                        <input 
                          type="date" 
                          value={editingItem.data.startDate || ''} 
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, startDate: e.target.value }
                          })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">End Date</label>
                        <input 
                          type="date" 
                          value={editingItem.data.endDate || ''} 
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, endDate: e.target.value }
                          })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Notes / Details</label>
                    <textarea 
                      value={editingItem.data.notes || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, notes: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 min-h-[80px]"
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'tt_request' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Provider</label>
                      <select 
                        value={editingItem.data.platform || 'tabby'} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, platform: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3- py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="tabby">Tabby</option>
                        <option value="tamara">Tamara</option>
                        <option value="one_time_payment">One-Time Payment</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Clinic Name</label>
                      <input 
                        type="text" 
                        value={editingItem.data.clinicName || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, clinicName: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Patient Name</label>
                      <input 
                        type="text" 
                        value={editingItem.data.patientName || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, patientName: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">File Number</label>
                      <input 
                        type="text" 
                        value={editingItem.data.fileNumber || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, fileNumber: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Phone Number</label>
                      <input 
                        type="text" 
                        value={editingItem.data.phoneNumber || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, phoneNumber: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">ID Number</label>
                      <input 
                        type="text" 
                        value={editingItem.data.idNumber || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, idNumber: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Price (Without Tax)</label>
                    <input 
                      type="text" 
                      value={editingItem.data.priceWithoutTax || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, priceWithoutTax: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Notes / Details</label>
                    <textarea 
                      value={editingItem.data.notes || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, notes: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 min-h-[60px]"
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'tt_complaint' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Patient Name</label>
                      <input 
                        type="text" 
                        value={editingItem.data.patientName || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, patientName: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">File Number</label>
                      <input 
                        type="text" 
                        value={editingItem.data.fileNumber || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, fileNumber: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Phone Number</label>
                      <input 
                        type="text" 
                        value={editingItem.data.phoneNumber || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, phoneNumber: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Clinic Name</label>
                      <input 
                        type="text" 
                        value={editingItem.data.clinicName || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, clinicName: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Complaint Details</label>
                    <textarea 
                      value={editingItem.data.complaintDetails || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, complaintDetails: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 min-h-[100px]"
                      required
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'client_comm' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Phone Number</label>
                      <input 
                        type="text" 
                        value={editingItem.data.phoneNumber || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, phoneNumber: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Language</label>
                      <select 
                        value={editingItem.data.language || 'Arabic'} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, language: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Arabic">Arabic Only</option>
                        <option value="English">English / Bilingual</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Clinic Name</label>
                    <input 
                      type="text" 
                      value={editingItem.data.clinicName || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, clinicName: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Notes / Details</label>
                    <textarea 
                      value={editingItem.data.notes || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, notes: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 min-h-[100px]"
                      required
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'case' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Patient Name</label>
                      <input 
                        type="text" 
                        value={editingItem.data.patientName || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, patientName: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Phone Number</label>
                      <input 
                        type="text" 
                        value={editingItem.data.phoneNumber || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, phoneNumber: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Lead Source</label>
                      <input 
                        type="text" 
                        value={editingItem.data.leadSource || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, leadSource: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Branch Location</label>
                      <input 
                        type="text" 
                        value={editingItem.data.branch || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, branch: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Service Request</label>
                      <input 
                        type="text" 
                        value={editingItem.data.service || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, service: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Call Type</label>
                      <input 
                        type="text" 
                        value={editingItem.data.callType || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, callType: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Ticket Type</label>
                      <input 
                        type="text" 
                        value={editingItem.data.ticketType || ''} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, ticketType: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Ticket Status</label>
                      <select 
                        value={editingItem.data.ticketStatus || 'Open'} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, ticketStatus: e.target.value }
                        })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Patient Type</label>
                    <select 
                      value={editingItem.data.patientType || 'New'} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, patientType: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="New">New Patient</option>
                      <option value="Old">Old Patient</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Inquiry details</label>
                    <textarea 
                      value={editingItem.data.inquiry || ''} 
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, inquiry: e.target.value }
                      })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/10 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 min-h-[80px]"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/5 font-sans">
                <button 
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl text-[11px] font-black tracking-wide shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Save Edited Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-700/10 bg-black/40 backdrop-blur-md p-4 text-center text-xs text-white0 flex flex-col sm:flex-row justify-between items-center gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <span>📅 standalone local database</span>
          <span>🔒 custom client encryption active</span>
          <span className="flex items-center gap-2">
            🚀 version {CURRENT_APP_VERSION}.0
            <button 
              onClick={() => {
                toast.loading("Refetching system build...");
                if ('caches' in window) {
                   caches.keys().then((names) => {
                       for (let name of names) caches.delete(name);
                   });
                }
                setTimeout(() => window.location.reload(), 1000);
              }}
              className="ml-2 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[8px] font-black uppercase tracking-tighter transition-all active:scale-95 cursor-pointer"
            >
              Update App
            </button>
          </span>
        </div>
      </footer>
    </>
  );
}