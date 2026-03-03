# @asimsafar/next-log

Unified logging for Next.js. One API across Server Components, Client Components, and Edge Middleware — with automatic `requestId` propagation.

```bash
npm install @asimsafar/next-log
```

---

## The Problem

Next.js has no built-in logging solution:

| Environment | Problem |
|---|---|
| Server Component | `console.log` works but has no request context |
| Client Component | Logs stay in the browser — never reach your server |
| Edge Middleware | Context is lost before it reaches Server Components |

`@asimsafar/next-log` solves all three with a single API.

---

## How It Works

```
Middleware starts
  → generates requestId + traceId via AsyncLocalStorage
  → context flows automatically into Server Components

Client logs
  → batched and sent to /api/next-log
  → written to server stdout with full context
```

Output (dev):
```
10:22:11 INF srv f3a2bc10 [db] query executed {"ms":42}
```

Output (prod):
```json
{"timestamp":"...","level":"info","msg":"query executed","requestId":"f3a2bc10","module":"db","ms":42}
```

---

## Setup

### 1. Create your logger

```ts
// lib/logger.ts
import { createLogger } from '@asimsafar/next-log'

export const log = createLogger({
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'
})
```

### 2. Add the middleware

```ts
// middleware.ts
import { withLogging } from '@asimsafar/next-log/middleware'
import { NextResponse } from 'next/server'

export default withLogging(async (req) => {
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 3. Add the API route (receives client logs)

```ts
// app/api/next-log/route.ts
export { logHandler as POST } from '@asimsafar/next-log/api'
```

---

## Usage

```ts
import { log } from '@/lib/logger'

log.debug('cache miss', { key: 'user:42' })
log.info('order created', { orderId: 'ORD-881', userId: 'usr-44' })
log.warn('rate limit approaching', { remaining: 10 })
log.error('payment failed', { error: err.message })

// Child logger — scoped context added to every log
const dbLog = log.child({ module: 'database' })
dbLog.info('query executed', { ms: 42 })
// → { level: "info", msg: "query executed", module: "database", requestId: "...", ms: 42 }
```

---

## Output

**Development** (pretty format):
```
10:22:11 INF srv f3a2bc10 order created {"orderId":"ORD-881"}
10:22:11 INF cli f3a2bc10 [database] query executed {"ms":42}
10:22:11 ERR srv f3a2bc10 payment failed {"error":"Insufficient funds"}
```

**Production** (JSON format):
```json
{"timestamp":"2026-03-03T10:22:11.432Z","level":"info","msg":"order created","env":"server","requestId":"f3a2bc10","traceId":"span-447","orderId":"ORD-881"}
```

---

## Configuration

```ts
createLogger({
  // Minimum log level (default: 'info')
  level: 'debug',

  // Output format (default: auto — 'pretty' in dev, 'json' in prod)
  format: 'json',

  // Default fields added to every log entry
  defaultMeta: {
    app: 'my-app',
    version: '1.0.0',
  },

  // Override transports per environment
  transports: {
    server: ['console', 'file'], // stdout + logs/app.log
    client: ['http'],            // POST to /api/next-log
    edge:   ['console'],         // stdout
  },

  // Custom endpoint for client logs (default: '/api/next-log')
  logEndpoint: '/api/logs',
})
```

---

## Transports

| Transport | Environments | Description |
|---|---|---|
| `console` | server, edge | Writes to stdout/stderr |
| `http` | client | Batches logs and POSTs to `/api/next-log` |
| `file` | server | Appends to `logs/app.log` |

---

## Advanced

### Custom transport

```ts
import { createLogger, type Transport, type LogEntry } from '@asimsafar/next-log'

const datadogTransport: Transport = {
  write(entry: LogEntry) {
    fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
      method: 'POST',
      headers: { 'DD-API-KEY': process.env.DD_API_KEY! },
      body: JSON.stringify(entry),
    })
  }
}

export const log = createLogger()
log.addTransport(datadogTransport)
```

### Manual context

```ts
import { setContext } from '@asimsafar/next-log'

// Add fields to the current async context
setContext({ userId: session.user.id, plan: 'pro' })

// All subsequent logs in this request will include these fields
log.info('dashboard loaded')
// → { ..., userId: "usr-44", plan: "pro" }
```

### Middleware options

```ts
export default withLogging(handler, {
  requestIdHeader: 'x-request-id',
  traceIdHeader:   'x-trace-id',
  defaultFields:   { region: 'eu-west-1' },
})
```

---

## Log Entry Shape

```ts
{
  timestamp:  string                               // ISO 8601
  level:      'debug' | 'info' | 'warn' | 'error'
  msg:        string
  env:        'server' | 'client' | 'edge'
  requestId?: string                               // set by withLogging()
  traceId?:   string                               // set by withLogging()
  // ...any additional fields you pass
}
```

---

## License

MIT