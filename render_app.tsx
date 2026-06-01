import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App';
import fs from 'fs';

let capturedMsg = '';
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.warn = () => {};

console.error = function(...args) {
  if (typeof args[0] === 'string' && args[0].includes('Received NaN')) {
     capturedMsg = args.join(' ');
  }
};

const lsStore = new Map();
lsStore.set('sched_current_user', JSON.stringify({ name: 'john.doe', role: 'admin', isSuperAdmin: true }));

const ls = { 
  getItem: (k) => lsStore.get(k) || null, 
  setItem: (k,v) => lsStore.set(k,v), 
  removeItem: (k) => lsStore.delete(k) 
};
(global as any).window = { 
  matchMedia: () => ({ matches: false }), 
  document: { referrer: '', documentElement: { getAttribute: () => null } }, 
  navigator: { userAgent: '', standalone: false },
  localStorage: ls,
  location: { pathname: '/', search: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  getComputedStyle: () => ({ direction: 'ltr' })
};
(global as any).document = {
  getElementById: () => null,
  body: { classList: { add: () => {}, remove: () => {} } },
  referrer: '',
  documentElement: { getAttribute: () => null, dir: 'ltr' }
};
(global as any).IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(global, 'navigator', {
  value: { userAgent: '', standalone: false },
  writable: true
});
Object.defineProperty(global, 'localStorage', {
  value: ls,
  writable: true
});

try {
  renderToString(<App />);
  if (capturedMsg) {
      console.log("RAN INTO NAN LOG:\n" + capturedMsg);
  } else {
      console.log("Render completed, no NaN recorded.");
  }
} catch (e) {
  console.log("Render failed:", e.message);
  console.log(e.stack);
}
