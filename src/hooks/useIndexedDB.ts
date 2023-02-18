import { useEffect, useState } from "react"
import { openDB, IDBPDatabase } from 'idb/with-async-ittr';
import { Recording, SoundRecorderDB } from '../SoundRecorderTypes';

// interface IndexedDBHook {
//     db: IDBPDatabase<SoundRecorderDB> | null
//     getRecordingFromDB: (id: number | IDBKeyRange) => Promise<Recording | undefined>
//     getAllRecordingsFromDB: () => Promise<Recording[]>
//     addRecording: (recording: Recording) => Promise<number>
//     putRecording: (recording: Recording) => Promise<number>
//     deleteRecordingFromDB: (id: number | IDBKeyRange) => Promise<void>
// }

const useIndexedDB = () => {
    const [db, setDb] = useState<IDBPDatabase<SoundRecorderDB> | null>(null)
    const [connectionIsOpen, setConnectionIsOpen] = useState(false)
    const databaseName = 'sound-recorder'
    const storeName = 'recordings'
    
    useEffect(() => {
        openDB<SoundRecorderDB>(databaseName, 1, {
            upgrade(db) {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
            }
        }).then((db) => {
            setDb(db)
            setConnectionIsOpen(true)
        }).catch((err) => {
            console.error(err)
        })
        
        return () => {
            if(db) {
                db.close()
                setConnectionIsOpen(false)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getRecordingFromDB = (id: number | IDBKeyRange) => {
        if(db) {
            return db.get(storeName, id)
        } else {
            return Promise.reject('No database connection')
        }
    }

    const getAllRecordingsFromDB = () => {
        if(db) {
            return db.getAll(storeName)
        } else {
            return Promise.reject('No database connection')
        }
    }

    const addRecording = (recording: Recording) => {
        if(db) {
            return db.add(storeName, recording)
        } else {
            return Promise.reject('No database connection')
        }
    }

    const putRecording = (recording: Recording) => {
        if(db) {
            return db.put(storeName, recording)
        } else {
            return Promise.reject('No database connection')
        }
    }

    const deleteRecordingFromDB = (id: number | IDBKeyRange) => {
        if(db) {
            return db.delete(storeName, id)
        } else {
            return Promise.reject('No database connection')
        }
    }

    return {
        connectionIsOpen,
        getRecordingFromDB,
        getAllRecordingsFromDB,
        addRecording,
        putRecording,
        deleteRecordingFromDB
    }
}

export default useIndexedDB