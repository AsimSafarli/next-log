// ─── next-log/src/transports/file.ts ─────────────────────────────────────────
//
// ⚠️  Server-only. node:fs lazımdır.
//     fs dynamic olaraq yüklənir — client bundle-a daxil olmur.

import type { Transport } from '../core/types'
import type { LogEntry } from '../core/types'
import type { Formatter } from '../core/types'
import { JsonFormatter } from '../formatters/json'

interface FileTransportConfig {
  path?: string
  formatter?: Formatter
}

export class FileTransport implements Transport {
  private readonly filePath: string
  private readonly formatter: Formatter
  private initialized = false

  constructor(config: FileTransportConfig = {}) {
    this.filePath  = config.path      ?? 'logs/app.log'
    this.formatter = config.formatter ?? new JsonFormatter()
  }

  private ensureDir(): void {
    if (this.initialized) return
    try {
      // Dynamic require — client bundle-a daxil olmur
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { mkdirSync } = require('node:fs')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { dirname } = require('node:path')
      mkdirSync(dirname(this.filePath), { recursive: true })
      this.initialized = true
    } catch {
      // edge və ya client mühitində sessizce uğursuz ol
    }
  }

  write(entry: LogEntry): void {
    try {
      this.ensureDir()
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { appendFileSync } = require('node:fs')
      const line = this.formatter.format(entry) + '\n'
      appendFileSync(this.filePath, line, 'utf8')
    } catch {
      // server-da deyilsə, sessizce keç
    }
  }
}