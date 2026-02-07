type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'

export const logger = {
  debug: (...args: unknown[]) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.debug) {
      console.log('[DEBUG]', ...args)
    }
  },
  info: (...args: unknown[]) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.info) {
      console.info('[INFO]', ...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.warn) {
      console.warn('[WARN]', ...args)
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors
    console.error('[ERROR]', ...args)
  },
}

export default logger
