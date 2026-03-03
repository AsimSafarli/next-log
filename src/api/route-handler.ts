// ─── next-log/src/api/route-handler.ts ───────────────────────────────────────
//
// Client tərəfdən gələn log-ları qəbul edib server-də yazar.
//
// İstifadə:
//   // app/api/next-log/route.ts
//   export { logHandler as POST } from 'next-log/api'

import type { NextRequest } from 'next/server'
import type { LogEntry } from '../core/types'
import type { Transport } from '../core/types'
import { ConsoleTransport } from '../transports/console'

interface LogHandlerOptions {
  /** Client log-larını qəbul etmək üçün transport. Default: ConsoleTransport */
  transport?: Transport
  /** Maksimum batch ölçüsü. Default: 50 */
  maxBatch?: number
}

export function createLogHandler(options: LogHandlerOptions = {}) {
  const transport = options.transport ?? new ConsoleTransport()
  const maxBatch  = options.maxBatch  ?? 50

  return async function logHandler(req: NextRequest): Promise<Response> {
    try {
      const body = await req.json() as { logs?: LogEntry[] }

      if (!Array.isArray(body?.logs)) {
        return Response.json({ error: 'logs array required' }, { status: 400 })
      }

      const logs = body.logs.slice(0, maxBatch)

      for (const entry of logs) {
        // Client-dən gəlir — env-i override et ki, server log-unda görünsün
        transport.write({ ...entry, env: 'client' })
      }

      return Response.json({ ok: true, received: logs.length })
    } catch {
      return Response.json({ error: 'invalid json' }, { status: 400 })
    }
  }
}

// Hazır default handler
export const logHandler = createLogHandler()