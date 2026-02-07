import { useMediaRecorder } from '../../App'
import { useRecordingSession } from '../../contexts/RecordingSessionContext'
import { useRecordings } from '../../contexts/RecordingsContext'
import Visualizer from '../Visualizer'
import './style.css'

const RecorderControls = () => {
    const { mediaRecorder, isInitializing, error } = useMediaRecorder()
    const { state, startRecording, stopRecording } = useRecordingSession()
    const { connectionIsOpen } = useRecordings()

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
                <Visualizer stream={mediaRecorder!.stream} barColor={[18,124,85]} />
                <button onClick={toggleRecording} className={recordButtonClassesText}>{state.isRecording ? 'Stop' : 'Record'}</button>
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
