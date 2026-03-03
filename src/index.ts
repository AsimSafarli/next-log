// ─── next-log/src/index.ts ───────────────────────────────────────────────────

import { Logger } from './core/logger'
import { ConsoleTransport } from './transports/console'
import { HttpTransport } from './transports/http'
import { FileTransport } from './transports/file'
import { PrettyFormatter } from './formatters/pretty'
import { JsonFormatter } from './formatters/json'
import type { LoggerConfig } from './core/types'
import type { LogLevel } from './core/level'

declare const EdgeRuntime: string | undefined


type EnvTransport = 'console' | 'http' | 'file'

interface NextLogConfig extends LoggerConfig {
  transports?: {
    server?: EnvTransport[]
    client?: EnvTransport[]
    edge?:   EnvTransport[]
  }
  format?: 'json' | 'pretty'
  logEndpoint?: string
}

function currentEnv(): 'server' | 'client' | 'edge' {
  if (typeof window !== 'undefined') return 'client'
  if (typeof EdgeRuntime !== 'undefined') return 'edge'
  return 'server'
}

export function createLogger(config: NextLogConfig = {}): Logger {
  const env    = currentEnv()
  const isDev  = process.env.NODE_ENV !== 'production'
  const format = config.format ?? (isDev ? 'pretty' : 'json')

  const formatter = format === 'pretty'
    ? new PrettyFormatter()
    : new JsonFormatter()

  const defaultTransports: Record<string, EnvTransport[]> = {
    server: ['console'],
    client: ['http'],
    edge:   ['console'],
  }

  const envTransports: EnvTransport[] =
    config.transports?.[env] ?? defaultTransports[env] ?? ['console']

  const loggerConfig: LoggerConfig = {}
  if (config.level !== undefined)       loggerConfig.level       = config.level
  if (config.defaultMeta !== undefined) loggerConfig.defaultMeta = config.defaultMeta

  const logger = new Logger(loggerConfig)
  logger.setFormatter(formatter)

  for (const t of envTransports) {
    if (t === 'console') {
      logger.addTransport(new ConsoleTransport(formatter))
    } else if (t === 'http') {
      const httpOpts = config.logEndpoint !== undefined
        ? { endpoint: config.logEndpoint }
        : {}
      logger.addTransport(new HttpTransport(httpOpts))
    } else if (t === 'file') {
      logger.addTransport(new FileTransport())
    }
  }

  return logger
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { Logger }                                  from './core/logger'
export { ConsoleTransport }                        from './transports/console'
export { HttpTransport }                           from './transports/http'
export { FileTransport }                           from './transports/file'
export { PrettyFormatter }                         from './formatters/pretty'
export { JsonFormatter }                           from './formatters/json'
export { runWithContext, getContext, setContext }   from './core/context'
export type { LogEntry, LoggerConfig, Transport, Formatter } from './core/types'
export type { LogLevel }                           from './core/level'

// ── Default singleton ─────────────────────────────────────────────────────────

const log = createLogger()
export default log