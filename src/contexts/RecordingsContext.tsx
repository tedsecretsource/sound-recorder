import { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { openDB, IDBPDatabase } from 'idb/with-async-ittr'
import { Recording, SoundRecorderDB } from '../SoundRecorderTypes'
import logger from '../utils/logger'
import { createContextHook } from '../utils/createContextHook'

interface RecordingsContextValue {
    recordings: Recording[]
    isLoading: boolean
    connectionIsOpen: boolean
    addRecording: (recording: Recording) => Promise<number>
    updateRecording: (recording: Recording) => Promise<void>
    deleteRecording: (id: number) => Promise<void>
    refreshRecordings: () => Promise<void>
}

const RecordingsContext = createContext<RecordingsContextValue | null>(null)

interface RecordingsProviderProps {
    children: ReactNode
}

export const RecordingsProvider = ({ children }: RecordingsProviderProps) => {
    const [db, setDb] = useState<IDBPDatabase<SoundRecorderDB> | null>(null)
    const [recordings, setRecordings] = useState<Recording[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [connectionIsOpen, setConnectionIsOpen] = useState(false)

    // Track database connection via ref for cleanup (fixes cleanup bug where db was null)
    const dbRef = useRef<IDBPDatabase<SoundRecorderDB> | null>(null)
    // Track Object URLs to revoke them before creating new ones (prevents memory leak)
    const urlMapRef = useRef<Map<number, string>>(new Map())

    const databaseName = 'sound-recorder'
    const storeName = 'recordings'

    useEffect(() => {
        openDB<SoundRecorderDB>(databaseName, 1, {
            upgrade(db) {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
            }
        }).then((database) => {
            dbRef.current = database
            setDb(database)
            setConnectionIsOpen(true)
        }).catch((err) => {
            logger.error('Failed to open database:', err)
            setIsLoading(false)
        })

        return () => {
            // Use ref to access database connection in cleanup
            if (dbRef.current) {
                dbRef.current.close()
                dbRef.current = null
                setConnectionIsOpen(false)
            }
            // Copy ref value for cleanup to satisfy eslint rule
            const urlMap = urlMapRef.current
            // Revoke all Object URLs on unmount
            urlMap.forEach((url) => URL.revokeObjectURL(url))
            urlMap.clear()
        }
    }, [])

    const refreshRecordings = useCallback(async () => {
        if (!db) return
        setIsLoading(true)
        try {
            const savedRecordings = await db.getAll(storeName)
            savedRecordings.forEach((recording) => {
                if (recording.data !== null && recording.data !== undefined && recording.id !== undefined) {
                    // Revoke old Object URL if it exists to prevent memory leak
                    const oldUrl = urlMapRef.current.get(recording.id)
                    if (oldUrl) {
                        URL.revokeObjectURL(oldUrl)
                    }
                    // Create new Object URL and track it
                    const newUrl = URL.createObjectURL(recording.data)
                    urlMapRef.current.set(recording.id, newUrl)
                    recording.audioURL = newUrl
                }
            })
            setRecordings(savedRecordings)
        } catch (error) {
            logger.error('Failed to refresh recordings:', error)
        } finally {
            setIsLoading(false)
        }
    }, [db])

    useEffect(() => {
        if (connectionIsOpen) {
            refreshRecordings()
        }
    }, [connectionIsOpen, refreshRecordings])

    const addRecording = useCallback(async (recording: Recording): Promise<number> => {
        if (!db) {
            throw new Error('No database connection')
        }
        const id = await db.add(storeName, recording)
        await refreshRecordings()
        return id
    }, [db, refreshRecordings])

    const updateRecording = useCallback(async (recording: Recording): Promise<void> => {
        if (!db) {
            throw new Error('No database connection')
        }
        await db.put(storeName, recording)
        await refreshRecordings()
    }, [db, refreshRecordings])

    const deleteRecording = useCallback(async (id: number): Promise<void> => {
        if (!db) {
            throw new Error('No database connection')
        }
        await db.delete(storeName, id)
        await refreshRecordings()
    }, [db, refreshRecordings])

    const value: RecordingsContextValue = {
        recordings,
        isLoading,
        connectionIsOpen,
        addRecording,
        updateRecording,
        deleteRecording,
        refreshRecordings
    }

    return (
        <RecordingsContext.Provider value={value}>
            {children}
        </RecordingsContext.Provider>
    )
}

export const useRecordings = createContextHook(RecordingsContext, 'useRecordings')

export default RecordingsContext
