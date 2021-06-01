import { useState, useRef } from 'react'
//import Visualizer from '../Visualizer'
import Recording from '../Recording'
import './style.css'

const Recorder = () => {
    const [recordingStateText, setRecordingStateText] = useState('Record')
    const [recordings, setRecordings] = useState([])
    const constraints = { audio: true }
    const mediaRecorder = useRef(null)
    let chunks = []

    const onStop = async (e) => {
        const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        recordings.push({stream: audioURL})
        setRecordings(recordings)
        console.log('Just finished recording some data')
        console.log({recordings})
    }

    const initMediaRecorder = async () => {

        let currstream = null
        
        if( mediaRecorder.current === null ) {
            try {
                currstream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch(err) {
                console.log('Whoops! Cannot get a stream')
                return
            }
        
            mediaRecorder.current = new MediaRecorder(currstream);
            mediaRecorder.current.onstop = onStop
            mediaRecorder.current.ondataavailable = function(e) {
                chunks.push(e.data);
            }
        
        }
    
    }
    

    const toggleRecording = async () => {
        
        await initMediaRecorder()

        if( mediaRecorder.current ) {
            console.log({recordingStateText})
            if( 'Record' === recordingStateText ) {
                mediaRecorder.current.start();
                setRecordingStateText('Stop')
            } else {
                console.log(mediaRecorder.current.state)
                console.log({recordings})
                await mediaRecorder.current.stop();
                console.log(mediaRecorder.current.state)
                console.log({recordings})
                mediaRecorder.current = null;
                setRecordingStateText('Record')
            }
        }
        
    }

    const renderAudio = () => {
        let audios = recordings.map((recording, index) => {
            return (
                <Recording stream={recording.stream} key={recording.stream.toString()} />
            )   
        })
        return audios
    }

    const ui = () => {
        if( navigator.mediaDevices.getUserMedia ) {
            // create the recorder
            return (
                <>
                <button onClick={toggleRecording}>{recordingStateText}</button>
                {renderAudio()}
                </>
            )
        } else {
            return (
                <>
                    <p className="warning">Sorry. This device doesn't support recording using this application.</p>
                </>
            )
        }
    }
    
    return (
        <>
        {ui()}
        </>
    )
}

Recorder.propTypes = {
    //stream: PropTypes.node
};

export default Recorder;
