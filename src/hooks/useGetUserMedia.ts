import { useEffect, useState } from 'react'


const useGetUserMedia = () => {
    const [stream, setStream] = useState<MediaStream | DOMException | null>(null)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then((stream) => {
                setStream(stream)
            })
            .catch((error) => {
                setStream(error)
            })
    }, [])
    return stream

}

export default useGetUserMedia