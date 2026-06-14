import { SchedulingRequest, SHIFTS, TEAM_LEADERS, INITIAL_AGENTS, SwapRequest, AnnualRequest, ScheduledShift, AGENT_LOBS, Inquiry, TimeLog, AgentDirectoryRow, TabbyTamaraRequest, TabbyTamaraComplaint, ClientCommunicationRequest, CaseRecord, SystemNotification, Order, FileAttachment, TTWorkflowStatus } from './types';

// Simple client-side storage helpers
import { db, auth, wrappedSetDoc as setDoc, wrappedDeleteDoc as deleteDoc } from './firebase';
import { doc } from 'firebase/firestore';
import { toast } from "sonner";

export const TABBY_TAMARA_FEE_RATE = 0.05;

export const calculateTabbyTamaraPrice = (
  rawPrice: string | number,
): {
  valid: boolean;
  priceBeforeFee: number;
  feeAmount: number;
  finalPrice: number;
  priceBeforeFeeFormatted: string;
  feeAmountFormatted: string;
  finalPriceFormatted: string;
} => {
  const normalized =
    typeof rawPrice === "string"
      ? rawPrice.replace(/,/g, "").trim()
      : String(rawPrice);
  const priceBeforeFee = Number(normalized);
  const valid = Number.isFinite(priceBeforeFee) && priceBeforeFee > 0;
  const safePrice = valid ? priceBeforeFee : 0;
  const feeAmount = Math.round(safePrice * TABBY_TAMARA_FEE_RATE * 100) / 100;
  const finalPrice = Math.round((safePrice + feeAmount) * 100) / 100;
  const format = (value: number) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return {
    valid,
    priceBeforeFee: safePrice,
    feeAmount,
    finalPrice,
    priceBeforeFeeFormatted: format(safePrice),
    feeAmountFormatted: format(feeAmount),
    finalPriceFormatted: format(finalPrice),
  };
};

export const normalizeUrl = (value: string | undefined | null): string | null => {
  if (!value) return null;
  let cleanValue = value.trim();
  if (cleanValue === '') return null;
  
  if (!/^https?:\/\//i.test(cleanValue)) {
    cleanValue = 'https://' + cleanValue;
  }
  
  try {
    new URL(cleanValue);
    return cleanValue;
  } catch (e) {
    return null;
  }
};

export const extractLinks = (linksData: any): string[] => {
  let result: string[] = [];
  if (Array.isArray(linksData)) {
    linksData.forEach(l => {
      if (typeof l === 'string') result.push(...l.split(/[\n,]+/));
    });
  } else if (typeof linksData === 'string') {
    result = linksData.split(/[\n,]+/);
  }
  return result.map(l => l.trim()).filter(Boolean);
};

export const copyToClipboard = async (value: string, successMessage: string = "Copied to clipboard", htmlValue?: string): Promise<boolean> => {
  if (!value) {
    toast.error("Nothing to copy");
    return false;
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      if (htmlValue && typeof ClipboardItem !== 'undefined') {
        try {
          const textBlob = new Blob([value], { type: "text/plain" });
          const htmlBlob = new Blob([htmlValue], { type: "text/html" });
          const item = new ClipboardItem({
             "text/plain": textBlob,
             "text/html": htmlBlob
          });
          await navigator.clipboard.write([item]);
          toast.success(successMessage);
          return true;
        } catch (itemErr) {
          console.warn("Rich text copy failed, falling back to plain text", itemErr);
          await navigator.clipboard.writeText(value);
          toast.success(successMessage);
          return true;
        }
      } else {
        await navigator.clipboard.writeText(value);
        toast.success(successMessage);
        return true;
      }
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      textArea.remove();
      
      if (successful) {
        toast.success(successMessage);
        return true;
      } else {
        toast.error("Failed to copy to clipboard.");
        return false;
      }
    }
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    toast.error("Failed to copy to clipboard.");
    return false;
  }
};

export const compressPastedImage = (base64Str: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64Str); return; }

      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const handleGlobalImagePaste = (e: React.ClipboardEvent, photos: string[], setPhotos: (photos: string[]) => void) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  const filesArray: File[] = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (file) filesArray.push(file);
    }
  }
  if (filesArray.length > 0) {
    Promise.all(filesArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const compressed = await compressPastedImage(event.target.result as string);
            resolve(compressed);
          } else {
            resolve('');
          }
        };
        reader.readAsDataURL(file);
      });
    })).then(newCompressedPhotos => {
      const filtered = newCompressedPhotos.filter(Boolean);
      if (filtered.length > 0) {
        setPhotos([...photos, ...filtered]);
      }
    });
  }
};

