import fs from 'fs';
import path from 'path';

// Create logs directory synchronously if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (e) {
  console.error("Failed to create log directory", e);
}

const getLogFilePath = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `app-${date}.log`);
};

export const logger = {
  info: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    let logLine = `[${timestamp}] [INFO] [${context}] ${message}`;
    if (data !== undefined) {
      logLine += ` ${typeof data === 'object' ? JSON.stringify(data) : data}`;
    }
    console.log(logLine);
    try {
      fs.appendFileSync(getLogFilePath(), logLine + '\n');
    } catch (e) {
      // Ignore
    }
  },
  error: (context: string, message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const stack = error?.stack ? '\n' + error.stack : '';
    let logLine = `[${timestamp}] [ERROR] [${context}] ${message}${stack}`;
    if (error && !error.stack) {
      logLine += ` ${typeof error === 'object' ? JSON.stringify(error) : error}`;
    }
    console.error(logLine);
    try {
      fs.appendFileSync(getLogFilePath(), logLine + '\n');
    } catch (e) {
      // Ignore
    }
  },
  warn: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    let logLine = `[${timestamp}] [WARN] [${context}] ${message}`;
    if (data !== undefined) {
      logLine += ` ${typeof data === 'object' ? JSON.stringify(data) : data}`;
    }
    console.warn(logLine);
    try {
      fs.appendFileSync(getLogFilePath(), logLine + '\n');
    } catch (e) {
      // Ignore
    }
  },
  debug: (context: string, message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      let logLine = `[${timestamp}] [DEBUG] [${context}] ${message}`;
      if (data !== undefined) {
        logLine += ` ${typeof data === 'object' ? JSON.stringify(data) : data}`;
      }
      console.log(logLine);
      try {
        fs.appendFileSync(getLogFilePath(), logLine + '\n');
      } catch (e) {
        // Ignore
      }
    }
  }
};
