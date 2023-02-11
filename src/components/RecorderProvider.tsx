import { useState, useEffect } from 'react'
import { openDB, IDBPDatabase } from 'idb/with-async-ittr';
import { SoundRecorderDB } from '../SoundRecorderTypes';
import Recorder from './Recorder'

const RecoderProvider = () => {
    const [mr, setMr] = useState<MediaRecorder | null>(null)
    const [db, setDb] = useState<IDBPDatabase<SoundRecorderDB> | null>(null)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then((theStream) => {
            try {
                setMr(new MediaRecorder(theStream, { mimeType: 'audio/webm;codecs="opus"', audioBitsPerSecond: 1441000 }))
            } catch (error) {
                console.log('This browser does not support mime type: audio/webm')
            }
            
            try {
                setMr(new MediaRecorder(theStream, { mimeType: 'audio/mp4', audioBitsPerSecond: 1441000 }))
            } catch (error) {
                console.log('This browser does not support mime type: audio/mp4')
            }
        })
        .catch((error) => {
            console.log('You need to allow access to your microphone to use this app')
        })

        const setupDatabase = async () => {
            const db = await openDB<SoundRecorderDB>('sound-recorder', 1, {
                upgrade(db) {
                    db.createObjectStore('recordings', { keyPath: 'id', autoIncrement: true })
                }
            })
            setDb(db)
        }

        setupDatabase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Recorder mediaRecorder={mr} db={db} />
    )
}

export default RecoderProvider