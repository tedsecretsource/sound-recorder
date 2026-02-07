import { ensureDb } from './ensureDb'

describe('ensureDb', () => {
  it('exports ensureDb function', () => {
    expect(typeof ensureDb).toBe('function')
  })

  it('returns the input when not null', () => {
    const mockDb = { query: jest.fn() }
    const result = ensureDb(mockDb)

    expect(result).toBe(mockDb)
  })

  it('throws error when input is null', () => {
    expect(() => ensureDb(null)).toThrow('No database connection')
  })

  it('preserves type of returned value', () => {
    interface MockDatabase {
      get: (key: string) => string
      set: (key: string, value: string) => void
    }

    const mockDb: MockDatabase = {
      get: jest.fn(),
      set: jest.fn(),
    }

    const result = ensureDb(mockDb)

    // Type should be preserved - these calls should work
    result.get('key')
    result.set('key', 'value')

    expect(mockDb.get).toHaveBeenCalledWith('key')
    expect(mockDb.set).toHaveBeenCalledWith('key', 'value')
  })

  it('works with primitive types', () => {
    const stringValue = 'test'
    expect(ensureDb(stringValue)).toBe('test')

    const numberValue = 42
    expect(ensureDb(numberValue)).toBe(42)

    const boolValue = true
    expect(ensureDb(boolValue)).toBe(true)
  })

  it('works with array types', () => {
    const arrayValue = [1, 2, 3]
    expect(ensureDb(arrayValue)).toEqual([1, 2, 3])
    expect(ensureDb(arrayValue)).toBe(arrayValue)
  })

  it('error message is consistent', () => {
    try {
      ensureDb(null)
      fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message).toBe('No database connection')
    }
  })
})

describe('default export', () => {
  it('exports ensureDb as default', () => {
    const defaultExport = require('./ensureDb').default
    expect(defaultExport).toBe(ensureDb)
  })
})
