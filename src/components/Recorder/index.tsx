import { useEffect, useMemo, useState } from 'react'
import Recording from '../Recording'
import Visualizer from '../Visualizer'
import './style.css'

interface recorderProps {
    mediaRecorder?: MediaRecorder
}
  
const Recorder = (props?: recorderProps) => {
    const { mediaRecorder } = props
    const [recorderState, setRecorderState] = useState('inactive')
    const [recordings, setRecordings] = useState<any[]>([]);
    const defaultRecordClass = 'record-play'
    let recordButtonClassesText = defaultRecordClass
    let chunks: any[] = useMemo(() => [], [])

    useEffect(() => {
        if( mediaRecorder ) {

            mediaRecorder.onstart = () => {
                console.log('started recording')
            }
        
            mediaRecorder.onstop = () => {
                console.log('stopped recording')
            }
        
            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data)
            }
        }
    }, [mediaRecorder, chunks])

    const updateRecordingsList = () => {
        const blob = new Blob(chunks, { 'type' : mediaRecorder.mimeType })
        const audioURL = window.URL.createObjectURL(blob)
    
        // push the new recording to the recordings list
        setRecordings(currentRecordings => {
            return [...currentRecordings, ...[{
                stream: audioURL,
                name: new Date().toISOString().split('.')[0].split('T').join(' '),
                id: `id${window.performance.now().toString()}`
            }]]
        })
    
        chunks = []
    }

    const toggleRecording = () => {
        if (mediaRecorder.state === 'inactive') {
            mediaRecorder.start(1000)
        } else {
            mediaRecorder.stop()
            updateRecordingsList()
        }
        setRecorderState(mediaRecorder.state)
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
        recordButtonClassesText = mediaRecorder.state === 'recording' ? `${defaultRecordClass} recording-audio` : defaultRecordClass
        return (
            <>
                <Visualizer stream={mediaRecorder.stream} barColor={[18,124,85]} />
                <button onClick={toggleRecording} className={recordButtonClassesText}>{mediaRecorder.state === 'recording' ? 'Stop' : 'Record'}</button>
                <section className="recordings-list">
                    {renderAudio()}
                </section>
            </>
        )
    }

    const recorderRenderer = () => {
        if( mediaRecorder === null ) {
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
