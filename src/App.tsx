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
  Announcement
} from './types';

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

  throw lastError || new Error("Failed to fetch Google Sheet. Please verify the spreadsheet ID or make sure 'Anyone with the link can view' is enabled.");
}

const getClinicBadgeColor = (clinic: string) => {
  if (!clinic) return 'bg-white/5 text-slate-300 border-white/10';
  const lp = clinic.toLowerCase();
  if (lp.includes('dermadent')) return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  if (lp.includes('onetouch1')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (lp.includes('onetouch2')) return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
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
      {/* Outer spinning gradient ring with custom dashes */}
      <circle 
        cx="50" 
        cy="50" 
        r="43" 
        stroke="url(#synq-grad-outer)" 
        strokeWidth="4" 
        strokeDasharray="16 8 36 8" 
        strokeLinecap="round"
        className="animate-[spin_25s_linear_infinite]" 
      />
      {/* Dynamic interlocking network paths forming S & Q */}
      <path 
        d="M32 36C32 28.2 38.2 22 46 22H54C61.8 22 68 28.2 68 36V44C68 51.8 61.8 58 54 58H32V78" 
        stroke="url(#synq-grad-inner1)" 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M68 64C68 71.8 61.8 78 54 78H46C38.2 78 32 71.8 32 64V56C32 48.2 38.2 42 46 42H68" 
        stroke="url(#synq-grad-inner2)" 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="mix-blend-screen"
      />
      {/* Glowing pulsing center node */}
      <circle 
        cx="50" 
        cy="50" 
        r="5" 
        fill="url(#synq-grad-core)" 
        className="animate-pulse"
      />
      <defs>
        <linearGradient id="synq-grad-outer" x1="6" y1="6" x2="94" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <linearGradient id="synq-grad-inner1" x1="32" y1="22" x2="68" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="synq-grad-inner2" x1="68" y1="42" x2="32" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="synq-grad-core" x1="45" y1="45" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>
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

export default function App() {
  // Current local time context of the user's PC (synced and showing in the main page)
  const [systemTime, setSystemTime] = useState<Date>(new Date());
  const [isAppKilled, setIsAppKilled] = useState<boolean>(false);

  // Live clock state for real-time timers (updates once a second)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
