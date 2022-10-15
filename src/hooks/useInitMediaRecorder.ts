import { useEffect, useState } from "react"

const useInitMediaRecorder = () => {
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [mr, setMr] = useState<MediaRecorder | null>(null)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then((theStream) => {
                console.log('=======>', 'I am inside the resolved promise in the real hook', '<=======')
                setStream(theStream)
                try {
                    console.log('=======>', 'I am inside the webm try block in the real hook', '<=======')
                    setMr(new MediaRecorder(stream, { mimeType: 'audio/webm' }))
                } catch (error) {
                    console.log('This browser does not support mime type: audio/webm');
                }
                
                try {
                    console.log('=======>', 'I am inside the mp4 try block in the real hook', '<=======')
                    setMr(new MediaRecorder(stream, { mimeType: 'audio/mp4' }))
                } catch (error) {
                    console.log('This browser does not support mime type: audio/mp4');
                }
            })
            .catch((error) => {
                console.log('You need to allow access to your microphone to use this app')
            })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return mr
}

export default useInitMediaRecorder
