import { useEffect, useState, useRef } from "react"
import { openDB, IDBPDatabase } from 'idb/with-async-ittr';
import { Recording, SoundRecorderDB } from '../SoundRecorderTypes';
import logger from '../utils/logger';
import { ensureDb } from '../utils/ensureDb';

const useIndexedDB = () => {
    const [db, setDb] = useState<IDBPDatabase<SoundRecorderDB> | null>(null)
    const [connectionIsOpen, setConnectionIsOpen] = useState(false)
    // Track database connection via ref for cleanup (fixes cleanup bug where db was null)
    const dbRef = useRef<IDBPDatabase<SoundRecorderDB> | null>(null)
    const databaseName = 'sound-recorder'
    const storeName = 'recordings'

    useEffect(() => {
        openDB<SoundRecorderDB>(databaseName, 3, {
            upgrade(db, oldVersion) {
                if (oldVersion < 1) {
                    db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
                }
                // Migration: auth-tokens store was added in v2, removed in v3
                // (tokens now stored in HttpOnly cookies)
                if (oldVersion >= 2 && oldVersion < 3) {
                    if (db.objectStoreNames.contains('auth-tokens' as never)) {
                        db.deleteObjectStore('auth-tokens' as never)
                    }
                }
            }
        }).then((database) => {
            dbRef.current = database
            setDb(database)
            setConnectionIsOpen(true)
        }).catch((err) => {
            logger.error('Failed to open database:', err)
        })

        return () => {
            // Use ref to access database connection in cleanup
            if (dbRef.current) {
                dbRef.current.close()
                dbRef.current = null
                setConnectionIsOpen(false)
            }
        }
    }, [])

    const getRecordingFromDB = (id: number | IDBKeyRange) => {
        return ensureDb(db).get(storeName, id)
    }

    const getAllRecordingsFromDB = () => {
        return ensureDb(db).getAll(storeName)
    }

    const addRecording = (recording: Recording) => {
        return ensureDb(db).add(storeName, recording)
    }

    const putRecording = (recording: Recording) => {
        return ensureDb(db).put(storeName, recording)
    }

    const deleteRecordingFromDB = (id: number | IDBKeyRange) => {
        return ensureDb(db).delete(storeName, id)
    }

    return {
        connectionIsOpen,
        getRecordingFromDB,
        getAllRecordingsFromDB,
        addRecording,
        putRecording,
        deleteRecordingFromDB,
    }
}

export default useIndexedDB
