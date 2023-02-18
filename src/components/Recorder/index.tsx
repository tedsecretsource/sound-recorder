import { useEffect, useState } from 'react'
import useIndexedDB from '../../hooks/useIndexedDB'
import Recording from '../Recording'
import Visualizer from '../Visualizer'
import './style.css'

interface recorderProps {
    mediaRecorder?: MediaRecorder
}
  
const Recorder = (props?: recorderProps) => {
    const { mediaRecorder } = props
    const {
        connectionIsOpen,
        getRecordingFromDB, 
        getAllRecordingsFromDB, 
        addRecording, 
        putRecording,
        deleteRecordingFromDB
    } = useIndexedDB()
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
                console.info('started recording')
            }
        
            mediaRecorder.onstop = () => {
                console.info('stopped recording')
            }
        
            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data)
            }
        }
    }, [mediaRecorder, chunks])

    useEffect(() => {
        if( connectionIsOpen ) {
            getAllRecordingsFromDB()
                .then((savedRecordings) => {
                    // create a URL for each recording so we can play it
                    savedRecordings.forEach((recording) => {
                        if( null !== recording.data ) {
                            recording.audioURL = window.URL.createObjectURL(recording.data)
                        }
                    })

                    setRecordings(savedRecordings)
                })
                .catch((error) => {
                    console.error(error)
                })
            }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectionIsOpen])

    const updateRecordingsList = () => {
        const blob = new Blob(chunks, { 'type' : mediaRecorder.mimeType })
        const audioURL = window.URL.createObjectURL(blob)
        // console.error('currentRecording', currentRecording)
    
        const newRecordingObj = {
            data: blob,
            audioURL: audioURL,
            name: new Date().toISOString().split('.')[0].split('T').join(' '),
            id: currentRecording,
            length: 0
        }
        
        // push the new recording to the recordings list
        setRecordings(recordings => {
            return [...recordings, ...[newRecordingObj]]
        })
        
        if( connectionIsOpen ) {
            putRecording(newRecordingObj)
                .then(() => {
                    console.info('saved recording')
                })
                .catch((error) => {
                    console.error(error)
                })
        }
        chunks = []
    }

    const initRecording = async () => {
        if( connectionIsOpen ) {
            setCurrentRecording(await addRecording({ name: 'New Recording', length: 0, audioURL: '', data: null }))
        }
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
        newName = newName.replace(/^\s+|\s+$/g, "")
        if( newName === '' || newName === null || newName === undefined || newName.length > 500) {
            newName = targetItem[0].name
            console.info('The name must not be blank and less than 500 characters.')
        }
        targetItem[0].name = newName
        newRecordings.splice(index, 1, targetItem[0])
        // commit new name to database
        if( connectionIsOpen ) {
            putRecording(targetItem[0])
                .then(() => {
                    console.info('saved recording')
                })
                .catch((error) => {
                    console.error(error)
                })
        }
        setRecordings(newRecordings)
    }

    const deleteRecording = async (e) => {
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
            await deleteRecordingFromDB(parseInt(id))
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
