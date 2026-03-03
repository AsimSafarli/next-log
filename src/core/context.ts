// ─── next-log/src/core/context.ts ────────────────────────────────────────────


export interface LogContext {
  requestId?: string
  traceId?: string
  userId?: string
  [key: string]: unknown
}

type ALS = {
  getStore(): LogContext | undefined
  run<T>(store: LogContext, callback: () => T): T
}

function createALS(): ALS | null {
  if (typeof globalThis !== 'undefined') {
    try {      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AsyncLocalStorage } = require('async_hooks') as {
        AsyncLocalStorage: new () => ALS
      }
      return new AsyncLocalStorage()
    } catch {
      // Edge runtime — native AsyncLocalStorage
      const g = globalThis as Record<string, unknown>
      if (typeof g['AsyncLocalStorage'] === 'function') {
        const ALS = g['AsyncLocalStorage'] as new () => ALS
        return new ALS()
      }
    }
  }
  return null
}

const _als = createALS()

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Yeni bir async context başlat. Middleware-də çağır.
 *
 * @example
 * // middleware.ts
 * export default function middleware(req: NextRequest) {
 *   return runWithContext({ requestId: crypto.randomUUID() }, () => next())
 * }
 */
export function runWithContext<T>(ctx: LogContext, fn: () => T): T {
  if (!_als) return fn()
  return _als.run(ctx, fn)
}

/**
 * Cari context-i oxu. Log entry yaratarkən çağırılır.
 */
export function getContext(): LogContext {
  if (!_als) return {}
  return _als.getStore() ?? {}
}

/**
 * Cari context-ə yeni sahələr əlavə et (dəyişdirmə, birləşdir).
 */
export function setContext(fields: LogContext): void {
  if (!_als) return
  const store = _als.getStore()
  if (store) {
    Object.assign(store, fields)
  }
}