export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading key ${key} from storage`, e);
    return defaultValue;
  }
};

const getCollectionName = (key: string) => {
    switch(key) {
        case 'sched_inquiries': return 'inquiries';
        case 'sched_tabby_tamara': return 'tt_requests';
        case 'sched_tt_complaints': return 'tt_complaints';
        case 'sched_client_comms': return 'client_comms';
        case 'sched_requests': return 'scheduling_requests';
        case 'sched_time_logs': return 'timelogs';
        case 'sched_schedules': return 'schedules';
        case 'sched_cases': return 'cases';
        case 'sched_notifications': return 'notifications';
        case 'sched_tl_feedbacks': return 'tl_feedbacks';
        default: return null;
    }
};

const stripLargeFields = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Strip inline image base64 strings
    if (obj.startsWith('data:') && obj.includes(';base64,')) {
      return '[omitted_base64]';
    }
    // Truncate extremely long strings to prevent storage bloat
    if (obj.length > 5000) {
      return obj.substring(0, 100) + '...[truncated]';
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => stripLargeFields(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (['photos', 'attachments', 'screenshot', 'paymentScreenshot', 'imageUrl', 'handlingPhotos'].includes(key)) {
          if (Array.isArray(obj[key])) {
             cleaned[key] = obj[key].map((p: any) => typeof p === 'string' && p.startsWith('data:') ? '[omitted_image_data]' : p);
          } else if (typeof obj[key] === 'string' && obj[key].startsWith('data:')) {
             cleaned[key] = '[omitted_image_data]';
          } else {
             cleaned[key] = stripLargeFields(obj[key]);
          }
        } else {
          cleaned[key] = stripLargeFields(obj[key]);
        }
      }
    }
    return cleaned;
  }
  return obj;
};

export const setStorageItem = <T>(key: string, value: T, syncToFirestore: boolean = true): void => {
  try {
    const cleanedValue = stripLargeFields(value);
    
    try {
      localStorage.setItem(key, JSON.stringify(cleanedValue));
    } catch (quotaError) {
      // If we got QuotaExceededError, try clearing unneeded cache collections to free up space
      console.warn(`Quota exceeded for ${key}, clearing caches and retrying...`);
      const keysToClear = [
        'sched_inquiries',
        'sched_tabby_tamara',
        'sched_tt_complaints',
        'sched_client_comms',
        'sched_requests',
        'sched_time_logs',
        'sched_cases',
        'sched_notifications',
        'sched_tl_feedbacks'
      ];
      keysToClear.forEach(k => {
        if (k !== key) {
          try {
            localStorage.removeItem(k);
          } catch (e) {}
        }
      });
      // Retry setting item once caches are freed
      try {
        localStorage.setItem(key, JSON.stringify(cleanedValue));
      } catch (retryError) {
        console.warn(`Failed to set ${key} item even after cache clear:`, retryError);
      }
    }
    
    if (syncToFirestore && key.startsWith('sched_') && auth.currentUser) {
      const colName = getCollectionName(key);
      if (!colName || !Array.isArray(value)) {
        // Fallback for settings or config (e.g. system/sched_support_assignments)
        const cleanValue = JSON.parse(JSON.stringify(value));
        setDoc(doc(db, "system", key), { data: cleanValue }).catch(err => {
          console.warn("Firestore sync error for " + key, err);
        });
      }
    }
  } catch (e) {
    console.warn(`Error writing key ${key} to storage`, e);
  }
};

// Capitalize first letter of every word
export const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Normalize name against a reference list to avoid duplicates with different casing
export const normalizeName = (name: string, referenceList: string[]): string => {
  const cap = capitalizeName(name);
  const matched = referenceList.find(ref => ref?.toLowerCase() === cap?.toLowerCase());
  return matched || cap;
};

// Convert full name (e.g., Hesham Sobhy) to username (e.g., h.sobhy)
export const getUsernameFromFullName = (fullName: string): string => {
  if (!fullName) return '';
  const val = (fullName || '').trim().toLowerCase();
  if (val.includes('.') && !val.includes(' ')) {
    return val;
  }
  const parts = val.replace(/\s+/g, ' ').split(' ');
  if (parts.length === 0) return '';
  const firstLetter = parts[0].charAt(0);
  const lastName = parts[parts.length - 1];
  return `${firstLetter}.${lastName}`;
};

// Find matching human-readable agent name by username (or fallback)
export const findAgentByUsername = (username: string, referenceList: string[] = []): string | null => {
  if (!username) return null;
  const target = (username || '').trim().toLowerCase();
  
  const combinedList = Array.from(new Set([
    ...referenceList,
    ...INITIAL_AGENTS,
    ...TEAM_LEADERS,
    'Hesham Sobhy',
    'Amira Hassan',
    'Shymaa Hassan',
    'Shaymaa Hassan',
    'Hesso'
  ]));

  const found = combinedList.find(refName => {
    if (!refName || typeof refName !== 'string') return false;
    const username = getUsernameFromFullName(refName);
    const compactName = refName?.toLowerCase().replace(/\s+/g, '');
    const normalName = refName?.toLowerCase();
    
    return username === target || compactName === target.replace(/\s+/g, '') || normalName === target;
  });
  return found || null;
};

// Check if user is QA
export const isQAName = (name: string): boolean => {
  if (!name) return false;
  const fullName = findAgentByUsername(name) || name;
  const normalized = capitalizeName(fullName);
  if (AGENT_LOBS[normalized] === 'Quality') return true;
  
  const meta = getAgentMeta();
  const overrideKey = Object.keys(meta).find(k => String(k || '').trim().toLowerCase().replace(/\s+/g, ' ') === normalized?.toLowerCase());
  if (overrideKey && meta[overrideKey].roleType) {
    const role = meta[overrideKey]?.roleType?.toLowerCase();
    if (role === 'qa' || role === 'quality') {
      return true;
    }
  }
  return false;
};

// Check if user is a Team Leader
export const isTLName = (name: string): boolean => {
  if (!name) return false;
  const fullName = findAgentByUsername(name) || name;
  const normalized = capitalizeName(fullName);
  if (TEAM_LEADERS.some(tl => tl?.toLowerCase() === normalized?.toLowerCase())) return true;
  if (normalized?.toLowerCase() === 'hesso') return true;
  
  const meta = getAgentMeta();
  const overrideKey = Object.keys(meta).find(k => String(k || '').trim().toLowerCase().replace(/\s+/g, ' ') === normalized?.toLowerCase());
  if (overrideKey && meta[overrideKey].roleType) {
    const role = meta[overrideKey]?.roleType?.toLowerCase();
    if (role === 'tl' || role === 'team leader' || role.includes('manager')) {
      return true;
    }
  }
  return false;
};

export const formatAgentName = (name: string): string => {
  if (!name) return '';
  const fullName = findAgentByUsername(name) || name;
  const normalized = capitalizeName(fullName);
  if (normalized?.toLowerCase() === 'amira hassan') {
    return 'Amira Hassan ';
  }
  return normalized;
};

// Retrieve Agent Metadata
export const getAgentMeta = (): Record<string, { roleType: string; tlName: string }> => {
  try {
    const raw = localStorage.getItem('sched_agent_meta');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

// Retrieve Line of Business (LOB) for an agent or TL
export const getAgentLOB = (name: string): string => {
  if (!name) return 'General';
  const fullName = findAgentByUsername(name) || name;
  const cleanName = (fullName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  
  const meta = getAgentMeta();
  const overrideKey = Object.keys(meta).find(k => String(k || '').trim().toLowerCase().replace(/\s+/g, ' ') === cleanName);
  if (overrideKey && meta[overrideKey].roleType) {
    return meta[overrideKey].roleType;
  }

  const matchedKey = Object.keys(AGENT_LOBS).find(
    key => String(key || '').trim().toLowerCase().replace(/\s+/g, ' ') === cleanName
  );
  
  return matchedKey ? AGENT_LOBS[matchedKey] : 'General';
};

export const getAgentTL = (name: string): string => {
  if (!name) return 'Unassigned';
  const fullName = findAgentByUsername(name) || name;
  const cleanName = (fullName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  
  const meta = getAgentMeta();
  const overrideKey = Object.keys(meta).find(k => String(k || '').trim().toLowerCase().replace(/\s+/g, ' ') === cleanName);
  if (overrideKey && meta[overrideKey].tlName) {
    return meta[overrideKey].tlName;
  }
  return 'Unassigned';
};

// Format Date nicely
export const formatDateNice = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Get current local date in YYYY-MM-DD format
export const getLocalISOString = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Get device local timezone
export const getLocalTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
};

// Validate a Swap Request (must be 24h before shift)
export const validateSwapRequest = (
  shiftDateStr: string,
  shiftLabel: string,
  currentTime: Date = new Date()
): { isValid: boolean; message?: string; hoursDiff?: number } => {
  if (!shiftDateStr) return { isValid: false, message: 'Please select a shift date.' };

  // Parse shift time
  // Shift labels are like "07:00 - 16:00", we want the start time.
  const startHour = parseInt(shiftLabel.split(':')[0], 10) || 0;
  
  const shiftDateTime = new Date(shiftDateStr);
  shiftDateTime.setHours(startHour, 0, 0, 0);

  const diffMs = shiftDateTime.getTime() - currentTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return {
      isValid: false,
      hoursDiff: parseFloat(diffHours.toFixed(1)),
      message: `Shift is less than 24 hours away (${parseFloat(diffHours.toFixed(1))}h). Shifts can only be swapped at least 24 hours in advance.`
    };
  }

  return { isValid: true, hoursDiff: parseFloat(diffHours.toFixed(1)) };
};

// Validate an Annual Leave Request (must be >= 14 days in advance)
export const validateAnnualRequest = (
  startDateStr: string,
  currentTime: Date = new Date()
): { isValid: boolean; message?: string; daysDiff?: number } => {
  if (!startDateStr) return { isValid: false, message: 'Please select a start date.' };

  const startDateTime = new Date(startDateStr);
  startDateTime.setHours(0, 0, 0, 0);

  const today = new Date(currentTime);
  today.setHours(0, 0, 0, 0);

  const diffMs = startDateTime.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 14) {
    return {
      isValid: false,
      daysDiff: diffDays,
      message: `Start date is only ${diffDays} day(s) away. Annual leave must be requested at least 14 days in advance.`
    };
  }

  return { isValid: true, daysDiff: diffDays };
};

// Helper to generate initial logs/requests when localStorage is empty
export const getInitialRequests = (currentTime: Date = new Date()): SchedulingRequest[] => {
  const getOffsetDate = (days: number): string => {
    const d = new Date(currentTime);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const getPastDateStr = (daysAgo: number): string => {
    const d = new Date(currentTime);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    {
      id: 'req_1',
      agentName: 'Ahmed Aly',
      type: 'swap',
      date: getOffsetDate(3), // 3 days in future (Valid, >24h)
      shift: '07:00 - 16:00',
      swapWithAgent: 'Mostafa Mahmoud',
      swapWithShift: '13:00 - 22:00',
      status: 'pending',
      createdAt: getPastDateStr(2),
      notes: 'Need to visit doctor in the afternoon'
    },
    {
      id: 'req_2',
      agentName: 'Fatma Omar',
      type: 'swap',
      date: getOffsetDate(5), // 5 days in future (Valid)
      shift: '13:00 - 22:00',
      swapWithAgent: 'Farida Khalil',
      swapWithShift: '07:00 - 16:00',
      status: 'pending',
      createdAt: getPastDateStr(1),
      notes: 'Family gathering'
    },
    {
      id: 'req_3',
      agentName: 'Nour Selim',
      type: 'annual',
      startDate: getOffsetDate(18), // 18 days away (>14 days, valid)
      endDate: getOffsetDate(25),
      status: 'pending',
      createdAt: getPastDateStr(3),
      notes: 'Summer vacation trip with parents'
    },
    {
      id: 'req_4',
      agentName: 'Mostafa Mahmoud',
      type: 'swap',
      date: getOffsetDate(1), // Tomorrow, check if > 24 hours. Let's make it 30h away
      shift: '13:00 - 22:00',
      swapWithAgent: 'Ahmed Aly',
      swapWithShift: '07:00 - 16:00',
      status: 'approved',
      createdAt: getPastDateStr(2),
      notes: 'Personal errand',
      actionBy: 'Shymaa Hassan',
      actionAt: getPastDateStr(1)
    },
    {
      id: 'req_5',
      agentName: 'Farida Khalil',
      type: 'annual',
      startDate: getOffsetDate(21),
      endDate: getOffsetDate(28),
      status: 'approved',
      createdAt: getPastDateStr(5),
      notes: 'Sibling wedding preparation',
      actionBy: 'Hesham Sobhy',
      actionAt: getPastDateStr(4)
    },
    {
      id: 'req_6',
      agentName: 'Kareem Tarek',
      type: 'annual',
      startDate: getOffsetDate(5), // 5 days away (<14 days rule violation - historically rejected)
      endDate: getOffsetDate(10),
      status: 'declined',
      createdAt: getPastDateStr(1),
      notes: 'Urgent home renovation',
      actionBy: 'Emad Sayed',
      actionAt: getPastDateStr(1),
      ruleViolation: true,
      violationMessage: 'Failed minimum 14 days advance notice rule (only 5 days notice given).'
    },
    {
      id: 'req_7',
      agentName: 'Ziad Amr',
      type: 'swap',
      date: getOffsetDate(0), // Today (Strict swap rule violation)
      shift: '13:00 - 22:00',
      swapWithAgent: 'Yasmine Sherif',
      swapWithShift: '22:00 - 07:00',
      status: 'declined',
      createdAt: getPastDateStr(0),
      notes: 'Car breakdown',
      actionBy: 'Amira Hassan',
      actionAt: getPastDateStr(0),
      ruleViolation: true,
      violationMessage: 'Failed minimum 24 hour advance notice rule.'
    }
  ];
};

// CSV Export Generator
export const generateCSV = (requests: SchedulingRequest[], filterType: 'all' | 'swap' | 'annual' = 'all'): string => {
  const filtered = filterType === 'all' ? requests : requests.filter(r => r.type === filterType);
  
  const headers = [
    'Request ID',
    'Agent Name',
    'Type',
    'Status',
    'Shift Date/Start Date',
    'Shift Hours/End Date',
    'Swapping With Agent',
    'Swapping With Shift',
    'Submitted At',
    'Actioned By',
    'Actioned At',
    'Notes',
    'Rule Violation'
  ];

  const rows = filtered.map(r => {
    const isSwap = r.type === 'swap';
    return [
      r.id,
      `"${r.agentName.replace(/"/g, '""')}"`,
      r.type.toUpperCase(),
      r.status.toUpperCase(),
      isSwap ? (r as SwapRequest).date : (r as AnnualRequest).startDate,
      isSwap ? (r as SwapRequest).shift : (r as AnnualRequest).endDate,
      isSwap ? `"${(r as SwapRequest).swapWithAgent.replace(/"/g, '""')}"` : '',
      isSwap ? (r as SwapRequest).swapWithShift : '',
      r.createdAt,
      r.actionBy ? `"${r.actionBy.replace(/"/g, '""')}"` : '',
      r.actionAt || '',
      r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '',
      r.ruleViolation ? 'YES' : 'NO'
    ];
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Text Report Generator
export const generateTextReport = (
  requests: SchedulingRequest[], 
  period: 'day' | 'week' | 'month' | 'year',
  currentTime: Date
): string => {
  const now = new Date(currentTime);
  const cutoff = new Date(currentTime);

  if (period === 'day') {
    cutoff.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    cutoff.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    cutoff.setMonth(now.getMonth() - 1);
  } else if (period === 'year') {
    cutoff.setFullYear(now.getFullYear() - 1);
  }

  const reports = requests.filter(r => new Date(r.createdAt) >= cutoff);
  const approved = reports.filter(r => r.status === 'approved');
  const pending = reports.filter(r => r.status === 'pending');
  const declined = reports.filter(r => r.status === 'declined');

  const swaps = reports.filter(r => r.type === 'swap');
  const annuals = reports.filter(r => r.type === 'annual');

  const lines: string[] = [];
  lines.push('====================================================');
  lines.push(`          SCHEDULING TOOL - STATUS REPORT           `);
  lines.push(`               Period: ${period.toUpperCase()}`);
  lines.push(`          Generated At: ${now.toUTCString()}`);
  lines.push('====================================================');
  lines.push('');
  lines.push(`Total Requests Received: ${reports.length}`);
  lines.push(`  - Approved           : ${approved.length}`);
  lines.push(`  - Pending            : ${pending.length}`);
  lines.push(`  - Declined/Violated  : ${declined.length}`);
  lines.push('');
  lines.push(`By Request Type:`);
  lines.push(`  - Shift Swaps        : ${swaps.length}`);
  lines.push(`  - Annual Leaves      : ${annuals.length}`);
  lines.push('');
  lines.push('----------------------------------------------------');
  lines.push('Detailed Request Logs:');
  lines.push('----------------------------------------------------');

  if (reports.length === 0) {
    lines.push('No requests recorded in this period.');
  } else {
    reports.forEach((r, idx) => {
      lines.push(`${idx + 1}. [${r.type.toUpperCase()}] by ${r.agentName}`);
      lines.push(`   Status   : ${r.status.toUpperCase()}`);
      if (r.type === 'swap') {
        lines.push(`   Date     : ${(r as SwapRequest).date} (Shift: ${(r as SwapRequest).shift})`);
        lines.push(`   Swapping : with ${(r as SwapRequest).swapWithAgent} [${(r as SwapRequest).swapWithShift}]`);
      } else {
        lines.push(`   Dates    : ${(r as AnnualRequest).startDate} to ${(r as AnnualRequest).endDate}`);
      }
      lines.push(`   Submitted: ${new Date(r.createdAt).toLocaleDateString()}`);
      if (r.actionBy) {
        lines.push(`   Actioned : ${r.status === 'approved' ? 'Approved' : 'Declined'} by ${r.actionBy} on ${new Date(r.actionAt || '').toLocaleDateString()}`);
      }
      if (r.ruleViolation) {
        lines.push(`    Violation: ${r.violationMessage || 'Notice interval violation'}`);
      }
      if (r.notes) {
        lines.push(`   Remarks  : ${r.notes}`);
      }
      lines.push('');
    });
  }

  lines.push('====================================================');
  lines.push('                  END OF REPORT                     ');
  lines.push('====================================================');

  return lines.join('\n');
};

