import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RealtimeClient } from '../lib/realtimeClient';

const clientBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
const realtimeClient = new RealtimeClient(clientBaseUrl);

export function useAppContext() {
  const { state, dispatch, addSchedule, updateSchedule, deleteSchedule, addNotification, clearError } = useApp();

  // Fetch initial schedules
  useEffect(() => {
    let active = true;
    async function fetchSchedules() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const res = await fetch('/api/schedules');
        if (!res.ok) throw new Error('Failed to fetch schedules');
        const data = await res.json();
        if (active && data.schedules) {
          dispatch({ type: 'SET_SCHEDULES', payload: data.schedules });
          dispatch({ type: 'SET_LAST_SYNC', payload: Date.now() });
          dispatch({ type: 'SET_SYNC_STATUS', payload: 'success' });
        }
      } catch (err: any) {
        if (active) {
          dispatch({ type: 'SET_ERROR', payload: err.message || 'Error occurred fetching data' });
          dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
        }
      } finally {
        if (active) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    }

    fetchSchedules();

    return () => {
      active = false;
    };
  }, [dispatch]);

  // Subscribe to realtime modifications
  useEffect(() => {
    realtimeClient.connect();

    const handleChange = (change: any) => {
      if (change.type === 'schedule') {
        if (change.action === 'create') {
          addSchedule(change.data);
          addNotification({
            message: `New schedule created for ${change.data.agentName}`,
            type: 'success'
          });
        } else if (change.action === 'update') {
          updateSchedule(change.data);
          addNotification({
            message: `Schedule updated for ${change.data.agentName}`,
            type: 'info'
          });
        } else if (change.action === 'delete') {
          deleteSchedule(change.data.id);
          addNotification({
            message: `Schedule removed`,
            type: 'warning'
          });
        }
      }
    };

    realtimeClient.subscribe(handleChange);

    return () => {
      realtimeClient.unsubscribe(handleChange);
      realtimeClient.disconnect();
    };
  }, [addSchedule, updateSchedule, deleteSchedule, addNotification]);

  return {
    state,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    addNotification,
    clearError
  };
}
export default useAppContext;
