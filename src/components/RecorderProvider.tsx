import { useState, useEffect } from 'react'
import Recorder from './Recorder'

const RecoderProvider = () => {
    const [mr, setMr] = useState<MediaRecorder | null>(null)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then((theStream) => {
            try {
                setMr(new MediaRecorder(theStream, { mimeType: 'audio/webm;codecs="opus"', audioBitsPerSecond: 1441000 }))
            } catch (error) {
                console.log('Using mimetype audio/mp4. This browser does not support mime type: audio/webm')
            }
            
            try {
                setMr(new MediaRecorder(theStream, { mimeType: 'audio/mp4', audioBitsPerSecond: 1441000 }))
            } catch (error) {
                console.log('Using mimetype audio/webm. This browser does not support mime type: audio/mp4')
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