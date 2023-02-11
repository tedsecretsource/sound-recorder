import { useEffect, useState } from 'react'
import { IDBPDatabase } from 'idb/with-async-ittr';
import { SoundRecorderDB } from '../../SoundRecorderTypes';
import Recording from '../Recording'
import Visualizer from '../Visualizer'
import './style.css'

interface recorderProps {
    mediaRecorder?: MediaRecorder
    db?: IDBPDatabase<SoundRecorderDB>
}
  
const Recorder = (props?: recorderProps) => {
    const { mediaRecorder, db } = props
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [recorderState, setRecorderState] = useState('inactive')
    const [recordings, setRecordings] = useState<any[]>([])
    const [currentRecording, setCurrentRecording] = useState(0)
    const defaultRecordClass = 'record-play'
    let recordButtonClassesText = defaultRecordClass
    // eslint-disable-next-line react-hooks/exhaustive-deps
    let chunks: any[] = []

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

    useEffect(() => {
        if( db ) {
            db.getAll('recordings').then((savedRecordings) => {
                // create a URL for each recording so we can play it
                savedRecordings.forEach((recording) => {
                    if( null !== recording.data ) {
                        recording.audioURL = window.URL.createObjectURL(recording.data)
                    }
                })

                setRecordings(savedRecordings)
            })
        }
    }, [db])

    const updateRecordingsList = () => {
        const blob = new Blob(chunks, { 'type' : mediaRecorder.mimeType })
        const audioURL = window.URL.createObjectURL(blob)
    
        // push the new recording to the recordings list
        setRecordings(currentRecordings => {
            const newRecording = {
                data: blob,
                audioURL: audioURL,
                name: new Date().toISOString().split('.')[0].split('T').join(' '),
                id: currentRecording,
                length: 0
            }
            db.put('recordings', newRecording)
            return [...currentRecordings, ...[newRecording]]
        })
    
        chunks = []
    }

    const initRecording = async () => {
        setCurrentRecording(await db.add('recordings', { name: 'New Recording', length: 0, audioURL: '', data: null }))
    }

    const toggleRecording = () => {
        if (mediaRecorder.state === 'inactive') {
            mediaRecorder.start(1000)
            // add a recording record to the database so we can get the ID
            initRecording()
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
            if( item.id === parseInt(id) ) {
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

    const deleteRecordingFromDB = async (id: number) => {
        await db.delete("recordings", id)
    }

    const deleteRecording = (e) => {
        let id = e.target.parentNode.attributes.id.value
        let deleteRecording = window.confirm('Are you sure you want to delete this recording?')
        if (deleteRecording === true) {
            let newRecordings = recordings.filter((item) => {
                if (parseInt(id) !== item.id) {
                    return true
                }
                return false
            })
            e.target.parentNode.classList.add('vanish')
            deleteRecordingFromDB(parseInt(id))
            setTimeout(() => {
                setRecordings([...newRecordings])
            }, 900)
        }
    }

    const renderAudio = () => {
        let audios = recordings.map((recording, index) => {
            return (
                <Recording 
                    streamURL={recording.audioURL} 
                    key={recording.id} 
                    name={recording.name} 
                    id={recording.id} 
                    onDeleteHandler={deleteRecording} 
                    onEditNameHandler={editRecordingName}
                    mimeType={mediaRecorder.mimeType} />
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
