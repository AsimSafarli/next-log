// ─── next-log/src/transports/console.ts ──────────────────────────────────────
import type { Transport } from '../core/types'
import type { LogEntry } from '../core/types'
import type { Formatter } from '../core/types'
import { JsonFormatter } from '../formatters/json'

export class ConsoleTransport implements Transport {
  private formatter: Formatter

  constructor(formatter?: Formatter) {
    this.formatter = formatter ?? new JsonFormatter()
  }

  write(entry: LogEntry): void {
    const line = this.formatter.format(entry)

    switch (entry.level) {
      case 'debug': console.debug(line); break
      case 'info':  console.info(line);  break
      case 'warn':  console.warn(line);  break
      case 'error': console.error(line); break
    }
  }
}