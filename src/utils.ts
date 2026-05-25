import { SchedulingRequest, SHIFTS, TEAM_LEADERS, INITIAL_AGENTS, SwapRequest, AnnualRequest, ScheduledShift, AGENT_LOBS, Inquiry, TimeLog, AgentDirectoryRow, TabbyTamaraRequest, TabbyTamaraComplaint, ClientCommunicationRequest, CaseRecord, SystemNotification } from './types';

// Simple client-side storage helpers
import { db } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

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

export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    const oldStr = localStorage.getItem(key);
    const oldValue = oldStr ? JSON.parse(oldStr) : undefined;
    
    localStorage.setItem(key, JSON.stringify(value));
    
    // Asynchronous mirror to Firestore (non-blocking, item-level delta sync)
    if (key.startsWith('sched_')) {
      const colName = getCollectionName(key);
      
      // If this matches a supported collection and is an array of objects
      if (colName && Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object' && 'id' in value[0]) {
           const oldMap = new Map();
           if (Array.isArray(oldValue)) {
               oldValue.forEach(item => { if (item && typeof item === 'object' && item.id) oldMap.set(item.id, item); });
           }
           
           value.forEach(item => {
               if (item && typeof item === 'object' && item.id) {
                   const oldItem = oldMap.get(item.id);
                   if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
                       const cleanItem = JSON.parse(JSON.stringify(item));
                       setDoc(doc(db, colName, item.id), cleanItem).catch(err => console.error("Firestore sync error:", err));
                   }
                   oldMap.delete(item.id);
               }
           });
           
           // Any items remaining in the local old array were deleted!
           oldMap.forEach(item => {
               deleteDoc(doc(db, colName, item.id)).catch(err => console.error("Firestore delete error:", err));
           });
           
        } else if (value.length === 0 && Array.isArray(oldValue)) {
           // Array was explicitly cleared (Factory Reset)
           oldValue.forEach(item => {
               if (item && typeof item === 'object' && item.id) {
                   deleteDoc(doc(db, colName, item.id)).catch(err => console.error("Firestore delete error:", err));
               }
           });
        }
      } else {
        // Fallback for settings or config (e.g. system/sched_support_assignments)
        const cleanValue = JSON.parse(JSON.stringify(value));
        setDoc(doc(db, "system", key), { data: cleanValue }).catch(err => {
          console.error("Firestore sync error for " + key, err);
        });
      }
    }
  } catch (e) {
    console.error(`Error writing key ${key} to storage`, e);
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
  const matched = referenceList.find(ref => ref.toLowerCase() === cap.toLowerCase());
  return matched || cap;
};

