import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { openDB, IDBPDatabase } from 'idb/with-async-ittr'
import { Recording, SoundRecorderDB } from '../SoundRecorderTypes'

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

    const databaseName = 'sound-recorder'
    const storeName = 'recordings'

    useEffect(() => {
        openDB<SoundRecorderDB>(databaseName, 1, {
            upgrade(db) {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
            }
        }).then((database) => {
            setDb(database)
            setConnectionIsOpen(true)
        }).catch((err) => {
            console.error(err)
            setIsLoading(false)
        })

        return () => {
            if (db) {
                db.close()
                setConnectionIsOpen(false)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const refreshRecordings = useCallback(async () => {
        if (!db) return
        setIsLoading(true)
        try {
            const savedRecordings = await db.getAll(storeName)
            savedRecordings.forEach((recording) => {
                if (recording.data !== null && recording.data !== undefined) {
                    recording.audioURL = window.URL.createObjectURL(recording.data)
                }
            })
            setRecordings(savedRecordings)
        } catch (error) {
            console.error(error)
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

export const useRecordings = (): RecordingsContextValue => {
    const context = useContext(RecordingsContext)
    if (!context) {
        throw new Error('useRecordings must be used within a RecordingsProvider')
    }
    return context
}

export default RecordingsContext
