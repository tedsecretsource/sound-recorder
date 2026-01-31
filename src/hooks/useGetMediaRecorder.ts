import { useState, useEffect, useCallback } from 'react'
import { AudioSettings } from '../types/AudioSettings'

interface UseGetMediaRecorderOptions {
    settings?: AudioSettings
}

const useGetMediaRecorder = (options?: UseGetMediaRecorderOptions) => {
    const [mr, setMr] = useState<MediaRecorder | null>(null)
    const settings = options?.settings

    const initializeMediaRecorder = useCallback(async () => {
        const audioConstraints: MediaTrackConstraints = {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
        }

        if (settings) {
            audioConstraints.sampleRate = settings.sampleRate
            audioConstraints.channelCount = settings.channelCount
        }

        try {
            const theStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: audioConstraints
            })

            const bitrate = settings?.bitrate ?? 128000

            // Try audio/webm (everything except Safari)
            try {
                const recorder = new MediaRecorder(theStream, {
                    mimeType: 'audio/webm;codecs="opus"',
                    audioBitsPerSecond: bitrate
                })
                setMr(recorder)
                console.log('Using mimetype audio/webm.')
                return
            } catch (error) {
                console.log('Unable to initialize audio using mimetype audio/webm.')
            }

            // Try audio/mp4 (Safari)
            try {
                const recorder = new MediaRecorder(theStream, {
                    mimeType: 'audio/mp4',
                    audioBitsPerSecond: bitrate
                })
                setMr(recorder)
                console.log('Using mimetype audio/mp4.')
                return
            } catch (error) {
                console.log('Unable to initialize audio using mimetype audio/mp4.')
            }
        } catch (error) {
            console.log('You need to allow access to your microphone to use this app')
        }
    }, [settings])

    useEffect(() => {
        initializeMediaRecorder()
    }, [initializeMediaRecorder])

    return mr
}

export default useGetMediaRecorder
