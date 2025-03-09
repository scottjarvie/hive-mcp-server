// Logging utility for consistent logging
// Avoids using console.log/console.error as per requirements

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[currentLevel];
}

function formatLog(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
}

export function debug(message: string): void {
  if (shouldLog('debug')) {
    process.stderr.write(formatLog('debug', message));
  }
}

export function info(message: string): void {
  if (shouldLog('info')) {
    process.stderr.write(formatLog('info', message));
  }
}

export function warn(message: string): void {
  if (shouldLog('warn')) {
    process.stderr.write(formatLog('warn', message));
  }
}

export function error(message: string): void {
  if (shouldLog('error')) {
    process.stderr.write(formatLog('error', message));
  }
}

export default {
  debug,
  info,
  warn,
  error,
  setLogLevel,
};
