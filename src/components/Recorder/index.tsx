import { useMediaRecorder } from '../../App'
import { useRecordingSession } from '../../contexts/RecordingSessionContext'
import Visualizer from '../Visualizer'
import './style.css'

const RecorderControls = () => {
    const mediaRecorder = useMediaRecorder()
    const { state, startRecording, stopRecording } = useRecordingSession()

    const defaultRecordClass = 'record-play'

    const toggleRecording = () => {
        if (state.isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }

    const recorderUI = () => {
        const recordButtonClassesText = state.isRecording ? `${defaultRecordClass} recording-audio` : defaultRecordClass
        return (
            <>
                <Visualizer stream={mediaRecorder.stream} barColor={[18,124,85]} />
                <button onClick={toggleRecording} className={recordButtonClassesText}>{state.isRecording ? 'Stop' : 'Record'}</button>
            </>
        )
    }

    const recorderRenderer = () => {
        if (mediaRecorder === null) {
            return <button disabled className="record-play" title="Please either allow or decline the use of your microphone">Loading…</button>
        } else {
            return recorderUI()
        }
    }

    return (
        recorderRenderer()
    )
}

export default RecorderControls
