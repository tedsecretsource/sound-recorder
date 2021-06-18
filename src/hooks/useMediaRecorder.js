import { useEffect, useState } from 'react'

export default function useMediaRecorder (stream, trigger, events) {
    const [mediaRecorder, setMediaRecorder] = useState(null)

    useEffect(() => {
        if( mediaRecorder === null ) {
            let mr = null
            mr = new MediaRecorder(stream)
            mr.onstop = events.onStop
            mr.onstart = events.onStart
            mr.ondataavailable = events.ondataavailable
            setMediaRecorder(mr)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger])

    return mediaRecorder
}