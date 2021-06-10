import { useState } from 'react'
import useMediaRecorder from '../../hooks/useMediaRecorder'
//import Visualizer from '../Visualizer'
import Recording from '../Recording'
import './style.css'

const Recorder = ({stream}) => {
    const [recordingStateText, setRecordingStateText] = useState('Record')
    const [recordings, setRecordings] = useState([])
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [recordButtonClassesText, setRecordButtonClassesText] = useState('record-play')
    let recordButtonClasses = [recordButtonClassesText]
    let chunks = []


    const onStop = () => {

        const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        recordings.push({stream: audioURL})
        recordButtonClasses.pop()
        setRecordButtonClassesText(recordButtonClasses.join(' '))
        setRecordings(recordings)
        setRecordingStateText('Record')

    }


    const onStart = () => {

        recordButtonClasses.push('recording-audio')
        setRecordButtonClassesText(recordButtonClasses.join(' '))
        setRecordingStateText('Stop')
    
    }


    const ondataavailable = (e) => {
        chunks.push(e.data);
    }

    
    const toggleRecording = () => {

        if( 'Record' === recordingStateText ) {
            mediaRecorder.start();
        } else {
            mediaRecorder.stop();
        }

    }

    useMediaRecorder(stream, recordButtonClassesText, chunks, onStart, onStop, ondataavailable, setMediaRecorder, mediaRecorder)

    const renderAudio = () => {

        let audios = recordings.map((recording, index) => {
            return (
                <Recording stream={recording.stream} key={recording.stream.toString()} />
            )   
        })
        
        return audios

    }


    return (
        <>
            <button onClick={toggleRecording} className={recordButtonClassesText}>{recordingStateText}</button>
            {renderAudio()}
        </>
    )
}

Recorder.propTypes = {
    //stream: PropTypes.node
};

export default Recorder;
