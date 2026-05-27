import fs from 'fs';
import path from 'path';

// Create logs directory synchronously if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (e) {
  console.warn("Failed to create log directory (might be a read-only filesystem)", e);
}

// Generate today's log file
const getLogFilePath = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `app-${date}.log`);
};

type LogLevel = 'INFO' | 'WARN' | 'ERROR';
type LogContext = 'API' | 'AI' | 'ERROR' | 'STARTUP' | 'SYSTEM';

function writeLog(level: LogLevel, context: LogContext, message: string, error?: unknown) {
  const timestamp = new Date().toISOString();
  let logLine = `[${timestamp}] [${level}] [${context}] ${message}`;
  
  if (error) {
    if (error instanceof Error) {
      logLine += `\n${error.stack}`;
    } else {
      logLine += `\n${JSON.stringify(error)}`;
    }
  }

  // Console output
  if (level === 'ERROR') {
    console.error(logLine);
  } else if (level === 'WARN') {
    console.warn(logLine);
  } else {
    console.log(logLine);
  }

  // File output
  try {
    fs.appendFileSync(getLogFilePath(), logLine + '\n');
  } catch (e) {
    console.error("Failed to write to log file", e);
  }
}

export const logger = {
  info: (context: LogContext, message: string) => writeLog('INFO', context, message),
  warn: (context: LogContext, message: string) => writeLog('WARN', context, message),
  error: (context: LogContext, message: string, err?: unknown) => writeLog('ERROR', context, message, err),
};
