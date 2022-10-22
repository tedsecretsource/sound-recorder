import { useEffect, useMemo, useState } from 'react'
import useConfigureMediaRecorder from '../../hooks/useConfigureMediaRecroder'
import Recording from '../Recording'
import Visualizer from '../Visualizer'
import './style.css'

interface recorderProps {
    mediaRecorder?: MediaRecorder
}
  
const Recorder = (props?: recorderProps) => {
    const { mediaRecorder } = props
    const { recorder, recordings, setRecordings, isRecording, stream } = useConfigureMediaRecorder({mediaRecorder})
    const [recorderState, setRecorderState] = useState(recorder.state)
    const defaultRecordClass = 'record-play'
    const recordButtonClassesText = useMemo(() => recorder.state === 'recording' ? `${defaultRecordClass} recording-audio` : defaultRecordClass, [recorder.state])
    const recordingStateText = useMemo(() => recorder.state === 'recording' ? 'Stop' : 'Record', [recorder.state])

    const toggleRecording = () => {
        console.log('toggling recording')
        console.log(recorder.state)
        if (recorder.state === 'inactive') {
            recorder.start(1000)
        } else {
            recorder.stop();
        }
        setRecorderState(recorder.state)
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
        console.log('recorder state: ', recorder.state)
        return (
            <>
                <Visualizer stream={stream} barColor={[18,124,85]} />
                <button onClick={toggleRecording} className={recordButtonClassesText}>{recorder.state === 'recording' ? 'Stop' : 'Record'}</button>
                <section>
                    {renderAudio()}
                </section>
            </>
        )
    }

    const recorderRenderer = () => {
        if( recorder && recorder.stream === null ) {
            return <button className="record-play" title="Please either allow or decline the use of your microphone">Loading…</button>
        } else {
            return recorderUI()
        }
      }
      
      return (
        recorderRenderer()
    )
}

export default Recorder
