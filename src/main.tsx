import './patch_console';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import React from 'react';
import ErrorBoundary from './ErrorBoundary';

import App from './App.tsx'
;
import './index.css';

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
const CURRENT_APP_VERSION = '1.0.1';
const storedVersion = localStorage.getItem('app_sw_version');

if (storedVersion !== CURRENT_APP_VERSION) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister();
      }
      localStorage.setItem('app_sw_version', CURRENT_APP_VERSION);
    });
  } else {
    localStorage.setItem('app_sw_version', CURRENT_APP_VERSION);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
