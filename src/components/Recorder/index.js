import { useState } from 'react'
import useMediaRecorder from '../../hooks/useMediaRecorder'
//import Visualizer from '../Visualizer'
import Recording from '../Recording'
import './style.css'

const Recorder = ({stream}) => {
    const [recordingStateText, setRecordingStateText] = useState('Record')
    const [recordings, setRecordings] = useState([])
    const [recordButtonClassesText, setRecordButtonClassesText] = useState('record-play')
    let chunks = []

    const onStop = () => {

        const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        recordings.push({stream: audioURL})
        setRecordings(recordings)

    }


    const onStart = () => {

    
    }


    const ondataavailable = (e) => {
        chunks.push(e.data);
    }


    const toggleRecording = () => {

        if( 'Record' === recordingStateText ) {
            setRecordButtonClassesText(recordButtonClassesText + ' recording-audio')
            setRecordingStateText('Stop')
            mediaRecorder.start();
        } else {
            setRecordButtonClassesText(recordButtonClassesText.split(' ').reverse().pop().toString())
            setRecordingStateText('Record')
            mediaRecorder.stop();
        }

    }

    const mediaRecorder = useMediaRecorder(stream, recordButtonClassesText, {onStart: onStart, onStop: onStop, ondataavailable: ondataavailable})

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

export default Recorder
