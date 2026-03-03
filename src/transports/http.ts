// ─── next-log/src/transports/http.ts ─────────────────────────────────────────
import type { Transport } from '../core/types'
import type { LogEntry } from '../core/types'

interface HttpTransportConfig {
  endpoint?: string
  flushInterval?: number
  maxBatch?: number
  retries?: number
}

export class HttpTransport implements Transport {
  private readonly endpoint: string
  private readonly maxBatch: number
  private readonly retries: number
  private queue: LogEntry[] = []
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(config: HttpTransportConfig = {}) {
    this.endpoint = config.endpoint ?? '/api/next-log'
    this.maxBatch = config.maxBatch ?? 20
    this.retries  = config.retries  ?? 2

    const interval = config.flushInterval ?? 500
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush())
      this.timer = setInterval(() => this.flush(), interval)
    }
  }

  write(entry: LogEntry): void {
    this.queue.push(entry)
    if (this.queue.length >= this.maxBatch) {
      this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const batch = this.queue.splice(0)

    let attempt = 0
    while (attempt <= this.retries) {
      try {
        await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ logs: batch }),
          keepalive: true,
        })
        return
      } catch {
        attempt++
        if (attempt > this.retries) {
          console.debug('[next-log] HttpTransport flush failed', batch.length)
        } else {
          await new Promise(r => setTimeout(r, 200 * attempt))
        }
      }
    }
  }

  destroy(): void {
    if (this.timer) clearInterval(this.timer)
    this.flush()
  }
}