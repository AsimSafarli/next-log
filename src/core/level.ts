// ─── next-log/src/core/level.ts ───────────────────────────────────────────────
export const LOG_LEVELS = {
  debug: 0,
  info:  1,
  warn:  2,
  error: 3,
  silent: 4,
} as const

export type LogLevel = keyof typeof LOG_LEVELS

export function isLevelEnabled(current: LogLevel, minimum: LogLevel): boolean {
  return LOG_LEVELS[current] >= LOG_LEVELS[minimum]
}