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
  if (
    msg.includes('Quota exceeded') || 
    msg.includes('resource-exhausted') || 
    msg.includes('update time that is in the future') ||
    msg.includes('failed to connect to websocket') ||
    msg.includes('WebSocket') ||
    msg.includes('websocket')
  ) return;
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
  if (
    msg.includes('Using maximum backoff delay') || 
    msg.includes('update time that is in the future') ||
    msg.includes('failed to connect to websocket') ||
    msg.includes('WebSocket') ||
    msg.includes('websocket')
  ) return;
  originalConsoleWarn(...args);
};

const originalConsoleLog = console.log;
console.log = (...args) => {
  const msg = args.map(a => {
    try {
      if (typeof a === 'string') return a;
      if (typeof a === 'object' && a !== null) return JSON.stringify(a);
      return String(a);
    } catch { return 'Unknown'; }
  }).join(' ');
  if (msg.includes('WebSocket') || msg.includes('websocket')) return;
  originalConsoleLog(...args);
};

const originalConsoleInfo = console.info;
console.info = (...args) => {
  const msg = args.map(a => {
    try {
      if (typeof a === 'string') return a;
      if (typeof a === 'object' && a !== null) return JSON.stringify(a);
      return String(a);
    } catch { return 'Unknown'; }
  }).join(' ');
  if (msg.includes('WebSocket') || msg.includes('websocket')) return;
  originalConsoleInfo(...args);
};

// Also suppress WebSocket-related global uncaught errors to prevent error overlays or crash logs
window.addEventListener('error', (event) => {
  if (event && event.message && (
    event.message.includes('WebSocket') || 
    event.message.includes('websocket') || 
    event.message.includes('failed to connect')
  )) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  if (event && event.reason) {
    const reasonStr = String(event.reason);
    if (reasonStr.includes('WebSocket') || reasonStr.includes('websocket') || reasonStr.includes('failed to connect')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}, true);

