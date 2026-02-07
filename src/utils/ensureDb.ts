/**
 * Ensures a database connection exists, throwing a consistent error if not.
 * Reduces boilerplate null checks across database operations.
 *
 * @param db - The database connection (may be null)
 * @returns The database connection (guaranteed non-null)
 * @throws Error if the connection is null
 */
export function ensureDb<T>(db: T | null): T {
  if (!db) {
    throw new Error('No database connection')
  }
  return db
}

export default ensureDb
