import { env } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function activeLevel(): number {
  const configured = env.logLevel.toLowerCase();
  if (configured in LEVEL_ORDER) {
    return LEVEL_ORDER[configured as LogLevel];
  }
  return LEVEL_ORDER.info;
}

function write(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < activeLevel()) {
    return;
  }

  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...fields,
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug(message: string, fields?: Record<string, unknown>): void {
    write('debug', message, fields);
  },
  info(message: string, fields?: Record<string, unknown>): void {
    write('info', message, fields);
  },
  warn(message: string, fields?: Record<string, unknown>): void {
    write('warn', message, fields);
  },
  error(message: string, fields?: Record<string, unknown>): void {
    write('error', message, fields);
  },
};
