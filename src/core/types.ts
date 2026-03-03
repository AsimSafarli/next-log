// ─── next-log/src/core/types.ts ───────────────────────────────────────────────

import type { LogLevel } from './level'

export interface LogEntry {
  timestamp: string        // ISO 8601
  level: LogLevel
  msg: string
  env: 'server' | 'client' | 'edge'
  requestId?: string
  traceId?: string
  module?: string
  [key: string]: unknown  
}

export interface LoggerConfig {
  level?: LogLevel
  defaultMeta?: Record<string, unknown>
}

export interface Transport {
  write(entry: LogEntry): void | Promise<void>
}

export interface Formatter {
  format(entry: LogEntry): string
}