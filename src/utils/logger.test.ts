export {}

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('in development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('exports logger object with all methods', () => {
      const { logger } = require('./logger')

      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
    })

    it('debug logs in development', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const { logger } = require('./logger')

      logger.debug('debug message', { data: 'test' })

      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG]', 'debug message', { data: 'test' })
      consoleSpy.mockRestore()
    })

    it('info logs in development', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
      const { logger } = require('./logger')

      logger.info('info message')

      expect(consoleSpy).toHaveBeenCalledWith('[INFO]', 'info message')
      consoleSpy.mockRestore()
    })

    it('warn logs in development', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const { logger } = require('./logger')

      logger.warn('warning message', 123)

      expect(consoleSpy).toHaveBeenCalledWith('[WARN]', 'warning message', 123)
      consoleSpy.mockRestore()
    })

    it('error always logs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const { logger } = require('./logger')

      logger.error('error message', new Error('test'))

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'error message', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('handles multiple arguments', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const { logger } = require('./logger')

      logger.debug('arg1', 'arg2', 'arg3', { obj: true }, [1, 2, 3])

      expect(consoleSpy).toHaveBeenCalledWith(
        '[DEBUG]',
        'arg1',
        'arg2',
        'arg3',
        { obj: true },
        [1, 2, 3]
      )
      consoleSpy.mockRestore()
    })
  })

  describe('in production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('does not log debug in production', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const { logger } = require('./logger')

      logger.debug('debug message')

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('does not log info in production', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
      const { logger } = require('./logger')

      logger.info('info message')

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('logs warn in production', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const { logger } = require('./logger')

      logger.warn('warning message')

      expect(consoleSpy).toHaveBeenCalledWith('[WARN]', 'warning message')
      consoleSpy.mockRestore()
    })

    it('logs error in production', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const { logger } = require('./logger')

      logger.error('error message')

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'error message')
      consoleSpy.mockRestore()
    })
  })

  describe('default export', () => {
    it('exports logger as default', () => {
      const defaultExport = require('./logger').default
      const { logger } = require('./logger')
      expect(defaultExport).toBe(logger)
    })
  })
})
