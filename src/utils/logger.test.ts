export {}

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('in development mode', () => {
    beforeEach(() => {
      vi.stubEnv('PROD', false)
    })

    it('exports logger object with all methods', async () => {
      const { logger } = await import('./logger')

      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
    })

    it('debug logs in development', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation()
      const { logger } = await import('./logger')

      logger.debug('debug message', { data: 'test' })

      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG]', 'debug message', { data: 'test' })
      consoleSpy.mockRestore()
    })

    it('info logs in development', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation()
      const { logger } = await import('./logger')

      logger.info('info message')

      expect(consoleSpy).toHaveBeenCalledWith('[INFO]', 'info message')
      consoleSpy.mockRestore()
    })

    it('warn logs in development', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation()
      const { logger } = await import('./logger')

      logger.warn('warning message', 123)

      expect(consoleSpy).toHaveBeenCalledWith('[WARN]', 'warning message', 123)
      consoleSpy.mockRestore()
    })

    it('error always logs', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()
      const { logger } = await import('./logger')

      logger.error('error message', new Error('test'))

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'error message', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('handles multiple arguments', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation()
      const { logger } = await import('./logger')

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
      vi.stubEnv('PROD', true)
    })

    it('does not log debug in production', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation()
      const { logger } = await import('./logger')

      logger.debug('debug message')

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('does not log info in production', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation()
      const { logger } = await import('./logger')

      logger.info('info message')

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('logs warn in production', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation()
      const { logger } = await import('./logger')

      logger.warn('warning message')

      expect(consoleSpy).toHaveBeenCalledWith('[WARN]', 'warning message')
      consoleSpy.mockRestore()
    })

    it('logs error in production', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()
      const { logger } = await import('./logger')

      logger.error('error message')

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'error message')
      consoleSpy.mockRestore()
    })
  })

  describe('default export', () => {
    it('exports logger as default', async () => {
      const defaultExport = (await import('./logger')).default
      const { logger } = await import('./logger')
      expect(defaultExport).toBe(logger)
    })
  })
})
