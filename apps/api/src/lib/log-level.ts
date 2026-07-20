const LOG_LEVELS = ['silent', 'error', 'warn', 'info', 'debug', 'trace'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const DISABLED_LEVELS = new Set<LogLevel>(['silent']);

export function parseLogLevel(value: string | undefined): LogLevel {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return 'info';
  }

  if (LOG_LEVELS.includes(normalized as LogLevel)) {
    return normalized as LogLevel;
  }

  return 'info';
}

export function isRequestLoggingEnabled(level: LogLevel): boolean {
  return !DISABLED_LEVELS.has(level);
}
