import { useContext, Context } from 'react'

/**
 * Factory function to create type-safe context hooks with consistent error messages.
 * Reduces boilerplate across all context files.
 *
 * @param ContextObj - The React Context object
 * @param hookName - The name of the hook (for error message)
 * @returns A hook function that returns the context value or throws if used outside provider
 */
export function createContextHook<T>(
  ContextObj: Context<T | null>,
  hookName: string
): () => T {
  return () => {
    const context = useContext(ContextObj)
    if (!context) {
      throw new Error(`${hookName} must be used within its Provider`)
    }
    return context
  }
}

export default createContextHook
