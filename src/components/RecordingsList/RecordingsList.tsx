/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import Recording from '../Recording'
import useIndexedDB from '../../hooks/useIndexedDB'
import useGetMediaRecorder from '../../hooks/useGetMediaRecorder'
import { Recording as RecordingType } from '../../SoundRecorderTypes'
import './style.css'

const RecordingsList = () => {
    const [recordings, setRecordings] = useState<RecordingType[]>([])
    const mediaRecorder = useGetMediaRecorder()
    const {
        connectionIsOpen,
        getRecordingFromDB, 
        getAllRecordingsFromDB, 
        addRecording, 
        putRecording,
        deleteRecordingFromDB
    } = useIndexedDB()

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

    const getRecordingsList = () => {
        if( mediaRecorder === null ) {
            return (
                <>
                    <p>Loading recordings…</p>
                </>
            )
        } else {
            return recordings.slice(0).reverse().map((recording, index) => {
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
        }
    }

    return (
        <>
            {getRecordingsList()}
        </>
    )
}

export default RecordingsList