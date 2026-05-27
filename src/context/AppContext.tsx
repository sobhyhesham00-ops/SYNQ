import React, { createContext, useReducer, useContext, ReactNode, useMemo } from 'react';

export interface ISchedule {
  id: string;
  date: string;
  agentName: string;
  shiftLabel: string;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
}

export interface INotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
}

export interface AppState {
  schedules: ISchedule[];
  loading: boolean;
  error: string | null;
  lastSync: number;
  notifications: INotification[];
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SCHEDULES'; payload: ISchedule[] }
  | { type: 'ADD_SCHEDULE'; payload: ISchedule }
  | { type: 'UPDATE_SCHEDULE'; payload: ISchedule }
  | { type: 'DELETE_SCHEDULE'; payload: string }
  | { type: 'SET_LAST_SYNC'; payload: number }
  | { type: 'ADD_NOTIFICATION'; payload: INotification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_SYNC_STATUS'; payload: 'idle' | 'syncing' | 'success' | 'error' };

const initialState: AppState = {
  schedules: [],
  loading: false,
  error: null,
  lastSync: 0,
  notifications: [],
  syncStatus: 'idle'
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload };
    case 'ADD_SCHEDULE':
      return { ...state, schedules: [action.payload, ...state.schedules] };
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map(s => (s.id === action.payload.id ? action.payload : s))
      };
    case 'DELETE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.filter(s => s.id !== action.payload)
      };
    case 'SET_LAST_SYNC':
      return { ...state, lastSync: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addSchedule: (schedule: ISchedule) => void;
  updateSchedule: (schedule: ISchedule) => void;
  deleteSchedule: (id: string) => void;
  addNotification: (notification: Omit<INotification, 'id' | 'timestamp'>) => void;
  clearError: () => void;
} | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const helpers = useMemo(() => {
    return {
      addSchedule: (schedule: ISchedule) => {
        dispatch({ type: 'ADD_SCHEDULE', payload: schedule });
      },
      updateSchedule: (schedule: ISchedule) => {
        dispatch({ type: 'UPDATE_SCHEDULE', payload: schedule });
      },
      deleteSchedule: (id: string) => {
        dispatch({ type: 'DELETE_SCHEDULE', payload: id });
      },
      addNotification: (notification: Omit<INotification, 'id' | 'timestamp'>) => {
        const newNotif: INotification = {
          ...notification,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now()
        };
        dispatch({ type: 'ADD_NOTIFICATION', payload: newNotif });
      },
      clearError: () => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }
    };
  }, []);

  const value = useMemo(() => {
    return {
      state,
      dispatch,
      ...helpers
    };
  }, [state, helpers]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
