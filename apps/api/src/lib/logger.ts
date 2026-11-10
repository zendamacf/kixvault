import { inspect } from 'node:util';
import { redactSecrets } from './redact';

type LogMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

function format(arg: unknown): string {
  return typeof arg === 'string' ? arg : inspect(arg, { depth: 6 });
}

function write(method: LogMethod, args: unknown[]): void {
  // Central safety net: no log line may contain a configured secret. Errors and objects are
  // formatted first so stacks, causes and nested fields are covered too.
  // The console method is looked up per call so it can still be spied on in tests.
  console[method](redactSecrets(args.map(format).join(' ')));
}

/** Use instead of `console.*`: every line is passed through secret redaction. */
export const logger = {
  log: (...args: unknown[]) => write('log', args),
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
  debug: (...args: unknown[]) => write('debug', args),
};
