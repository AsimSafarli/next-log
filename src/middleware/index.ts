// ─── next-log/src/middleware/index.ts ────────────────────────────────────────
//
// Next.js middleware-ini wrap edib hər request üçün
// requestId və traceId avtomatik yaradır.
//
// İstifadə:
//   import { withLogging } from 'next-log/middleware'
//   export default withLogging(yourMiddlewareFn)
//   // və ya sadəcə:
//   export default withLogging()

import type { NextRequest, NextResponse } from 'next/server'
import { runWithContext } from '../core/context'

type MiddlewareFn = (
  req: NextRequest
) => NextResponse | Response | Promise<NextResponse | Response>

type WithLoggingOptions = {
  /** requestId header adı. Default: 'x-request-id' */
  requestIdHeader?: string
  /** traceId header adı. Default: 'x-trace-id' */
  traceIdHeader?: string
  /** Log-lara avtomatik əlavə edilən sahələr */
  defaultFields?: Record<string, unknown>
}

export function withLogging(
  fn?: MiddlewareFn,
  options: WithLoggingOptions = {}
): MiddlewareFn {
  const reqHeader   = options.requestIdHeader ?? 'x-request-id'
  const traceHeader = options.traceIdHeader   ?? 'x-trace-id'

  return async (req: NextRequest) => {
    const requestId = req.headers.get(reqHeader) ?? crypto.randomUUID()
    const traceId   = req.headers.get(traceHeader) ?? crypto.randomUUID()

    // Context qur — bütün async chain bu context-i görür
    return runWithContext(
      {
        requestId,
        traceId,
        ...options.defaultFields,
      },
      async () => {
        const start = Date.now()
        const res = fn ? await fn(req) : new Response(null, { status: 200 })
        const ms  = Date.now() - start

        // requestId-ni response header-ə əlavə et (debug üçün faydalı)
        const headers = new Headers((res as Response).headers)
        headers.set(reqHeader, requestId)
        headers.set('x-response-time', `${ms}ms`)

        return new Response((res as Response).body, {
          status: res.status,
          headers,
        })
      }
    )
  }
}