import { useState, useEffect, useCallback } from 'react'
import { AudioSettings } from '../types/AudioSettings'

interface UseGetMediaRecorderOptions {
    settings?: AudioSettings
}

export interface MediaRecorderState {
    mediaRecorder: MediaRecorder | null
    isInitializing: boolean
    error: string | null
}

const useGetMediaRecorder = (options?: UseGetMediaRecorderOptions): MediaRecorderState => {
    const [state, setState] = useState<MediaRecorderState>({
        mediaRecorder: null,
        isInitializing: true,
        error: null
    })
    const settings = options?.settings

    const initializeMediaRecorder = useCallback(async () => {
        setState(prev => ({ ...prev, isInitializing: true, error: null }))

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
                setState({ mediaRecorder: recorder, isInitializing: false, error: null })
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
                setState({ mediaRecorder: recorder, isInitializing: false, error: null })
                console.log('Using mimetype audio/mp4.')
                return
            } catch (error) {
                console.log('Unable to initialize audio using mimetype audio/mp4.')
            }

            // If we got the stream but couldn't create a recorder with any codec
            setState({
                mediaRecorder: null,
                isInitializing: false,
                error: 'No supported audio codec found'
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Microphone access denied'
            setState({
                mediaRecorder: null,
                isInitializing: false,
                error: errorMessage
            })
            console.log('You need to allow access to your microphone to use this app')
        }
    }, [settings])

    useEffect(() => {
        initializeMediaRecorder()
    }, [initializeMediaRecorder])

    return state
}

export default useGetMediaRecorder
