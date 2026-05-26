import { SchedulingRequest, SHIFTS, TEAM_LEADERS, INITIAL_AGENTS, SwapRequest, AnnualRequest, ScheduledShift, AGENT_LOBS, Inquiry, TimeLog, AgentDirectoryRow, TabbyTamaraRequest, TabbyTamaraComplaint, ClientCommunicationRequest, CaseRecord, SystemNotification } from './types';

// Simple client-side storage helpers
import { db } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const LOCAL_ONLY_KEYS = new Set([
  'sched_credentials',
  'sched_current_user',
  'sched_failed_attempts',
  'sched_locked_accounts'
]);

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

    // Authentication/session values must never be mirrored into the cloud.
    if (LOCAL_ONLY_KEYS.has(key)) {
      return;
    }
    
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