// Convert full name (e.g., Hesham Sobhy) to username (e.g., h.sobhy)
export const getUsernameFromFullName = (fullName: string): string => {
  if (!fullName) return '';
  const val = fullName.trim().toLowerCase();
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
  const target = username.trim().toLowerCase();
  
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
    return getUsernameFromFullName(refName) === target;
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
  const overrideKey = Object.keys(meta).find(k => k.trim().toLowerCase().replace(/\s+/g, ' ') === normalized.toLowerCase());
  if (overrideKey && meta[overrideKey].roleType) {
    const role = meta[overrideKey].roleType.toLowerCase();
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
  if (TEAM_LEADERS.some(tl => tl.toLowerCase() === normalized.toLowerCase())) return true;
  if (normalized.toLowerCase() === 'hesso') return true;
  
  const meta = getAgentMeta();
  const overrideKey = Object.keys(meta).find(k => k.trim().toLowerCase().replace(/\s+/g, ' ') === normalized.toLowerCase());
  if (overrideKey && meta[overrideKey].roleType) {
    const role = meta[overrideKey].roleType.toLowerCase();
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
  if (normalized.toLowerCase() === 'amira hassan') {
    return 'Amira Hassan 👑';
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
  const cleanName = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
  
  const meta = getAgentMeta();
  const overrideKey = Object.keys(meta).find(k => k.trim().toLowerCase().replace(/\s+/g, ' ') === cleanName);
  if (overrideKey && meta[overrideKey].roleType) {
    return meta[overrideKey].roleType;
  }

  const matchedKey = Object.keys(AGENT_LOBS).find(
    key => key.trim().toLowerCase().replace(/\s+/g, ' ') === cleanName
  );
  
  return matchedKey ? AGENT_LOBS[matchedKey] : 'General';
};

export const getAgentTL = (name: string): string => {
  if (!name) return 'Unassigned';
  const fullName = findAgentByUsername(name) || name;
  const cleanName = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
  
  const meta = getAgentMeta();
  const overrideKey = Object.keys(meta).find(k => k.trim().toLowerCase().replace(/\s+/g, ' ') === cleanName);
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
        lines.push(`   ⚠️ Violation: ${r.violationMessage || 'Notice interval violation'}`);
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

  if (!csvContent || !csvContent.trim()) {
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
        row.push(curVal.trim().replace(/^["']|["']$/g, ''));
        curVal = '';
      } else {
        curVal += char;
      }
    }
    row.push(curVal.trim().replace(/^["']|["']$/g, ''));
    return row;
  };

  const allLines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
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
      const l = h.toLowerCase().trim();
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
          const l = h.toLowerCase().trim();
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
    const nameLower = rawName.toLowerCase().trim();
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

// Robust CSV Parser for schedules
export const parseScheduleCSV = (
  csvContent: string,
  existingAgents: string[]
): { schedules: ScheduledShift[]; errors: string[]; parsedCount: number; newAgents: string[]; parsedMeta: Record<string, { tlName?: string }> } => {
  const schedules: ScheduledShift[] = [];
  const errors: string[] = [];
  const newAgentsSet = new Set<string>();
  const parsedMeta: Record<string, { tlName?: string }> = {};

  if (!csvContent || !csvContent.trim()) {
    return { schedules: [], errors: ['CSV content is empty.'], parsedCount: 0, newAgents: [], parsedMeta: {} };
  }

  // Helper row tokenizer respecting quotes
  const getCSVRows = (csvText: string): string[][] => {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    return lines.map(lineStr => {
      const row: string[] = [];
      let curVal = '';
      let inQuotes = false;
      for (let i = 0; i < lineStr.length; i++) {
        const char = lineStr[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(curVal.trim().replace(/^["']|["']$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      row.push(curVal.trim().replace(/^["']|["']$/g, ''));
      return row;
    });
  };

  const mapShiftLabel = (rawShiftStr: string): string => {
    const norm = rawShiftStr.trim().toLowerCase();
    if (!norm || norm === 'off' || norm === 'r' || norm === 'o' || norm === 'rest' || norm.includes('leave') || norm.includes('vacation')) {
      return 'Off';
    }
    if (norm === 'm' || norm.includes('morning') || norm.includes('7am') || norm.includes('07:00') || norm.includes('7:00')) {
      return '07:00 - 16:00';
    }
    if (norm === 'a' || norm.includes('afternoon') || norm.includes('1pm') || norm.includes('13:00') || norm.includes('1:00 pm')) {
      return '13:00 - 22:00';
    }
    if (norm === 'n' || norm.includes('night') || norm.includes('10pm') || norm.includes('22:00') || norm.includes('10:00 pm')) {
      return '22:00 - 07:00';
    }
    
    // Exact match lookup in SHIFTS
    const matchedShift = SHIFTS.find(s => s.label === rawShiftStr || s.display === rawShiftStr);
    if (matchedShift) return matchedShift.label;
    
    return '07:00 - 16:00'; // Default fallback
  };

  const parsedRows = getCSVRows(csvContent);
  if (parsedRows.length <= 1) {
    return { schedules: [], errors: ['No data rows found in CSV.'], parsedCount: 0, newAgents: [], parsedMeta: {} };
  }

  // Pre-load current year and month in case naked numbers are used for date headers (Day 1 - 31)
  let detectedYear = new Date().getFullYear();
  let detectedMonth = new Date().getMonth(); // 0-indexed (0 = Jan, 4 = May...)

  const csvLower = csvContent.toLowerCase();
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june', 
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const shortMonths = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  
  // Try to find the month in the FIRST few lines specifically if possible, 
  // or use the first occurrence found in the entire file.
  const firstFewLines = csvLower.split('\n').slice(0, 10).join('\n');
  let foundMonth = false;
  for (let i = 0; i < 12; i++) {
    if (firstFewLines.includes(months[i]) || firstFewLines.includes(shortMonths[i])) {
      detectedMonth = i;
      foundMonth = true;
      break;
    }
  }
  if (!foundMonth) {
    for (let i = 0; i < 12; i++) {
      if (csvLower.includes(months[i])) {
        detectedMonth = i;
        foundMonth = true;
        break;
      }
    }
  }

  // Smart adjustment: If today is late in the month (e.g. after 20th) 
  // and we haven't explicitly found a month name, 
  // and the CSV seems to contain days 1-7, 
  // it might be a schedule for the NEXT month.
  if (!foundMonth && new Date().getDate() > 20) {
    // If we see headers 1-7 but and no month name, could be next month
    const hasEarlyDays = csvContent.includes(',1,') || csvContent.includes(',01,') || csvContent.startsWith('1,') || csvContent.startsWith('01,');
    if (hasEarlyDays) {
      detectedMonth = (new Date().getMonth() + 1) % 12;
      if (detectedMonth === 0) detectedYear++;
    }
  }

  const yearMatch = csvContent.match(/\b(202\d)\b/);
  if (yearMatch) {
    detectedYear = parseInt(yearMatch[1], 10);
  }

  // Identify header row dynamically
  let headerIdx = 0;
  let dateColumnsCount = 0;
  const dateColMapping = new Map<number, string>(); // index => formatted date space (YYYY-MM-DD)

  // Try to find the best header row (the one with the most dates or a 'name' field)
  for (let i = 0; i < Math.min(parsedRows.length, 20); i++) {
    const row = parsedRows[i];
    let tempDatesCount = 0;
    const tempMapping = new Map<number, string>();

    row.forEach((h, colIdx) => {
      const cleanH = h.trim().toLowerCase().replace(/["']/g, '');
      if (!cleanH) return;

      // Check for dates in headers
      const dObj = new Date(cleanH);
      if (!isNaN(dObj.getTime()) && cleanH.length > 3) {
        tempDatesCount++;
        const offset = dObj.getTimezoneOffset();
        const localDate = new Date(dObj.getTime() - (offset * 60 * 1000));
        tempMapping.set(colIdx, localDate.toISOString().split('T')[0]);
      } else if (/^\d+$/.test(cleanH)) {
        const num = parseInt(cleanH, 10);
        if (num >= 1 && num <= 31) {
          tempDatesCount++;
          const formattedDate = `${detectedYear}-${(detectedMonth + 1).toString().padStart(2, '0')}-${num.toString().padStart(2, '0')}`;
          tempMapping.set(colIdx, formattedDate);
        }
      }
    });

    const hasName = row.some(h => {
      const l = h.toLowerCase();
      return l === 'agent' || l === 'name' || l.includes('agent name') || l === 'who' || l === 'employee';
    });

    if (tempDatesCount >= 3 || (hasName && tempDatesCount >= 1)) {
      headerIdx = i;
      dateColumnsCount = tempDatesCount;
      // Copy temp mapping to real mapping
      tempMapping.forEach((v, k) => dateColMapping.set(k, v));
      break;
    }
  }

  const rawHeaders = parsedRows[headerIdx].map(h => h.trim().toLowerCase().replace(/["']/g, ''));

  // Decide parser route based on Matrix or Vertical style
  if (dateColumnsCount >= 3) {
    // ----------------------------------------
    // ROUTE A: HORIZONTAL MATRIX LAYOUT
    // ----------------------------------------
    let nameColIdx = rawHeaders.findIndex(h => h.includes('agent') || h.includes('name') || h === 'who' || h.includes('employee'));
    if (nameColIdx === -1) nameColIdx = 0;

    for (let idx = headerIdx + 1; idx < parsedRows.length; idx++) {
      const row = parsedRows[idx];
      if (row.length === 0 || row.every(c => !c)) continue;

      let rawName = row[nameColIdx] || '';
      if (!rawName || rawName.toLowerCase().includes('total') || rawName.toLowerCase().includes('count')) continue;

      // Extract TL names inside brackets, if any
      const tlMatch = rawName.match(/\((.*?)\)/);
      let extractedTL = '';
      if (tlMatch) {
        extractedTL = tlMatch[1].trim();
        rawName = rawName.replace(/\(.*?\)/g, '').trim();
      }

      const agentNameCapitalized = capitalizeName(rawName);
      
      let agentName = agentNameCapitalized;
      const matchedAgent = existingAgents.find(a => a.toLowerCase() === agentNameCapitalized.toLowerCase());
      if (matchedAgent) {
        agentName = matchedAgent;
      }

      if (extractedTL) {
        parsedMeta[agentName] = { tlName: extractedTL };
      }

      // Map each marked date column
      dateColMapping.forEach((formattedDate, colIdx) => {
        const cellValue = row[colIdx] || '';
        const shiftLabel = mapShiftLabel(cellValue);

        // Record work shift (ignore or skip 'Off' and blank elements to keep database light)
        if (shiftLabel && shiftLabel !== 'Off') {
          const isExisting = existingAgents.some(a => a.toLowerCase() === agentName.toLowerCase());
          if (!isExisting) {
            newAgentsSet.add(agentName);
          }

          schedules.push({
            id: `sch_up_${Date.now()}_mat_${idx}_${colIdx}`,
            agentName,
            date: formattedDate,
            shiftLabel
          });
        }
      });
    }
  } else {
    // ----------------------------------------
    // ROUTE B: VERTICAL LIST/TABLE LAYOUT (Original fallback)
    // ----------------------------------------
    let nameIdx = rawHeaders.findIndex(h => h.includes('agent') || h.includes('name') || h === 'who' || h.includes('employee'));
    let dateIdx = rawHeaders.findIndex(h => h.includes('date') || h === 'day');
    let shiftIdx = rawHeaders.findIndex(h => h.includes('shift') || h.includes('hours') || h === 'time');
    let notesIdx = rawHeaders.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('desc') || h.includes('remark') || h.includes('info'));

    if (nameIdx === -1) nameIdx = 0;
    if (dateIdx === -1) dateIdx = 1;
    if (shiftIdx === -1) shiftIdx = 2;

    for (let idx = headerIdx + 1; idx < parsedRows.length; idx++) {
      const row = parsedRows[idx];
      if (row.length === 0 || row.every(c => !c)) continue;

      let rawName = row[nameIdx] || '';
      if (!rawName || rawName.toLowerCase().includes('total') || rawName.toLowerCase().includes('count')) continue;
      const tlMatch = rawName.match(/\((.*?)\)/);
      let extractedTL = '';
      if (tlMatch) {
        extractedTL = tlMatch[1].trim();
        rawName = rawName.replace(/\(.*?\)/g, '').trim();
      }

      const rawDate = row[dateIdx] || '';
      const rawShift = row[shiftIdx] || '';

      if (!rawName || !rawDate) {
        errors.push(`Row ${idx + 1}: Missing Agent Name or Date.`);
        continue;
      }

      const agentNameCapitalized = capitalizeName(rawName);
      
      let agentName = agentNameCapitalized;
      const matchedAgent = existingAgents.find(a => a.toLowerCase() === agentNameCapitalized.toLowerCase());
      if (matchedAgent) {
        agentName = matchedAgent;
      }

      if (extractedTL) {
        parsedMeta[agentName] = { tlName: extractedTL };
      }

      // Format Date string
      let formattedDate = '';
      
      // Robust date parsing for strings like DD/MM/YYYY or YYYY-MM-DD
      const yymmdd = rawDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (yymmdd) {
        formattedDate = `${yymmdd[1]}-${yymmdd[2].padStart(2, '0')}-${yymmdd[3].padStart(2, '0')}`;
      } else {
        const ddmmyy = rawDate.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
        if (ddmmyy) {
           const d1 = parseInt(ddmmyy[1], 10);
           const d2 = parseInt(ddmmyy[2], 10);
           const year = ddmmyy[3].length === 2 ? `20${ddmmyy[3]}` : ddmmyy[3];
           
           // Ambiguity check: if d1 > 12, it's definitely DD/MM
           if (d1 > 12) {
             formattedDate = `${year}-${ddmmyy[2].padStart(2, '0')}-${ddmmyy[1].padStart(2, '0')}`;
           } else if (d2 > 12) {
             // If d2 > 12, it's definitely MM/DD
             formattedDate = `${year}-${ddmmyy[1].padStart(2, '0')}-${ddmmyy[2].padStart(2, '0')}`;
           } else {
             // Fallback to MM/DD as default but maybe check detectedMonth?
             // Actually, if we are in Egypt/Middle East, DD/MM is more common.
             // Let's use the current detected month if one of them matches.
             if (d2 === detectedMonth + 1) {
                formattedDate = `${year}-${ddmmyy[2].padStart(2, '0')}-${ddmmyy[1].padStart(2, '0')}`;
             } else {
                formattedDate = `${year}-${ddmmyy[1].padStart(2, '0')}-${ddmmyy[2].padStart(2, '0')}`;
             }
           }
        } else {
          const dateObj = new Date(rawDate);
          if (!isNaN(dateObj.getTime())) {
            const offset = dateObj.getTimezoneOffset();
            const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
            formattedDate = localDate.toISOString().split('T')[0];
          }
        }
      }

      if (!formattedDate) {
        errors.push(`Row ${idx + 1}: Invalid date format "${rawDate}". Use YYYY-MM-DD.`);
        continue;
      }

      const shiftLabel = mapShiftLabel(rawShift);
      const shiftNotes = notesIdx !== -1 ? (row[notesIdx] || '').trim() : '';

      if (shiftLabel && shiftLabel !== 'Off') {
        const isExisting = existingAgents.some(a => a.toLowerCase() === agentName.toLowerCase());
        if (!isExisting) {
          newAgentsSet.add(agentName);
        }

        schedules.push({
          id: `sch_up_${Date.now()}_vert_${idx}`,
          agentName,
          date: formattedDate,
          shiftLabel,
          ...(shiftNotes ? { shiftNotes } : {})
        });
      }
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

// Generate CSV report for Inquiries
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
    'Price Without Tax',
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

  const rows = requests.map(r => [
    r.id,
    `"${(r.agentName || '').replace(/"/g, '""')}"`,
    `"${(r.patientName || '').replace(/"/g, '""')}"`,
    `"${(r.fileNumber || '').replace(/"/g, '""')}"`,
    r.isOldCustomer ? 'YES' : 'NO',
    `"${(r.idNumber || '').replace(/"/g, '""')}"`,
    `"${(r.priceWithoutTax || '').replace(/"/g, '""')}"`,
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
  ]);

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

