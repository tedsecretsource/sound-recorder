import { createContext } from 'react'
import { renderHook } from '@testing-library/react'
import { createContextHook } from './createContextHook'

describe('createContextHook', () => {
  it('exports createContextHook function', () => {
    expect(typeof createContextHook).toBe('function')
  })

  it('returns a hook function', () => {
    const TestContext = createContext<string | null>(null)
    const useTest = createContextHook(TestContext, 'useTest')

    expect(typeof useTest).toBe('function')
  })

  it('throws error when used outside provider', () => {
    const TestContext = createContext<{ value: string } | null>(null)
    const useTest = createContextHook(TestContext, 'useTest')

    expect(() => {
      renderHook(() => useTest())
    }).toThrow('useTest must be used within its Provider')
  })

  it('returns context value when used inside provider', () => {
    const TestContext = createContext<{ value: string } | null>(null)
    const useTest = createContextHook(TestContext, 'useTest')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestContext.Provider value={{ value: 'test-value' }}>
        {children}
      </TestContext.Provider>
    )

    const { result } = renderHook(() => useTest(), { wrapper })

    expect(result.current).toEqual({ value: 'test-value' })
  })

  it('uses hook name in error message', () => {
    const TestContext = createContext<number | null>(null)
    const useCustomName = createContextHook(TestContext, 'useCustomName')

    expect(() => {
      renderHook(() => useCustomName())
    }).toThrow('useCustomName must be used within its Provider')
  })

  it('works with different context types', () => {
    // Test with object type
    const ObjectContext = createContext<{ id: number; name: string } | null>(null)
    const useObjectContext = createContextHook(ObjectContext, 'useObjectContext')

    const objectWrapper = ({ children }: { children: React.ReactNode }) => (
      <ObjectContext.Provider value={{ id: 42, name: 'test' }}>
        {children}
      </ObjectContext.Provider>
    )

    const { result: objectResult } = renderHook(() => useObjectContext(), {
      wrapper: objectWrapper,
    })
    expect(objectResult.current).toEqual({ id: 42, name: 'test' })

    // Test with array type
    const ArrayContext = createContext<string[] | null>(null)
    const useArrayContext = createContextHook(ArrayContext, 'useArrayContext')

    const arrayWrapper = ({ children }: { children: React.ReactNode }) => (
      <ArrayContext.Provider value={['a', 'b', 'c']}>
        {children}
      </ArrayContext.Provider>
    )

    const { result: arrayResult } = renderHook(() => useArrayContext(), {
      wrapper: arrayWrapper,
    })
    expect(arrayResult.current).toEqual(['a', 'b', 'c'])
  })

  it('works with function values in context', () => {
    interface FunctionContext {
      getValue: () => number
      setValue: (n: number) => void
    }

    const FnContext = createContext<FunctionContext | null>(null)
    const useFnContext = createContextHook(FnContext, 'useFnContext')

    const mockGetValue = jest.fn(() => 42)
    const mockSetValue = jest.fn()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FnContext.Provider value={{ getValue: mockGetValue, setValue: mockSetValue }}>
        {children}
      </FnContext.Provider>
    )

    const { result } = renderHook(() => useFnContext(), { wrapper })

    expect(result.current.getValue()).toBe(42)
    result.current.setValue(100)
    expect(mockSetValue).toHaveBeenCalledWith(100)
  })
})

describe('default export', () => {
  it('exports createContextHook as default', () => {
    const defaultExport = require('./createContextHook').default
    expect(defaultExport).toBe(createContextHook)
  })
})
