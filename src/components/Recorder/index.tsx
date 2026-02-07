import { useState, useEffect } from 'react'
import { useMediaRecorder } from '../../App'
import { useRecordingSession } from '../../contexts/RecordingSessionContext'
import { useRecordings } from '../../contexts/RecordingsContext'
import Visualizer from '../Visualizer'
import './style.css'

const RecorderControls = () => {
    const { mediaRecorder, isInitializing, error, gainNode, audioContext } = useMediaRecorder()
    const { state, startRecording, stopRecording } = useRecordingSession()
    const { connectionIsOpen } = useRecordings()
    const [boostGain, setBoostGain] = useState(false)

    // Control the gain node based on boostGain toggle
    useEffect(() => {
        if (gainNode && audioContext) {
            const targetGain = boostGain ? 7.0 : 1.0
            // Use setValueAtTime for smooth transitions to prevent audio clicks
            gainNode.gain.setValueAtTime(targetGain, audioContext.currentTime)
        }
    }, [boostGain, gainNode, audioContext])

    const defaultRecordClass = 'record-play'

    const toggleRecording = () => {
        if (state.isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }

    const isReady = mediaRecorder && connectionIsOpen && !isInitializing

    const recorderUI = () => {
        const recordButtonClassesText = state.isRecording ? `${defaultRecordClass} recording-audio` : defaultRecordClass
        return (
            <>
                <Visualizer stream={mediaRecorder!.stream} barColor={[18,124,85]} sensitivity={4} />
                <button onClick={toggleRecording} className={recordButtonClassesText}>{state.isRecording ? 'Stop' : 'Record'}</button>
                <div className="gain-toggle">
                    <button
                        className={`gain-btn gain-btn-left ${!boostGain ? 'active' : ''}`}
                        onClick={() => setBoostGain(false)}
                    >
                        1x
                    </button>
                    <button
                        className={`gain-btn gain-btn-right ${boostGain ? 'active' : ''}`}
                        onClick={() => setBoostGain(true)}
                    >
                        7x
                    </button>
                </div>
            </>
        )
    }

    const recorderRenderer = () => {
        // Error state - microphone access failed
        if (error) {
            return (
                <button disabled className="record-play record-error" title={error}>
                    Microphone Error
                </button>
            )
        }

        // Initializing microphone
        if (isInitializing) {
            return (
                <button disabled className="record-play" title="Initializing microphone access...">
                    Initializing…
                </button>
            )
        }

        // Waiting for database connection
        if (!connectionIsOpen) {
            return (
                <button disabled className="record-play" title="Preparing storage...">
                    Preparing…
                </button>
            )
        }

        // Ready to record
        if (isReady) {
            return recorderUI()
        }

        // Fallback loading state
        return (
            <button disabled className="record-play" title="Please wait...">
                Loading…
            </button>
        )
    }

    return (
        recorderRenderer()
    )
}

export default RecorderControls
