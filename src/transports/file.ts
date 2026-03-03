// ─── next-log/src/transports/file.ts ─────────────────────────────────────────
//
// ⚠️  Yalnız server mühitində işləyir (node:fs lazımdır).
//     Client və edge-də istifadə etmə.

import type { Transport } from '../core/types'
import type { LogEntry } from '../core/types'
import type { Formatter } from '../core/types'
import { JsonFormatter } from '../formatters/json'
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

interface FileTransportConfig {
  /** Log faylının yolu. Default: 'logs/app.log' */
  path?: string
  /** Formatter. Default: JsonFormatter */
  formatter?: Formatter
}

export class FileTransport implements Transport {
  private readonly path: string
  private readonly formatter: Formatter
  private initialized = false

  constructor(config: FileTransportConfig = {}) {
    this.path      = config.path      ?? 'logs/app.log'
    this.formatter = config.formatter ?? new JsonFormatter()
  }

  private ensureDir(): void {
    if (this.initialized) return
    mkdirSync(dirname(this.path), { recursive: true })
    this.initialized = true
  }

  write(entry: LogEntry): void {
    try {
      this.ensureDir()
      const line = this.formatter.format(entry) + '\n'
      appendFileSync(this.path, line, 'utf8')
    } catch (err) {
      // File transport xətası digər log-ları bloklamamalıdır
      console.error('[next-log] FileTransport write error:', err)
    }
  }
}