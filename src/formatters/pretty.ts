// ─── next-log/src/formatters/pretty.ts ───────────────────────────────────────

import type { Formatter } from '../core/types'
import type { LogEntry } from '../core/types'
import type { LogLevel } from '../core/level'

const C = {
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
  gray:   '\x1b[90m',
  blue:   '\x1b[34m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
}

const LEVEL_STYLES: Record<LogLevel, { color: string; label: string }> = {
  debug:  { color: C.gray,   label: 'DBG' },
  info:   { color: C.green,  label: 'INF' },
  warn:   { color: C.yellow, label: 'WRN' },
  error:  { color: C.red,    label: 'ERR' },
  silent: { color: C.gray,   label: '---' },
}

const ENV_TAG: Record<LogEntry['env'], string> = {
  server: `${C.blue}srv${C.reset}`,
  client: `${C.cyan}cli${C.reset}`,
  edge:   `${C.yellow}edg${C.reset}`,
}

export class PrettyFormatter implements Formatter {
  format(entry: LogEntry): string {
    const { timestamp, level, msg, env, requestId, module, ...rest } = entry
    const style = LEVEL_STYLES[level]

    const time = timestamp.slice(11, 19)

    const badge = `${style.color}${C.bold}${style.label}${C.reset}`

    const mod = module
      ? `${C.dim}[${module}]${C.reset} `
      : ''
    const reqId = requestId
      ? ` ${C.gray}${requestId.slice(0, 8)}${C.reset}`
      : ''

    const extras = Object.keys(rest).length
      ? ` ${C.dim}${JSON.stringify(rest)}${C.reset}`
      : ''

    return `${C.gray}${time}${C.reset} ${badge} ${ENV_TAG[env]}${reqId} ${mod}${msg}${extras}`
  }
}