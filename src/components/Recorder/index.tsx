import { useEffect, useState } from 'react'
import useIndexedDB from '../../hooks/useIndexedDB'
import useGetMediaRecorder from '../../hooks/useGetMediaRecorder'
import Visualizer from '../Visualizer'
import './style.css'

const Recorder = () => {
    const mediaRecorder = useGetMediaRecorder()
    const {
        connectionIsOpen,
        addRecording, 
        putRecording,
    } = useIndexedDB()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [recorderState, setRecorderState] = useState('inactive')
    const [currentRecording, setCurrentRecording] = useState(0)
    const defaultRecordClass = 'record-play'
    let recordButtonClassesText = defaultRecordClass
    // eslint-disable-next-line react-hooks/exhaustive-deps
    let chunks: any[] = []

    useEffect(() => {
        if( mediaRecorder ) {

            mediaRecorder.onstart = () => {
                console.info('started recording')
            }
        
            mediaRecorder.onstop = () => {
                console.info('stopped recording')
            }
        
            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data)
            }
        }
    }, [mediaRecorder, chunks])

    const updateRecordingsList = () => {
        const blob = new Blob(chunks, { 'type' : mediaRecorder.mimeType })
        const audioURL = window.URL.createObjectURL(blob)
    
        const newRecordingObj = {
            data: blob,
            audioURL: audioURL,
            name: new Date().toISOString().split('.')[0].split('T').join(' '),
            id: currentRecording,
            length: 0
        }
        
        if( connectionIsOpen ) {
            putRecording(newRecordingObj)
                .then(() => {
                    console.info('saved recording')
                })
                .catch((error) => {
                    console.error(error)
                })
        }
        chunks = []
    }

    const initRecording = async () => {
        if( connectionIsOpen ) {
            setCurrentRecording(await addRecording({ name: 'New Recording', length: 0, audioURL: '', data: null }))
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
