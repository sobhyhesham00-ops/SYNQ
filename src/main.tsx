import './patch_console';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args.map(a => {
    try {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.message + ' ' + (a as any).code;
      if (typeof a === 'object' && a !== null) return JSON.stringify(a);
      return String(a);
    } catch {
      return 'Unknown';
    }
  }).join(' ');
  if (msg.includes('Quota exceeded') || msg.includes('resource-exhausted')) return;
  originalConsoleError(...args);
};
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const msg = args.map(a => {
    try {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.message + ' ' + (a as any).code;
      if (typeof a === 'object' && a !== null) return JSON.stringify(a);
      return String(a);
    } catch {
      return 'Unknown';
    }
  }).join(' ');
  if (msg.includes('Using maximum backoff delay')) return;
  originalConsoleWarn(...args);
};
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AppProvider>
  </StrictMode>,
);