// Generate initial schedules for agents over a 30-day window
export const getInitialSchedules = (currentTime: Date, agents: string[]): ScheduledShift[] => {
  const list: ScheduledShift[] = [];
  const totalDays = 30;
  
  // Start from 5 days ago to 25 days in the future
  const startDate = new Date(currentTime);
  startDate.setDate(startDate.getDate() - 5);

  const shiftLabels = SHIFTS.map(s => s.label); // ['07:00 - 16:00', '13:00 - 22:00', '22:00 - 07:00']

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    agents.forEach((agent, agentIdx) => {
      // Rotation algorithm: (dayOffset + agentOffset) % 4
      // 0 = Morning, 1 = Afternoon, 2 = Night, 3 = Rest Day (Off)
      const patternIdx = (i + agentIdx) % 4;
      if (patternIdx < 3) {
        list.push({
          id: `sch_${dateStr}_${agentIdx}`,
          agentName: agent,
          date: dateStr,
          shiftLabel: shiftLabels[patternIdx]
        });
      }
    });
  }

  return list;
};

// Generate a sample CSV template for Schedule uploading
export const generateScheduleTemplateFile = (): string => {
  const headers = ['Agent Name', 'Date (YYYY-MM-DD)', 'Shift (Morning / Afternoon / Night / or exact hours)', 'Shift Notes'];
  const samples = [
    ['Ahmed Aly', '2026-05-25', 'Morning', 'First day back from vacation'],
    ['Ahmed Aly', '2026-05-26', 'Afternoon', 'Late arrival approved by leadership'],
    ['Mostafa Mahmoud', '2026-05-25', '13:00 - 22:00', 'On-site premium shift'],
    ['Fatma Omar', '2026-05-25', 'Night', 'Coverage role'],
    ['Nour Selim', '2026-05-27', '22:00 - 07:00', 'Regular support hours']
  ];

  return [
    headers.join(','),
    ...samples.map(row => row.join(','))
  ].join('\n');
};

