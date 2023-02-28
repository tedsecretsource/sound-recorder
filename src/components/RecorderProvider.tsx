import { useState, useEffect } from 'react'
import Recorder from './Recorder'

const RecoderProvider = () => {
    const [mr, setMr] = useState<MediaRecorder | null>(null)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then((theStream) => {
            
            // everything except Safari
            try {
                setMr(new MediaRecorder(theStream, { mimeType: 'audio/webm;codecs="opus"', audioBitsPerSecond: 1441000 }))
                console.log('Using mimetype audio/webm.')
            } catch (error) {
                console.log('Unable to initialize audio using mimetype audio/webm.')
            }
            // Safari
            try {
                setMr(new MediaRecorder(theStream, { mimeType: 'audio/mp4', audioBitsPerSecond: 1441000 }))
                console.log('Using mimetype audio/mp4.')
            } catch (error) {
                console.log('Unable to initialize audio using mimetype audio/mp4.')
            }

        })
        .catch((error) => {
            console.log('You need to allow access to your microphone to use this app')
        })

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Recorder mediaRecorder={mr} />
    )
}

export default RecoderProvider