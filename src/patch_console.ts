const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

let lastWebSocketLogTime = 0;
const WEBSOCKET_LOG_INTERVAL = 30000; // allow once every 30 seconds

function isWebSocketMessage(args: any[]): boolean {
  try {
    const msg = args.map(a => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.message + ' ' + (a as any).code;
      if (typeof a === 'object' && a !== null) return JSON.stringify(a);
      return String(a);
    }).join(' ');
    
    return msg.toLowerCase().includes('websocket') || msg.toLowerCase().includes('failed to connect');
  } catch {
    return false;
  }
}

function handleWebSocketConsoleCall(originalFn: (...args: any[]) => void, args: any[]) {
  if (isWebSocketMessage(args)) {
    const now = Date.now();
    if (now - lastWebSocketLogTime > WEBSOCKET_LOG_INTERVAL) {
      lastWebSocketLogTime = now;
      originalFn(...args);
    }
    // otherwise suppress
  } else {
    originalFn(...args);
  }
}

console.error = (...args) => {
  handleWebSocketConsoleCall(originalConsoleError, args);
};

console.warn = (...args) => {
  handleWebSocketConsoleCall(originalConsoleWarn, args);
};

console.log = (...args) => {
  handleWebSocketConsoleCall(originalConsoleLog, args);
};

console.info = (...args) => {
  handleWebSocketConsoleCall(originalConsoleInfo, args);
};
