import { useState } from 'react'
import useMediaRecorder from '../../hooks/useMediaRecorder'
//import Visualizer from '../Visualizer'
import Recording from '../Recording'
import './style.css'

const Recorder = ({stream}) => {
    const defaultRecordClass = 'record-play'
    const [recordingStateText, setRecordingStateText] = useState('Record')
    const [recordings, setRecordings] = useState([])
    const [recordButtonClassesText, setRecordButtonClassesText] = useState(defaultRecordClass)
    let chunks = []

    const onStop = () => {

        const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        recordings.push({stream: audioURL, name: new Date().toISOString().split('.')[0].split('T').join(' ')})
        setRecordings(recordings)
        setRecordButtonClassesText(defaultRecordClass)
        setRecordingStateText('Record')

    }


    const onStart = () => {

    
    }


    const ondataavailable = (e) => {
        chunks.push(e.data);
    }


    const toggleRecording = () => {

        if( 'Record' === recordingStateText ) {
            setRecordButtonClassesText(defaultRecordClass + ' recording-audio')
            setRecordingStateText('Stop')
            mediaRecorder.start(1000)
        } else {
            setRecordingStateText('Record')
            mediaRecorder.stop()
        }

    }

    const mediaRecorder = useMediaRecorder(stream, recordButtonClassesText, {onStart: onStart, onStop: onStop, ondataavailable: ondataavailable})

    const renderAudio = () => {
        let audios = recordings.map((recording, index) => {
            return (
                <Recording stream={recording.stream} key={index} name={recording.name} />
            )   
        })
        
        return audios

    }


    return (
        <>
            <button onClick={toggleRecording} className={recordButtonClassesText}>{recordingStateText}</button>
            <section>
                {renderAudio()}
            </section>
        </>
    )
}

Recorder.propTypes = {
    //stream: PropTypes.node
};

export default Recorder
