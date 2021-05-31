import { useState, useRef } from 'react'
import Visualizer from '../Visualizer'

const Recorder = () => {
    const [recordingStateText, setRecordingStateText] = useState('Record')

    const constraints = { audio: true }
    const mediaRecorder = useRef(null)
    let chunks = []

    const onStop = () => {
        // add a recording to the list
        console.log('Just finished recording some data')
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
            if( 'Record' === recordingStateText ) {
                mediaRecorder.current.start();
                setRecordingStateText('Stop')
            } else {
                mediaRecorder.current.stop();
                setRecordingStateText('Record')
                mediaRecorder.current = null;
            }
        }
        
    }

    const ui = () => {
        if( navigator.mediaDevices.getUserMedia ) {
            // create the recorder
            return (
                <>
                <button onClick={toggleRecording}>{recordingStateText}</button>
                <audio></audio>
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
