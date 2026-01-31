import { useEffect, useState, useRef } from 'react'
import { useMediaRecorder } from '../../App'
import { useRecordings } from '../../contexts/RecordingsContext'
import { createRecordingObject } from '../../utils/recordingUtils'
import Visualizer from '../Visualizer'
import './style.css'

const Recorder = () => {
    const mediaRecorder = useMediaRecorder()
    const { connectionIsOpen, addRecording, updateRecording } = useRecordings()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [recorderState, setRecorderState] = useState('inactive')
    const [currentRecording, setCurrentRecording] = useState(0)
    const defaultRecordClass = 'record-play'
    let recordButtonClassesText = defaultRecordClass
    const chunksRef = useRef<Blob[]>([])

    useEffect(() => {
        if( mediaRecorder ) {

            mediaRecorder.onstart = () => {
                console.info('started recording')
            }

            mediaRecorder.onstop = () => {
                console.info('stopped recording')
            }

            mediaRecorder.ondataavailable = (e: BlobEvent) => {
                chunksRef.current.push(e.data)
            }
        }
    }, [mediaRecorder])

    const updateRecordingsList = async () => {
        const blob = new Blob(chunksRef.current, { 'type' : mediaRecorder.mimeType })
        const newRecordingObj = createRecordingObject(blob, mediaRecorder.mimeType, currentRecording)

        if( connectionIsOpen ) {
            try {
                await updateRecording(newRecordingObj)
                console.info('saved recording')
            } catch (error) {
                console.error(error)
            }
        }
        chunksRef.current = []
    }

    const initRecording = async () => {
        if( connectionIsOpen ) {
            const id = await addRecording({ name: 'New Recording', length: 0, audioURL: '' })
            setCurrentRecording(id)
        }
    }

    const toggleRecording = () => {
        if (mediaRecorder.state === 'inactive') {
            mediaRecorder.start(1000)
            // add a recording record to the database so we can get the ID
            initRecording()
        } else {
            mediaRecorder.stop()
            updateRecordingsList()
        }
        setRecorderState(mediaRecorder.state)
    }

    const recorderUI = () => {
        console.info('mediarecorder', mediaRecorder)
        recordButtonClassesText = mediaRecorder.state === 'recording' ? `${defaultRecordClass} recording-audio` : defaultRecordClass
        return (
            <>
                <Visualizer stream={mediaRecorder.stream} barColor={[18,124,85]} />
                <button onClick={toggleRecording} className={recordButtonClassesText}>{mediaRecorder.state === 'recording' ? 'Stop' : 'Record'}</button>
            </>
        )
    }

    const recorderRenderer = () => {
        if( mediaRecorder === null ) {
            return <button disabled className="record-play" title="Please either allow or decline the use of your microphone">Loading…</button>
        } else {
            return recorderUI()
        }
      }
      
    return (
        recorderRenderer()
    )
}

export default Recorder
