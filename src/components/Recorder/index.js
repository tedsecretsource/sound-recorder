import { useState } from 'react'
import PropTypes from 'prop-types'
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

        const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' })
        chunks = []
        const audioURL = window.URL.createObjectURL(blob)
        setRecordings(recordings => {
            return [...recordings, ...[{
                stream: audioURL, 
                name: new Date().toISOString().split('.')[0].split('T').join(' '),
                id: `id${recordings.length}`
            }]]
        })
        setRecordButtonClassesText(defaultRecordClass)
        setRecordingStateText('Record')
    }


    const onStart = () => {

    
    }


    const ondataavailable = (e) => {
        chunks.push(e.data)
    }


    const toggleRecording = () => {

        if( 'Record' === recordingStateText ) {
            setRecordButtonClassesText(defaultRecordClass + ' recording-audio')
            setRecordingStateText('Stop')
            mediaRecorder.start()
        } else {
            setRecordingStateText('Record')
            mediaRecorder.stop()
        }

    }

    const editRecordingName = (e) => {
        let id = e.target.parentNode.parentNode.attributes.id.value
        let newRecordings = [...recordings]
        let targetItem = recordings.filter((item) => {
            if( item.id === id ) {
                return item
            }
            return false
        })
        let index = recordings.indexOf(targetItem[0])
        let newName = window.prompt('Enter a new name', targetItem[0].name) ?? targetItem[0].name // necessary because this returns null if the user doesn't enter anything
        targetItem[0].name = newName
        newRecordings.splice(index, 1, targetItem[0])
        setRecordings(newRecordings)
    }

    const deleteRecording = (e) => {
        let id = e.target.parentNode.attributes.id.value
        let deleteRecording = window.confirm('Are you sure you want to delete this recording?')
        if (deleteRecording === true) {
            let newRecordings = recordings.filter((item) => {
                if (id !== item.id) {
                    return true
                }
                return false
            })
            e.target.parentNode.classList.add('vanish')
            setTimeout(() => {
                setRecordings([...newRecordings])
            }, 1000)
        }
    }

    const mediaRecorder = useMediaRecorder(stream, recordButtonClassesText, {onStart: onStart, onStop: onStop, ondataavailable: ondataavailable})

    const renderAudio = () => {
        let audios = recordings.map((recording, index) => {
            let customKey = `id${index}`
            return (
                <Recording 
                    stream={recording.stream} 
                    key={customKey} 
                    name={recording.name} 
                    id={recording.id} 
                    onDeleteHandler={deleteRecording} 
                    onEditNameHandler={editRecordingName} />
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
    stream: PropTypes.object
};

export default Recorder
