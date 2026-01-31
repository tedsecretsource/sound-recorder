import { useState } from 'react'
import Recording from '../Recording'
import { useMediaRecorder } from '../../App'
import { useRecordings } from '../../contexts/RecordingsContext'
import { validateRecordingName } from '../../utils/recordingUtils'
import './style.css'

const RecordingsList = () => {
    const mediaRecorder = useMediaRecorder()
    const { recordings, updateRecording, deleteRecording: deleteRecordingFromDB } = useRecordings()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const editRecordingName = async (id: number) => {
        const targetItem = recordings.find((item) => item.id === id)
        if (!targetItem) return

        const promptedName = window.prompt('Enter a new name', targetItem.name) ?? targetItem.name
        const newName = validateRecordingName(promptedName, targetItem.name)
        if (newName === targetItem.name && promptedName !== targetItem.name) {
            console.info('The name must not be blank and less than 500 characters.')
            return
        }

        try {
            await updateRecording({ ...targetItem, name: newName })
            console.info('saved recording')
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteRecording = async (id: number) => {
        const shouldDelete = window.confirm('Are you sure you want to delete this recording?')
        if (shouldDelete) {
            setDeletingId(id)
            // Animation is now handled by the Recording component
            setTimeout(async () => {
                await deleteRecordingFromDB(id)
                setDeletingId(null)
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
            return recordings.slice(0).reverse().map((recording) => {
                return (
                    <Recording
                    streamURL={recording.audioURL}
                    key={recording.id}
                    name={recording.name}
                    id={recording.id!}
                    onDeleteHandler={handleDeleteRecording}
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