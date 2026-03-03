// ─── next-log/src/formatters/json.ts ─────────────────────────────────────────
import type { Formatter } from '../core/types'
import type { LogEntry } from '../core/types'

export class JsonFormatter implements Formatter {
  format(entry: LogEntry): string {
    return JSON.stringify(entry)
  }
}