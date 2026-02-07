import { useState, useEffect, useCallback, useRef } from 'react'
import { AudioSettings } from '../types/AudioSettings'

interface UseGetMediaRecorderOptions {
    settings?: AudioSettings
}

export interface MediaRecorderState {
    mediaRecorder: MediaRecorder | null
    isInitializing: boolean
    error: string | null
    gainNode: GainNode | null
    reverbGainNode: GainNode | null
    audioContext: AudioContext | null
}

const useGetMediaRecorder = (options?: UseGetMediaRecorderOptions): MediaRecorderState => {
    const [state, setState] = useState<MediaRecorderState>({
        mediaRecorder: null,
        isInitializing: true,
        error: null,
        gainNode: null,
        reverbGainNode: null,
        audioContext: null
    })
    const audioContextRef = useRef<AudioContext | null>(null)
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
            const rawStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: audioConstraints
            })

            // Create Web Audio API processing chain for gain control and reverb
            const audioContext = new AudioContext()
            audioContextRef.current = audioContext
            const source = audioContext.createMediaStreamSource(rawStream)
            const gainNode = audioContext.createGain()
            const destination = audioContext.createMediaStreamDestination()

            // Create reverb nodes (delay-based reverb)
            const delayNode = audioContext.createDelay(1.0)
            delayNode.delayTime.value = 0.3 // 300ms delay

            const feedbackGain = audioContext.createGain()
            feedbackGain.gain.value = 0.4 // Feedback amount

            const reverbGainNode = audioContext.createGain()
            reverbGainNode.gain.value = 0 // Start with reverb off (dry only)

            // Connect: Source → GainNode
            source.connect(gainNode)

            // Dry path: gainNode → destination
            gainNode.connect(destination)

            // Wet path: gainNode → delay → feedback loop → reverbGain → destination
            gainNode.connect(delayNode)
            delayNode.connect(feedbackGain)
            feedbackGain.connect(delayNode) // Feedback loop
            delayNode.connect(reverbGainNode)
            reverbGainNode.connect(destination)

            // Use the processed stream for recording
            const processedStream = destination.stream

            const bitrate = settings?.bitrate ?? 128000

            // Try audio/webm (everything except Safari)
            try {
                const recorder = new MediaRecorder(processedStream, {
                    mimeType: 'audio/webm;codecs="opus"',
                    audioBitsPerSecond: bitrate
                })
                setState({ mediaRecorder: recorder, isInitializing: false, error: null, gainNode, reverbGainNode, audioContext })
                console.log('Using mimetype audio/webm.')
                return
            } catch (error) {
                console.log('Unable to initialize audio using mimetype audio/webm.')
            }

            // Try audio/mp4 (Safari)
            try {
                const recorder = new MediaRecorder(processedStream, {
                    mimeType: 'audio/mp4',
                    audioBitsPerSecond: bitrate
                })
                setState({ mediaRecorder: recorder, isInitializing: false, error: null, gainNode, reverbGainNode, audioContext })
                console.log('Using mimetype audio/mp4.')
                return
            } catch (error) {
                console.log('Unable to initialize audio using mimetype audio/mp4.')
            }

            // If we got the stream but couldn't create a recorder with any codec
            audioContext.close()
            setState({
                mediaRecorder: null,
                isInitializing: false,
                error: 'No supported audio codec found',
                gainNode: null,
                reverbGainNode: null,
                audioContext: null
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Microphone access denied'
            setState({
                mediaRecorder: null,
                isInitializing: false,
                error: errorMessage,
                gainNode: null,
                reverbGainNode: null,
                audioContext: null
            })
            console.log('You need to allow access to your microphone to use this app')
        }
    }, [settings])

    useEffect(() => {
        initializeMediaRecorder()

        return () => {
            // Cleanup: close AudioContext when component unmounts
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [initializeMediaRecorder])

    return state
}

export default useGetMediaRecorder
