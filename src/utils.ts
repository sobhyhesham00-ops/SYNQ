    
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
    const username = getUsernameFromFullName(refName);
    const compactName = refName.toLowerCase().replace(/\s+/g, '');
    const normalName = refName.toLowerCase();
    
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
