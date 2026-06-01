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
  if (msg.includes('Quota exceeded') || msg.includes('resource-exhausted') || msg.includes('update time that is in the future')) return;
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
  if (msg.includes('Using maximum backoff delay') || msg.includes('update time that is in the future')) return;
  originalConsoleWarn(...args);
};
