// ─── next-log/src/core/logger.ts ─────────────────────────────────────────────

import { isLevelEnabled, type LogLevel } from './level'
import { getContext } from './context'
import type { LogEntry, LoggerConfig, Transport, Formatter } from './types'

declare const EdgeRuntime: string | undefined


function detectEnv(): LogEntry['env'] {
  if (typeof window !== 'undefined') return 'client'
  if (typeof EdgeRuntime !== 'undefined') return 'edge'
  return 'server'
}


export class Logger {
  private readonly minLevel: LogLevel
  private readonly defaultMeta: Record<string, unknown>
  private readonly childMeta: Record<string, unknown>
  private transports: Transport[] = []
  private formatter: Formatter | null = null

  constructor(
    config: LoggerConfig = {},
    childMeta: Record<string, unknown> = {}
  ) {
    this.minLevel   = config.level ?? 'info'
    this.defaultMeta = config.defaultMeta ?? {}
    this.childMeta  = childMeta
  }

  // ── Transport & Formatter qeydiyyatı ───────────────────────────────────────

  addTransport(transport: Transport): this {
    this.transports.push(transport)
    return this
  }

  setFormatter(formatter: Formatter): this {
    this.formatter = formatter
    return this
  }

  // ── Log entry yarat ────────────────────────────────────────────────────────

  private buildEntry(
    level: LogLevel,
    msg: string,
    fields: Record<string, unknown>
  ): LogEntry {
    const ctx = getContext()

    return {
      timestamp: new Date().toISOString(),
      level,
      msg,
      env: detectEnv(),
      ...this.defaultMeta,
      ...this.childMeta,
      ...ctx,
      ...fields,
    }
  }


  private write(entry: LogEntry): void {
    if (!isLevelEnabled(entry.level, this.minLevel)) return
    if (this.transports.length === 0) {
      const line = this.formatter
        ? this.formatter.format(entry)
        : JSON.stringify(entry)
      console.log(line)
      return
    }
    for (const t of this.transports) {
      t.write(entry)
    }
  }

  // ── Public log metodları ──────────────────────────────────────────────────

  debug(msg: string, fields: Record<string, unknown> = {}): void {
    this.write(this.buildEntry('debug', msg, fields))
  }

  info(msg: string, fields: Record<string, unknown> = {}): void {
    this.write(this.buildEntry('info', msg, fields))
  }

  warn(msg: string, fields: Record<string, unknown> = {}): void {
    this.write(this.buildEntry('warn', msg, fields))
  }

  error(msg: string, fields: Record<string, unknown> = {}): void {
    this.write(this.buildEntry('error', msg, fields))
  }

  // ── Child logger — scoped context ─────────────────────────────────────────

  child(meta: Record<string, unknown>): Logger {
    const child = new Logger(
      { level: this.minLevel, defaultMeta: this.defaultMeta },
      { ...this.childMeta, ...meta }
    )
    // transport və formatter-i paylaş
    child.transports = this.transports
    child.formatter  = this.formatter
    return child
  }
}