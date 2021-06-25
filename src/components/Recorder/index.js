import { useMemo } from 'react'
import PropTypes from 'prop-types'
import Recording from '../Recording'
import './style.css'
import useMediaRecorder from "../../hooks/useMediaRecorder";

const Recorder = ({stream}) => {
    const { recorder, recordings, setRecordings, isRecording } = useMediaRecorder(stream);

    const defaultRecordClass = 'record-play'
    const recordButtonClassesText = useMemo(() => isRecording ? `${defaultRecordClass} recording-audio` : defaultRecordClass, [isRecording])
    const recordingStateText = useMemo(() => isRecording ? 'Stop' : 'Record', [isRecording])

    const toggleRecording = () => {
        if (!isRecording) {
            recorder.start(1000)
        } else {
            recorder.stop();
        }
    }

    const editRecordingName = (id) => {
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

    const deleteRecording = (id) => {
        let deleteRecording = window.confirm('Are you sure you want to delete this recording?')
        if (deleteRecording === true) {
            let newRecordings = recordings.filter((item) => {
                if (id !== item.id) {
                    return true
                }
                return false
            })
            setRecordings([...newRecordings])
        }
    }

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