export const parseAgentDirectoryCSV = (
  csvContent: string
): { directory: AgentDirectoryRow[]; errors: string[]; parsedCount: number; headers: string[] } => {
  const directory: AgentDirectoryRow[] = [];
  const errors: string[] = [];

  if (!csvContent || !String(csvContent || '').trim()) {
    return { directory: [], errors: ['CSV content is empty.'], parsedCount: 0, headers: [] };
  }

  const parseRow = (lineStr: string) => {
    const row: string[] = [];
    let curVal = '';
    let inQuotes = false;
    for (let i = 0; i < lineStr.length; i++) {
      const char = lineStr[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(String(curVal || '').trim().replace(/^["']|["']$/g, ''));
        curVal = '';
      } else {
        curVal += char;
      }
    }
    row.push(String(curVal || '').trim().replace(/^["']|["']$/g, ''));
    return row;
  };

  const allLines = csvContent.split(/\r?\n/).filter(l => String(l || '').trim().length > 0);
  if (allLines.length <= 1) {
    return { directory: [], errors: ['No data rows found in CSV.'], parsedCount: 0, headers: [] };
  }

  const parsedLines = allLines.map(line => parseRow(line));

  // Dynamic Header Recognition: look for keywords in the first 20 rows
  let headerIdx = 0;
  let nameIdx = -1;

  for (let i = 0; i < Math.min(parsedLines.length, 20); i++) {
    const row = parsedLines[i];
    const foundIdx = row.findIndex(h => {
      const l = h ? String(h).toLowerCase().trim() : '';
      return l === 'agent' || l === 'name' || l === 'employee' || l === 'user' || 
             l.includes('agent name') || l.includes('employee name') || l.includes('full name') ||
             l === 'who' || l === 'member' || l.includes('staff');
    });
    if (foundIdx !== -1) {
      headerIdx = i;
      nameIdx = foundIdx;
      break;
    }
  }

  // Fallback: search for ANY 'name' or 'agent' or 'who'
  if (nameIdx === -1) {
      for (let i = 0; i < Math.min(parsedLines.length, 20); i++) {
        const row = parsedLines[i];
        const foundIdx = row.findIndex(h => {
          const l = h ? String(h).toLowerCase().trim() : '';
          return l.includes('name') || l.includes('agent') || l.includes('employee') || l.includes('user') || l.includes('member');
        });
        if (foundIdx !== -1) {
          headerIdx = i;
          nameIdx = foundIdx;
          break;
        }
      }
  }

  if (nameIdx === -1) {
    nameIdx = 0; // Default to first column if everything fails
    headerIdx = 0;
  }

  const rawHeaders = parsedLines[headerIdx];

  for (let idx = headerIdx + 1; idx < parsedLines.length; idx++) {
    const row = parsedLines[idx];

    if (row.length === 0 || row.every(c => !c)) continue;

    const rawName = row[nameIdx] || '';
    
    // Filter out common "junk" or "total" rows
    const nameLower = String(rawName).toLowerCase().trim();
    if (!rawName || 
        nameLower.includes('total') || 
        nameLower.includes('count') || 
        nameLower.includes('summary') ||
        nameLower.includes('unnamed') ||
        nameLower.includes('formula') ||
        nameLower.startsWith('---') ||
        nameLower.startsWith('=') ||
        nameLower.length < 2) {
      continue;
    }

    // Capture TL and Role/LOB if we can find them in the row to auto-populate metadata
    const agentName = capitalizeName(rawName.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/\d+/g, '').trim());
    
    if (!agentName || agentName.split(' ').length > 8) continue; // Skip sentence-like rows or extremely long names

    const rowData: Record<string, string> = {};
    rawHeaders.forEach((h, i) => {
       const headerName = h || `Column_${i}`;
       if (i !== nameIdx) {
          rowData[headerName] = row[i] || '';
       }
    });

    directory.push({
      id: `dir_${Date.now()}_${idx}`,
      agentName,
      data: rowData
    });
  }

  return {
    directory,
    errors,
    parsedCount: directory.length,
    headers: rawHeaders.filter((_, i) => i !== nameIdx && rawHeaders[i])
  };
};

// Robust CSV Parser for schedules supporting list and matrix formats with intelligent shift/date mappings
export const parseScheduleCSV = (
  csvContent: string,
  existingAgents: string[]
): { schedules: ScheduledShift[]; errors: string[]; parsedCount: number; newAgents: string[]; parsedMeta: Record<string, { tlName?: string }> } => {
  const schedules: ScheduledShift[] = [];
  const errors: string[] = [];
  const newAgentsSet = new Set<string>();
  const parsedMeta: Record<string, { tlName?: string }> = {};

  if (!csvContent || !String(csvContent || '').trim()) {
    return { schedules: [], errors: ['CSV content is empty.'], parsedCount: 0, newAgents: [], parsedMeta: {} };
  }

  // 1. Strip BOM character if present
  const cleanCSV = csvContent.replace(/^\uFEFF/, '').trim();

  // Helper Row Tokenizer
  const getCSVRows = (csvText: string): string[][] => {
    const lines = csvText.split(/\r?\n/).map(l => String(l || '').trim()).filter(l => l.length > 0);
    return lines.map(lineStr => {
      const row: string[] = [];
      let curVal = '';
      let inQuotes = false;
      for (let i = 0; i < lineStr.length; i++) {
        const char = lineStr[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(String(curVal || '').trim().replace(/^["']|["']$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      row.push(String(curVal || '').trim().replace(/^["']|["']$/g, ''));
      return row;
    });
  };

  const parsedRows = getCSVRows(cleanCSV);
  if (parsedRows.length === 0) {
    return { schedules: [], errors: ['No data rows found in CSV.'], parsedCount: 0, newAgents: [], parsedMeta: {} };
  }

  const parseTargetDate = (dateStr: string | undefined | null | number): string | null => {
    if (dateStr == null) return null;
    const s = String(dateStr).trim();
    if (!s) return null;

    const yymmdd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (yymmdd) {
      return `${yymmdd[1]}-${yymmdd[2].padStart(2, '0')}-${yymmdd[3].padStart(2, '0')}`;
    }

    const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (m) {
      const v1 = parseInt(m[1], 10);
      const v2 = parseInt(m[2], 10);
      const yrMatch = m[3];
      const yr = yrMatch.length === 2 ? `20${yrMatch}` : yrMatch;
      if (v1 > 12 && v2 <= 12) {
        return `${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      }
      if (v2 > 12 && v1 <= 12) {
        return `${yr}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
      }
      return `${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }

    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const short = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const lower = s.toLowerCase();
    
    for (let i = 0; i < 12; i++) {
       if (lower.includes(months[i]) || lower.includes(short[i])) {
          const digits = lower.replace(/[a-z]/gi, '').trim().match(/\b\d{1,2}\b/);
          if (digits) {
             let yearConfig = new Date().getFullYear();
             const yrMatch2 = s.match(/\b(202\d|203\d)\b/);
             if (yrMatch2) { yearConfig = parseInt(yrMatch2[1], 10); }
             return `${yearConfig}-${(i+1).toString().padStart(2, '0')}-${parseInt(digits[0], 10).toString().padStart(2, '0')}`;
          }
       }
    }

    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const dUtc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      return dUtc.toISOString().split('T')[0];
    }
    
    return null;
  };

  const mapShiftValue = (raw: string): string => {
    const val = (raw || '').trim().toLowerCase();
    if (!val) return 'Off Day';
    if (['off', 'day off', 'leave', 'al', 'sl', 'vacation', 'sick', 'holiday', 'rest'].some(k => val === k)) return 'Off Day';
    if (['morning', 'am', '07', '08', '07:00'].some(k => val.includes(k))) return 'Morning Shift';
    if (['afternoon', 'pm', '12', '13', '14', 'afternoon shift'].some(k => val.includes(k))) return 'Afternoon Shift';
    if (['night', 'evening', '19', '20', 'graveyard', 'night shift'].some(k => val.includes(k))) return 'Night Shift';
    
    // eslint-disable-next-line
    //@ts-ignore
    const matchedShift = SHIFTS.find(s => s.label?.toLowerCase() === val || s.display?.toLowerCase() === val);
    if (matchedShift) return matchedShift.label;
    
    return 'Off Day';
  };

  const isAgentHeaderCol = (h?: string): boolean => {
    if (!h) return false;
    const s = String(h).trim().toLowerCase();
    return ['agent name', 'agent', 'name', 'employee', 'staff', 'employee name', 'no.'].includes(s) || s.includes('employee') || s.includes('agent');
  };
  const isDateHeaderCol = (h?: string): boolean => {
    if (!h) return false;
    const s = String(h).trim().toLowerCase();
    return ['date', 'day', 'week', 'shift date', 'schedule'].includes(s);
  };
  const isShiftHeaderCol = (h?: string): boolean => {
    if (!h) return false;
    const s = String(h).trim().toLowerCase();
    return ['shift', 'schedule', 'type', 'slot', 'time', 'shift time'].includes(s);
  };

  let headerRowIndex = -1;
  let nameIdx = -1;
  let dateIdx = -1;
  let shiftIdx = -1;
  let isMatrixFormat = false;

  for (let i = 0; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    const cleanRow = row.map(h => h ? String(h).trim().toLowerCase().replace(/^["']|["']$/g, '') : '');
    const tempNameIdx = cleanRow.findIndex(h => h && isAgentHeaderCol(h));
    
    if (tempNameIdx !== -1) {
      headerRowIndex = i;
      nameIdx = tempNameIdx;
      dateIdx = cleanRow.findIndex(h => h && isDateHeaderCol(h));
      shiftIdx = cleanRow.findIndex(h => h && isShiftHeaderCol(h));

      if (dateIdx === -1 && shiftIdx === -1) {
         let validDateCols = 0;
         for (let col = nameIdx + 1; col < row.length; col++) {
             if (parseTargetDate(row[col])) validDateCols++;
         }
         if (validDateCols >= 1) {
             isMatrixFormat = true;
         }
      }
      break; 
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0; 
    const firstRow = parsedRows[0].map(h => h ? String(h).trim().toLowerCase().replace(/^["']|["']$/g, '') : '');
    if (firstRow.some(h => parseTargetDate(h))) {
       isMatrixFormat = true;
       nameIdx = 0; 
    } else {
       errors.push('Column Match Warning: Could not explicitly find Agent Name column. Defaulting to Column 1.'); nameIdx = 0;
       errors.push('Column Match Warning: Could not explicitly find Date column. Defaulting to Column 2.'); dateIdx = 1;
       errors.push('Column Match Warning: Could not explicitly find Shift column. Defaulting to Column 3.'); shiftIdx = 2;
    }
  }

  const rawHeaders = parsedRows[headerRowIndex];

  for (let idx = headerRowIndex + 1; idx < parsedRows.length; idx++) {
    const row = parsedRows[idx];
    if (row.length === 0 || row.every(c => !c)) continue; 

    const lineNum = idx + 1;
    let rawName = String(row[nameIdx] || '').trim();

    if (!rawName) {
      continue;
    }

    if (rawName?.toLowerCase().includes('total') || rawName?.toLowerCase().includes('count') || rawName?.toLowerCase().includes('legend')) continue;

    let extractedTL = '';
    let processedName = rawName;
    const tlMatch = processedName.match(/\((.*?)\)/);
    if (tlMatch) {
      extractedTL = String(tlMatch[1] || '').trim();
      processedName = processedName.replace(/\((.*?)\)/g, '').trim();
    }
    
    // eslint-disable-next-line
    //@ts-ignore
    const agentName = capitalizeName(processedName);
    if (extractedTL) {
      parsedMeta[agentName] = { tlName: extractedTL };
    }

    const isExisting = existingAgents.some(a => a?.toLowerCase() === agentName?.toLowerCase());
    if (!isExisting) {
      newAgentsSet.add(agentName);
    }

    if (isMatrixFormat) {
       for (let col = nameIdx + 1; col < row.length; col++) {
           const dateHeader = rawHeaders[col];
           if (!dateHeader) continue;
           const formattedDate = parseTargetDate(dateHeader);
           if (!formattedDate) continue; 
           
           const rawShift = String(row[col] || '').trim();
           if (!rawShift) continue;

           const shiftLabel = mapShiftValue(rawShift);
           schedules.push({
             id: `sch_up_${Date.now()}_mat_${idx}_${col}`,
             agentName,
             date: formattedDate,
             shiftLabel
           });
       }
    } else {
       const rawDate = String(row[dateIdx] || '').trim();
       const rawShift = String(row[shiftIdx] || '').trim();

       if (!rawDate && !rawShift) continue; 

       const formattedDate = parseTargetDate(rawDate);
       if (!formattedDate) {
         errors.push(`Row ${lineNum} (${rawName}): Date format unrecognized "${rawDate}". Expected formats like YYYY-MM-DD or MM/DD/YYYY.`);
         continue;
       }

       const yearCheck = parseInt(formattedDate.split('-')[0], 10);
       if (yearCheck < 2020 || yearCheck > 2100) {
         errors.push(`Row ${lineNum} (${rawName}): Date year is out of bounds "${formattedDate}". Allowed bounds are 2020 to 2100.`);
         continue;
       }

       const shiftLabel = mapShiftValue(rawShift);

       schedules.push({
         id: `sch_up_${Date.now()}_vert_${idx}`,
         agentName,
         date: formattedDate,
         shiftLabel
       });
    }
  }

  return {
    schedules,
    errors,
    parsedCount: schedules.length,
    newAgents: Array.from(newAgentsSet),
    parsedMeta
  };
};

export const generateInquiriesCSV = (inquiries: Inquiry[]): string => {
  const headers = [
    'Inquiry ID',
    'Agent Name',
    'Clinic Name',
    'Inquiry Text',
    'Status',
    'Attachments Count',
    'Links Count',
    'Created At',
    'Forwarded By',
    'Forwarded At',
    'Answer Details',
    'Answered By',
    'Answered At'
  ];

  const rows = inquiries.map(inq => {
    return [
      inq.id,
      `"${(inq.agentName || '').replace(/"/g, '""')}"`,
      `"${(inq.clinicName || '').replace(/"/g, '""')}"`,
      `"${(inq.text || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      inq.status.toUpperCase(),
      inq.photos ? inq.photos.length : 0,
      inq.links ? inq.links.length : 0,
      inq.createdAt || '',
      inq.sentBy ? `"${inq.sentBy.replace(/"/g, '""')}"` : '',
      inq.sentAt || '',
      inq.answer ? `"${inq.answer.replace(/"/g, '""').replace(/\n/g, ' ')}"` : '',
      inq.answeredBy ? `"${inq.answeredBy.replace(/"/g, '""')}"` : '',
      inq.answeredAt || ''
    ];
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Generate CSV report for Agent Time Logs / Clockings
export const generateTimeLogsCSV = (timeLogs: TimeLog[]): string => {
  const headers = [
    'Log ID',
    'Agent Name',
    'Date',
    'Clock In At',
    'Clock Out At',
    'Current Status',
    'Breaks Taken Count',
    'Total Break Mins',
    'Total Lunch Mins',
    'Total Restroom Mins',
    'Has Overtime Violations'
  ];

  const rows = timeLogs.map(log => {
    // calculate durations
    const breakCount = log.activities.filter(a => a.type === 'break').length;
    
    let breakMins = 0;
    let lunchMins = 0;
    let restroomMins = 0;

    log.activities.forEach(a => {
      const minutes = a.durationMinutes || 0;
      if (a.type === 'break') breakMins += minutes;
      if (a.type === 'lunch') lunchMins += minutes;
      if (a.type === 'restroom') restroomMins += minutes;
    });

    let overtime = false;
    if (log.clockIn && log.clockOut) {
      const workHrs = (new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()) / 1000 / 60 / 60;
      if (workHrs > 9.5) overtime = true; // flagged rule check
    }

    return [
      log.id,
      `"${log.agentName.replace(/"/g, '""')}"`,
      log.date,
      log.clockIn || '',
      log.clockOut || '',
      log.status.toUpperCase(),
      breakCount,
      breakMins.toFixed(1),
      lunchMins.toFixed(1),
      restroomMins.toFixed(1),
      overtime ? 'YES' : 'NO'
    ];
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Generate CSV report for Tabby / Tamara Fintech Transactions
export const generateFintechRequestsCSV = (requests: TabbyTamaraRequest[]): string => {
  const headers = [
    'Request ID',
    'Agent Name',
    'Patient Name',
    'File Number',
    'Is Old Customer',
    'ID Number',
    'Entered Amount',
    '5% Added Amount',
    'Final Amount (AED)',
    'Phone Number',
    'Platform',
    'Clinic Name',
    'Status',
    'Contact Status',
    'Payment Link',
    'Notes',
    'Contact Notes',
    'Created At',
    'Contacted At',
    'Confirmed At',
    'Confirmed By'
  ];

  const rows = requests.map(r => {
    const pricing = calculateTabbyTamaraPrice(r.priceWithoutTax || 0);
    return [
      r.id,
      `"${(r.agentName || '').replace(/"/g, '""')}"`,
      `"${(r.patientName || '').replace(/"/g, '""')}"`,
      `"${(r.fileNumber || '').replace(/"/g, '""')}"`,
      r.isOldCustomer ? 'YES' : 'NO',
      `"${(r.idNumber || '').replace(/"/g, '""')}"`,
      `"${(pricing.priceBeforeFee).toString()}"`,
      `"${(pricing.feeAmount).toString()}"`,
      `"${(pricing.finalPrice).toString()}"`,
      `"${(r.phoneNumber || '').replace(/"/g, '""')}"`,
      r.platform.toUpperCase(),
      `"${(r.clinicName || '').replace(/"/g, '""')}"`,
      r.status.toUpperCase(),
      (r.customerContacted || 'not_contacted').toUpperCase(),
      `"${(r.paymentLink || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.agentContactNotes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      r.createdAt || '',
      r.contactedAt || '',
      r.confirmedAt || '',
      r.confirmedBy ? `"${r.confirmedBy.replace(/"/g, '""')}"` : ''
    ];
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Generate CSV report for Tabby / Tamara Fintech Complaints
export const generateFintechComplaintsCSV = (complaints: TabbyTamaraComplaint[]): string => {
  const headers = [
    'Complaint ID',
    'Agent Name',
    'Patient Name',
    'File Number',
    'Is Old Customer',
    'ID Number',
    'Phone Number',
    'Clinic Name',
    'Status',
    'Complaint Details',
    'TL Comment',
    'Contact Status',
    'Created At',
    'TL Handled At',
    'TL Handled By',
    'Contacted At'
  ];

  const rows = complaints.map(c => [
    c.id,
    `"${(c.agentName || '').replace(/"/g, '""')}"`,
    `"${(c.patientName || '').replace(/"/g, '""')}"`,
    `"${(c.fileNumber || '').replace(/"/g, '""')}"`,
    c.isOldCustomer ? 'YES' : 'NO',
    `"${(c.idNumber || '').replace(/"/g, '""')}"`,
    `"${(c.phoneNumber || '').replace(/"/g, '""')}"`,
    `"${(c.clinicName || '').replace(/"/g, '""')}"`,
    c.status.toUpperCase(),
    `"${(c.complaintDetails || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(c.tlComment || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    (c.customerContacted || 'not_contacted').toUpperCase(),
    c.createdAt || '',
    c.tlHandledAt || '',
    c.tlHandledBy ? `"${c.tlHandledBy.replace(/"/g, '""')}"` : '',
    c.contactedAt || ''
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Generate CSV report for Client Communications
export const generateClientCommsCSV = (comms: ClientCommunicationRequest[]): string => {
  const headers = [
    'Request ID',
    'Call Center Agent',
    'Clinic Name',
    'Phone Number',
    'Language',
    'Notes',
    'Status',
    'Handled By',
    'Handled At',
    'Handling Notes',
    'Created At'
  ];

  const rows = comms.map(c => [
    c.id,
    `"${(c.callCenterAgentName || '').replace(/"/g, '""')}"`,
    `"${(c.clinicName || '').replace(/"/g, '""')}"`,
    `"${(c.phoneNumber || '').replace(/"/g, '""')}"`,
    c.language.toUpperCase(),
    `"${(c.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    c.status.toUpperCase(),
    c.handledBy ? `"${c.handledBy.replace(/"/g, '""')}"` : '',
    c.handledAt || '',
    `"${(c.handlingNotes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    c.createdAt || ''
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Generate CSV report for Direct Patient Case Enquiries
export const generateCasesCSV = (casesList: CaseRecord[]): string => {
  const headers = [
    'Case ID',
    'Agent Name',
    'Patient Name',
    'Phone Number',
    'Inquiry Description',
    'Lead Source',
    'Created At'
  ];

  const rows = casesList.map(c => [
    c.id,
    `"${(c.agentName || '').replace(/"/g, '""')}"`,
    `"${(c.patientName || '').replace(/"/g, '""')}"`,
    `"${(c.phoneNumber || '').replace(/"/g, '""')}"`,
    `"${(c.inquiry || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(c.leadSource || '').replace(/"/g, '""')}"`,
    c.createdAt || ''
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Generate CSV report for Master Active Schedules (Matrix format)
export const generateSchedulesCSV = (schedulesList: ScheduledShift[]): string => {
  const allDates = Array.from(new Set(schedulesList.map(s => s.date))).sort();
  // Get all unique agents from the schedules, but also try to get their TL if available
  const allAgents = Array.from(new Set(schedulesList.map(s => s.agentName))).sort();
  
  const headers = ['Agent Name', 'Team Leader', 'LOB', ...allDates];
  
  const map = new Map<string, Record<string, string>>();
  schedulesList.forEach(s => {
    if (!map.has(s.agentName)) {
      map.set(s.agentName, {});
    }
    map.get(s.agentName)![s.date] = s.shiftLabel;
  });

  const rows = allAgents.map(ag => {
    const tl = getAgentTL(ag);
    const lob = getAgentLOB(ag);
    const rowData = [ 
      `"${ag.replace(/"/g, '""')}"`,
      `"${tl.replace(/"/g, '""')}"`,
      `"${lob.replace(/"/g, '""')}"`
    ];
    allDates.forEach(dt => {
      const shift = map.get(ag)?.[dt] || 'Off';
      rowData.push(`"${shift.replace(/"/g, '""')}"`);
    });
    return rowData;
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Safe evaluation of dynamic KPI formula
export const evaluateKpiFormula = (formula: string, actual: number, target: number): number => {
  if (!formula || !String(formula || '').trim()) return 0;
  try {
    // Standardize variables
    let expr = formula?.toLowerCase()
      .replace(/actual/g, actual.toString())
      .replace(/target/g, target.toString());
      
    // Remove any unsafe characters (only allow digits, math operators, spaces, parentheses, dots)
    expr = expr.replace(/[^0-9+\-*/().\s]/g, '');
    
    // Evaluate safely
    const res = new Function(`return (${expr})`)();
    if (typeof res === 'number' && !isNaN(res)) {
      return res;
    }
  } catch (err) {
    console.error("Formula eval error:", err);
  }
  return 0;
};

// Compress base64 images using HTML Canvas to prevent Firestore size limit errors
export const compressImage = (base64Str: string, maxDimension = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str) {
      resolve('');
      return;
    }
    // If already very small (e.g. less than 150KB), don't process it to save time
    if (base64Str.length < 150000) {
      resolve(base64Str);
      return;
    }
    // Only compress actual images
    if (!base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64Str;
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(base64Str);
        }
      } catch (err) {
        console.error("Error compressing image:", err);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export const CASE_CONFIG = {
  inquiry: {
    collection: "inquiries",
    activeTab: "inquiries",
    prefix: "INQ",
  },
  tt_request: {
    collection: "tt_requests",
    activeTab: "tabby-tamara",
    prefix: "TTR",
  },
  tt_complaint: {
    collection: "tt_complaints",
    activeTab: "complaints",
    prefix: "TTC",
  },
  client_comm: {
    collection: "client_comms",
    activeTab: "client-comms",
    prefix: "COM",
  },
  scheduling_request: {
    collection: "scheduling_requests",
    activeTab: "my-requests",
    prefix: "SCH",
  },
  case: {
    collection: "cases",
    activeTab: "daily-cases",
    prefix: "CAS",
  },
} as const;

export type CaseEntityType =
  | "inq"
  | "inquiry"
  | "tt_request"
  | "tt_complaint"
  | "client_comm"
  | "comm"
  | "scheduling_request"
  | "sched"
  | "case";

const CASE_PREFIX: Record<CaseEntityType, string> = {
  inq: CASE_CONFIG.inquiry.prefix,
  inquiry: CASE_CONFIG.inquiry.prefix,
  tt_request: CASE_CONFIG.tt_request.prefix,
  tt_complaint: CASE_CONFIG.tt_complaint.prefix,
  client_comm: CASE_CONFIG.client_comm.prefix,
  comm: CASE_CONFIG.client_comm.prefix,
  scheduling_request: CASE_CONFIG.scheduling_request.prefix,
  sched: CASE_CONFIG.scheduling_request.prefix,
  case: CASE_CONFIG.case.prefix,
};

export const compactDate = (value?: string | number | Date): string => {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return [
    safeDate.getFullYear(),
    String(safeDate.getMonth() + 1).padStart(2, "0"),
    String(safeDate.getDate()).padStart(2, "0"),
  ].join("");
};

export const stableReferenceSuffix = (id: string): string => {
  const cleanId = String(id || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!cleanId) return "000000";

  // Deterministic hash: the same Firestore ID always produces the same suffix.
  let hash = 2166136261;
  for (let index = 0; index < cleanId.length; index += 1) {
    hash ^= cleanId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(-6);
};

export const formatCaseRef = (
  id: string,
  entityType?: string,
  createdAt?: string | number | Date,
  persistedCaseRef?: string,
): string => {
  if (persistedCaseRef?.trim()) return persistedCaseRef.trim().toUpperCase();

  const cType = (entityType || "inq") as CaseEntityType;
  const prefix = CASE_PREFIX[cType] || "REF";
  const timestampMatch = String(id || "").match(/(\d{10,13})/);
  
  let referenceDate: Date;
  if (timestampMatch) {
     referenceDate = new Date(Number(timestampMatch[1]));
  } else if (createdAt) {
     referenceDate = new Date(createdAt);
  } else {
     referenceDate = new Date();
  }

  return `${prefix}-${compactDate(referenceDate)}-${stableReferenceSuffix(id)}`;
};

export const normalizePhone = (phone: string): string => {
  return (phone || '').replace(/\D/g, '').replace(/^(971|00971|0)+/, '');
};

export const formatPhoneForCopy = (phone: string): string => {
  if (!phone) return '';
  const raw = (phone || '').trim();
  if (raw.startsWith('+')) return raw.replace(/\s+/g, '');
  if (raw.startsWith('00')) return '+' + raw.slice(2).replace(/\s+/g, '');
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length >= 11) return '+' + digits;
  if (digits.startsWith('971') && digits.length >= 11) return '+' + digits;
  const local = digits.replace(/^0+/, '');
  if (local.length >= 9) return '+971' + local;
  return raw.replace(/\s+/g, '');
};

/**
 * Returns the phone number formatted for local UAE copying:
 * strips +971 / 971 / 00971 / leading 0, leaves digits only,
 * resulting number should start with 5 (UAE mobile prefix).
 * e.g. "+971501234567" -> "501234567"
 *      "00971501234567" -> "501234567"
 *      "0501234567" -> "501234567"
 *      "501234567" -> "501234567"
 */
export const formatPhoneLocalForCopy = (phone: string): string => {
  if (!phone) return '';
  let digits = (phone || '').replace(/\D/g, ''); // strip all non-digits (+, spaces, dashes)
  
  // Strip 00971 / 971 country code prefixes
  if (digits.startsWith('00971')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('971')) {
    digits = digits.slice(3);
  }
  
  // Strip a leading 0 (e.g. "0501234567" -> "501234567")
  digits = digits.replace(/^0+/, '');
  
  return digits;
};

/**
 * Builds the PLAIN TEXT template (for the text/plain clipboard fallback and 
 * for platforms that don't support rich paste).
 */
export const buildClinicInquiryTextTemplate = (inq: {
  id: string;
  caseRef?: string;
  createdAt: string;
  agentName: string;
  clinicName: string;
  phoneNumber?: string;
  text: string;
  attachments?: any[];
  photos?: string[];
  links?: string[];
  sentToClinicCount?: number;
}): string => {
  const ref = formatCaseRef(inq.id, "inq", inq.createdAt, inq.caseRef);
  const localPhone = inq.phoneNumber ? formatPhoneLocalForCopy(inq.phoneNumber) : '';
  const isFollowUp = (inq.sentToClinicCount || 0) > 0;
  
  const allFiles = [
    ...(inq.attachments || []).map(a => ({ name: a.name, url: a.url, type: a.type })),
    ...(inq.photos || []).map((p, i) => ({ name: `Screenshot_${i + 1}.png`, url: p, type: 'image/png' })),
  ];

  const lines = [
    isFollowUp ? `📋 *FOLLOW-UP INQUIRY* — Ref: ${ref}` : `📋 *NEW INQUIRY* — Ref: ${ref}`,
    ``,
    `🏥 *Clinic:* ${inq.clinicName}`,
    `👤 *Agent:* ${inq.agentName}`,
    `📞 *Pt Number:* ${localPhone || 'N/A'}`,
    `🌐 *Platform:* WhatsApp`,
    ``,
    `💬 *Question:*`,
    inq.text,
    allFiles.length > 0 ? `` : '',
    allFiles.length > 0 ? `📎 *${allFiles.length} file(s) attached below* ⬇️` : '',
    (inq.links || []).length > 0 ? `🔗 *Links:* ${(inq.links || []).join(', ')}` : '',
  ].filter(line => line !== '');

  return lines.join('\n');
};

/**
 * Builds an HTML clipboard payload (text + embedded <img> tags for images, and 
 * clickable download links for non-image files like PDFs). When pasted into 
 * apps that support rich paste (WhatsApp Web, Slack, email clients), images 
 * embed directly and file links are clickable.
 */
export const buildClinicInquiryHtmlTemplate = (inq: {
  id: string;
  caseRef?: string;
  createdAt: string;
  agentName: string;
  clinicName: string;
  phoneNumber?: string;
  text: string;
  attachments?: any[];
  photos?: string[];
  links?: string[];
  sentToClinicCount?: number;
}): string => {
  const plainText = buildClinicInquiryTextTemplate(inq);
  const htmlEscapedText = plainText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
    // Re-apply basic bold formatting for *text* -> <b>text</b>
    .replace(/\*(.+?)\*/g, '<b>$1</b>');

  const allFiles = [
    ...(inq.attachments || []).map(a => ({ name: a.name, url: a.url, type: a.type })),
    ...(inq.photos || []).map((p, i) => ({ name: `Screenshot_${i + 1}.png`, url: p, type: 'image/png' })),
  ];

  const fileHtml = allFiles.map(f => {
    if ((f.type || '').startsWith('image/')) {
      return `<div style="margin-top:8px;"><img src="${f.url}" alt="${f.name}" style="max-width:400px; border-radius:8px;" /></div>`;
    }
    return `<div style="margin-top:8px;">📄 <a href="${f.url}">${f.name}</a></div>`;
  }).join('');

  return `<div style="font-family:sans-serif; font-size:14px; line-height:1.5;">${htmlEscapedText}${fileHtml}</div>`;
};

export const getSLAStatus = (createdAt: string, status: string, resolvedStatuses: string[]) => {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageH = ageMs / 3600000;
  const isResolved = resolvedStatuses.includes(status);
  const mins = Math.floor(ageMs / 60000);
  const label = ageH < 1 ? `${mins}m open` : `${Math.floor(ageH)}h ${Math.floor((ageH % 1)*60)}m open`;
  let color = 'bg-slate-700 text-slate-400 border-white/5';
  if (isResolved) color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  else if (ageH > 24) color = 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse';
  else if (ageH > 4) color = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  else if (ageH > 1) color = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return { label, color, isResolved, ageMs };
};

export const normalizeAttachments = (...sources: unknown[]): FileAttachment[] => {
  const flattened = sources.flatMap((source: any) =>
    Array.isArray(source) ? source : source ? [source] : []
  );
  const seen = new Set<string>();
  return flattened.flatMap((item: any, index) => {
    const isString = typeof item === "string";
    const isDataUrl = isString && item.startsWith("data:");
    const normalized: FileAttachment | null =
      isString
        ? {
            id: `legacy_${index}_${item.slice(-16)}`,
            name: isDataUrl ? `Attachment ${index + 1}` : item,
            type: isDataUrl ? item.slice(5, item.indexOf(";")) : "application/octet-stream",
            size: 0,
            url: item,
          }
        : item?.url || item?.dataUrl
          ? {
              id: item.id || item.uid || `legacy_${index}_${String(item.url || item.dataUrl).slice(-16)}`,
              name: item.name || item.filename || `Attachment ${index + 1}`,
              type: item.type || item.mimeType || "application/octet-stream",
              size: Number(item.size || 0),
              url: item.url || item.dataUrl,
              storagePath: item.storagePath,
              uploadedAt: item.uploadedAt,
              uploadedBy: item.uploadedBy,
            }
          : null;
    if (!normalized || !normalized.url || seen.has(normalized.url)) return [];
    seen.add(normalized.url);
    return [normalized];
  });
};

export const getSafeTTWorkflowStatus = (req: TabbyTamaraRequest): TTWorkflowStatus => {
  if (req.workflowStatus) return req.workflowStatus;
  if (req.status === 'rejected') return 'rejected';
  if (req.status === 'confirmed') {
    if (req.customerContacted === 'contacted') return 'ready_for_partner';
    return 'tl_link_ready';
  }
  return 'submitted';
};

export const getSafeTTSourceChannel = (req: TabbyTamaraRequest): 'chat' | 'call_center' => {
  if (req.sourceChannel) return req.sourceChannel;
  const lob = getAgentLOB(req.agentName || '');
  if (lob === 'Call Center') return 'call_center';
  return 'chat';
};

export interface ClipboardPayload {
  text: string;
  html: string;
  attachmentsList: { name: string; url: string }[];
}

export const buildCaseClipboardPayload = (request: TabbyTamaraRequest): ClipboardPayload => {
  const refCode = `TT-${request.id.replace('tt_', '').toUpperCase()}`;
  const provider = request.platform?.toUpperCase() || 'N/A';
  const patient = request.patientName || 'Unknown';
  const fileNum = request.fileNumber || request.idNumber || 'N/A';
  const phone = request.phoneNumber || 'N/A';
  const clinic = request.clinicName || 'N/A';
  const channel = request.sourceChannel === 'call_center' ? 'Call Center' : 'Chat / Social Media';
  const assignee = request.assignedToName || 'Unassigned';
  const workflowStatusLabel = (request.workflowStatus || getSafeTTWorkflowStatus(request))
    .replace(/_/g, ' ')
    .toUpperCase();
  const paymentLink = request.paymentLink || 'No link generated';

  // Extract all attachments across different arrays
  let rawAttachments = [
     request.paymentScreenshot,
     request.screenshot,
     request.imageUrl,
     ...(request.photos || []),
     ...(request.attachments || []),
     ...(request.clientIdAttachments || []),
     ...(request.paymentProofAttachments || []),
     ...(request.partnerAttachments || [])
  ];

  // Collect replies
  const repliesList: string[] = [];
  const repliesHtmlList: string[] = [];
  if (request.replies && Array.isArray(request.replies)) {
    request.replies.forEach((rep) => {
      const timeStr = new Date(rep.createdAt).toLocaleString();
      repliesList.push(`[${timeStr}] ${rep.senderName}: ${rep.text}`);
      repliesHtmlList.push(`<li><strong>${rep.senderName}</strong> <span style="font-size: 11px; color: #888;">(${timeStr})</span>: ${rep.text}</li>`);
      // Also grab attachments from replies
      if (rep.photos) rawAttachments.push(...rep.photos);
      if (rep.attachments) rawAttachments.push(...rep.attachments);
      if (rep.screenshot) rawAttachments.push(rep.screenshot);
      if (rep.imageUrl) rawAttachments.push(rep.imageUrl);
      if (rep.attachmentsObjects) rawAttachments.push(...rep.attachmentsObjects);
    });
  }

  const attachmentsList = normalizeAttachments(rawAttachments);
  const pricing = calculateTabbyTamaraPrice(request.priceWithoutTax || 0);

  // Text version
  const textLines = [
    `✨ *${provider} PAYMENT REQUEST* ✨`,
    `--------------------------------------`,
    `🆔 *Ref:* ${refCode}`,
    `👤 *Patient:* ${patient}`,
    `📞 *Phone:* ${formatPhoneForCopy(phone)}`,
    `📁 *File/ID:* ${fileNum}`,
    `🏥 *Clinic:* ${clinic}`,
    `💰 *Final Amount (incl. VAT):* ${pricing.finalPriceFormatted} *(Entered: ${pricing.priceBeforeFeeFormatted} + 5% Fee: ${pricing.feeAmountFormatted})*`,
    `📋 *Status:* ${workflowStatusLabel}`,
    `🔗 *Payment Link:* ${paymentLink}`,
    request.notes ? `💬 *Agent Notes:* ${request.notes}` : '',
    request.tlNotes ? `💬 *TL Notes:* ${request.tlNotes}` : '',
    `--------------------------------------`
  ].filter(Boolean).join('\n');

  // HTML version with modern responsive styling & colored status badges
  let statusColor = "#f59e0b"; // amber for pending
  if (workflowStatusLabel.includes("CONTACTED") || workflowStatusLabel.includes("RESOLVED") || workflowStatusLabel.includes("CONFIRMED") || workflowStatusLabel.includes("PAID")) {
    statusColor = "#10b981"; // green
  } else if (workflowStatusLabel.includes("REJECTED") || workflowStatusLabel.includes("DECLINED") || workflowStatusLabel.includes("FAILED")) {
    statusColor = "#ef4444"; // red
  }

  let providerColor = "#f59e0b"; // gold for tabby
  if (provider.toLowerCase() === "tamara") {
    providerColor = "#f43f5e"; // rose for tamara
  } else if (provider.toLowerCase() === "one_time_payment") {
    providerColor = "#3b82f6"; // blue
  }

  let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">`;
  html += `<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">`;
  html += `<span style="font-size: 14px; font-weight: 700; background-color: ${providerColor}20; color: ${providerColor}; padding: 6px 12px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em;">💳 ${provider} Request</span>`;
  html += `<span style="font-size: 11px; font-weight: 700; background-color: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px; font-family: monospace;">${refCode}</span>`;
  html += `</div>`;
  
  html += `<table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 15px;">`;
  html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b; width: 150px;">👤 Patient Name</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 600; color: #0f172a;">${patient}</td></tr>`;
  html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">📞 Phone Number</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 600; color: #0f172a; font-family: monospace;">${formatPhoneForCopy(phone)}</td></tr>`;
  html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">📁 File / ID</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 600; color: #0f172a; font-family: monospace;">${fileNum}</td></tr>`;
  html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">🏥 Clinic</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 600; color: #0f172a;">${clinic}</td></tr>`;
  html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">💵 Amount (incl. VAT)</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; font-weight: 700; color: #10b981; font-size: 15px;">${pricing.finalPriceFormatted}</td></tr>`;
  html += `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc; color: #64748b;">📋 Status</td><td style="padding: 10px 0; border-bottom: 1px solid #f8fafc;"><span style="font-size: 11px; font-weight: 800; background-color: ${statusColor}15; color: ${statusColor}; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">● ${workflowStatusLabel}</span></td></tr>`;
  html += `<tr><td style="padding: 10px 0; color: #64748b;">🔗 Payment Link</td><td style="padding: 10px 0;"><a href="${normalizeUrl(paymentLink)}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600; word-break: break-all;">${paymentLink}</a></td></tr>`;
  html += `</table></div>`;

  return { text: textLines, html, attachmentsList };
};
export const getClinicLabel = (val: string) => {
  const mapping: Record<string, string> = {
    dermadent: "Dermadent",
    onetouch_mo3tred: "One Touch AlMutarid",
    onetouch_merkhnya: "One Touch Markhaniya",
    welltouch: "Well Touch",
    beautyvision: "Beauty Vision",
    rose: "Rose",
    sultan: "Sultan",
    nova: "Nova",
    bnayat: "Bnayat",
  };
  return mapping[val] || val;
};

export const generateInquiryCopyText = (inq: any): string => {
  const resolvedRef = formatCaseRef(inq.id, "inq", inq.createdAt, inq.caseRef);
  const infoArray = [
    `📝 Inquiry:`,
    `Ref: ${resolvedRef}`,
    `Clinic: ${getClinicLabel(inq.clinicName)}`,
    `Patient: ${inq.patientName} (${inq.fileNumber})`,
    `Phone: ${normalizePhone(inq.phoneNumber)}`,
    `Status: ${inq.status}`,
    `Details: ${inq.inquiryDetails}`,
  ];
  if (inq.status === 'closed' && inq.assignedSupportAgent) {
    infoArray.push(`Replied by: ${inq.assignedSupportAgent}`);
  }
  return infoArray.join('\n');
};

export const generateTabbyTamaraCopyText = (req: any): string => {
  const resolvedRef = formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef);
  const atts = normalizeAttachments(req.attachments);
  const screenshotLabel = req.screenshotUpload ? "Yes" : "No";
  
  const infoArray = [
    req.requestType === 'tabby' ? `💳 Tabby Request` : `💳 Tamara Request`,
    `Ref: ${resolvedRef}`,
    `Patient: ${req.patientName || 'N/A'}`,
    `File/ID: ${req.idNumber || req.fileNumber || 'N/A'}`,
    `Phone: ${normalizePhone(req.phoneNumber)}`,
    `Amount: ${req.amount}`,
    `Clinic: ${getClinicLabel(req.clinicName)}`,
  ];
  if (req.serviceDetails) infoArray.push(`Details: ${req.serviceDetails}`);
  infoArray.push(`Status: ${req.status}`);
  if (req.tlComment) infoArray.push(`Supervisor Note: ${req.tlComment}`);
  
  infoArray.push(`Attachments: ${atts.length} photos, Screenshot: ${screenshotLabel}`);
  const links = extractLinks(req.links);
  if (links.length > 0) infoArray.push(`Links: ${links.join(', ')}`);

  return infoArray.join('\n');
};

export const generateComplaintCopyText = (comp: any): string => {
  const resolvedRef = formatCaseRef(comp.id, "tt_complaint", comp.createdAt, comp.caseRef);
  const atts = normalizeAttachments(comp.attachments);
  const screenshotLabel = comp.screenshotUpload ? "Yes" : "No";
  
  const infoArray = [
    `🚨 Complaint`,
    `Ref: ${resolvedRef}`,
    `Patient: ${comp.patientName} (${comp.fileNumber})`,
    `Phone: ${normalizePhone(comp.phoneNumber)}`,
    `ID (${comp.idType}): ${comp.idNumber}`,
    `Customer Type: ${comp.customerType || 'N/A'}`,
    `Clinic: ${getClinicLabel(comp.clinicName)}`,
    `Status: ${comp.status}`,
    `Details: ${comp.complaintDetails}`,
  ];
  
  if (comp.tlComment) infoArray.push(`Supervisor Note: ${comp.tlComment}`);
  
  infoArray.push(`Attachments: ${atts.length} photos, Screenshot: ${screenshotLabel}`);
  const links = extractLinks(comp.links);
  if (links.length > 0) infoArray.push(`Links: ${links.join(', ')}`);

  return infoArray.join('\n');
};
