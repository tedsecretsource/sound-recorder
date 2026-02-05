import { useState } from 'react'
import Recording from '../Recording'
import { useMediaRecorder } from '../../App'
import { useRecordings } from '../../contexts/RecordingsContext'
import { validateRecordingName } from '../../utils/recordingUtils'
import { BstCategory } from '../../types/Freesound'
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

    const editRecordingDescription = async (id: number) => {
        const targetItem = recordings.find((item) => item.id === id)
        if (!targetItem) return

        const currentDescription = targetItem.description ?? ''
        const promptedDescription = window.prompt('Enter a description for Freesound', currentDescription)

        if (promptedDescription === null) return // User cancelled

        const newDescription = promptedDescription.trim()

        try {
            await updateRecording({ ...targetItem, description: newDescription })
            console.info('saved description')
        } catch (error) {
            console.error(error)
        }
    }

    const handleBstCategoryChange = async (id: number, category: BstCategory) => {
        const targetItem = recordings.find((item) => item.id === id)
        if (!targetItem) return

        try {
            await updateRecording({ ...targetItem, bstCategory: category })
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
                    description={recording.description}
                    bstCategory={recording.bstCategory}
                    id={recording.id!}
                    onDeleteHandler={handleDeleteRecording}
                    onEditNameHandler={editRecordingName}
                    onEditDescriptionHandler={editRecordingDescription}
                    onBstCategoryChange={handleBstCategoryChange}
                    mimeType={mediaRecorder.mimeType}
                    quality={recording.quality}
                    freesoundId={recording.freesoundId} />
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