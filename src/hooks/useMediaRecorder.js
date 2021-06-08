import { useEffect } from 'react'

export default function useMediaRecorder (stream, trigger, chunks, onStart, onStop, ondataavailable, setMediaRecorder, mediaRecorder) {
    useEffect(() => {
        if( mediaRecorder === null ) {
            let mr = null
            mr = new MediaRecorder(stream)
            mr.onstop = onStop
            mr.onstart = onStart
            mr.ondataavailable = ondataavailable
            setMediaRecorder(mr)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger])
}