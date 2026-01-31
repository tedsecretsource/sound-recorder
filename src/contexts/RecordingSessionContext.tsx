import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { useRecordings } from './RecordingsContext'
import { createRecordingObject } from '../utils/recordingUtils'

interface RecordingSessionState {
    isRecording: boolean
    currentRecordingId: number | null
    elapsedTime: number
}

interface RecordingSessionContextValue {
    state: RecordingSessionState
    startRecording: () => Promise<void>
    stopRecording: () => Promise<void>
}

const RecordingSessionContext = createContext<RecordingSessionContextValue | null>(null)

interface RecordingSessionProviderProps {
    children: ReactNode
    mediaRecorder: MediaRecorder | null
}

export const RecordingSessionProvider = ({ children, mediaRecorder }: RecordingSessionProviderProps) => {
    const { connectionIsOpen, addRecording, updateRecording } = useRecordings()
    const [state, setState] = useState<RecordingSessionState>({
        isRecording: false,
        currentRecordingId: null,
        elapsedTime: 0
    })
    const chunksRef = useRef<Blob[]>([])
    const elapsedIntervalRef = useRef<number | null>(null)

    // Set up MediaRecorder event handlers
    useEffect(() => {
        if (!mediaRecorder) return

        mediaRecorder.onstart = () => {
            console.info('started recording')
        }

        mediaRecorder.onstop = () => {
            console.info('stopped recording')
        }

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
            chunksRef.current.push(e.data)
        }
    }, [mediaRecorder])

    // Handle elapsed time tracking
    useEffect(() => {
        if (state.isRecording) {
            elapsedIntervalRef.current = window.setInterval(() => {
                setState(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }))
            }, 1000)
        } else {
            if (elapsedIntervalRef.current !== null) {
                window.clearInterval(elapsedIntervalRef.current)
                elapsedIntervalRef.current = null
            }
        }

        return () => {
            if (elapsedIntervalRef.current !== null) {
                window.clearInterval(elapsedIntervalRef.current)
            }
        }
    }, [state.isRecording])

    // Handle beforeunload to prompt user when closing browser mid-recording
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (state.isRecording) {
                e.preventDefault()
                return ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [state.isRecording])

    const startRecording = useCallback(async () => {
        if (!mediaRecorder || !connectionIsOpen) return

        // Create placeholder in DB first
        const id = await addRecording({ name: 'New Recording', length: 0, audioURL: '' })

        // Start recording
        mediaRecorder.start(1000)
        setState({
            isRecording: true,
            currentRecordingId: id,
            elapsedTime: 0
        })
    }, [mediaRecorder, connectionIsOpen, addRecording])

    const stopRecording = useCallback(async () => {
        if (!mediaRecorder || !connectionIsOpen || state.currentRecordingId === null) return

        mediaRecorder.stop()

        // Wait briefly for final ondataavailable to fire
        await new Promise(resolve => setTimeout(resolve, 100))

        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const newRecordingObj = createRecordingObject(blob, mediaRecorder.mimeType, state.currentRecordingId)

        try {
            await updateRecording(newRecordingObj)
            console.info('saved recording')
        } catch (error) {
            console.error(error)
        }

        // Reset state
        chunksRef.current = []
        setState({
            isRecording: false,
            currentRecordingId: null,
            elapsedTime: 0
        })
    }, [mediaRecorder, connectionIsOpen, state.currentRecordingId, updateRecording])

    const value: RecordingSessionContextValue = {
        state,
        startRecording,
        stopRecording
    }

    return (
        <RecordingSessionContext.Provider value={value}>
            {children}
        </RecordingSessionContext.Provider>
    )
}

export const useRecordingSession = (): RecordingSessionContextValue => {
    const context = useContext(RecordingSessionContext)
    if (!context) {
        throw new Error('useRecordingSession must be used within a RecordingSessionProvider')
    }
    return context
}

export default RecordingSessionContext
