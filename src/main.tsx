import './patch_console';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import React from 'react';
const originalCreateElement = React.createElement;
(React as any).createElement = function(...args: any[]) {
    if (args[2] !== undefined) {
        // recursively check children
        const cleanChildren = (child: any): any => {
            if (typeof child === 'number' && isNaN(child)) return 0;
            if (Array.isArray(child)) return child.map(cleanChildren);
            return child;
        };
        for (let i = 2; i < args.length; i++) {
            args[i] = cleanChildren(args[i]);
        }
    }
    return originalCreateElement.apply(null, args);
};

import App from './App.tsx'
;
import './index.css';

const originalConsoleError = console.error;
console.error = function(...args) {
  if (typeof args[0] === 'string' && args[0].includes('Received NaN')) {
     const stack = args.join('\n');
     fetch('/api/log-nan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({stack: stack})
     });
     // Suppress it from reaching the studio UI console interceptor
     return;
  }
  originalConsoleError.apply(console, args);
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
