import { useMemo } from 'react'
import Recording from '../Recording'
import Visualizer from '../Visualizer'
import './style.css'
import useMediaRecorder from "../../hooks/useMediaRecorder";

const Recorder = () => {
    const { recorder, recordings, setRecordings, isRecording, stream } = useMediaRecorder();
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
            }, 900)
        }
    }

    const renderAudio = () => {
        let audios = recordings.map((recording, index) => {
            return (
                <Recording 
                    streamURL={recording.stream} 
                    key={recording.id} 
                    name={recording.name} 
                    id={recording.id} 
                    onDeleteHandler={deleteRecording} 
                    onEditNameHandler={editRecordingName} />
            )
        })
        
        return audios

    }

    const recorderUI = () => {
        return (
            <>
                <Visualizer stream={stream} barColor={[18,124,85]} />
                <button onClick={toggleRecording} className={recordButtonClassesText}>{recordingStateText}</button>
                <section>
                    {renderAudio()}
                </section>
            </>
        )
    }

    const recorderRenderer = () => {
        if( stream === null ) {
          return <button className="record-play" title="Please either allow or decline the use of your microphone">Loading…</button>
        } else if ( stream instanceof MediaStream ) {
          return recorderUI()
        } else {
          return <button className="record-play">Error: unknown!</button>
        }
      }
      
      return (
        recorderRenderer()
    )
}

export default Recorder
