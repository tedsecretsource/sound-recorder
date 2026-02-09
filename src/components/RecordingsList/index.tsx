import { useEffect } from 'react'
import Recording, { RecordingActions, RecordingData } from '../Recording'
import { useMediaRecorder } from '../../App'
import { useRecordings } from '../../contexts/RecordingsContext'
import { useSync } from '../../contexts/SyncContext'
import { validateRecordingName } from '../../utils/recordingUtils'
import { BstCategory } from '../../types/Freesound'
import logger from '../../utils/logger'
import { ANIMATION } from '../../constants/config'
import './style.css'

const RecordingsList = () => {
    const { mediaRecorder, isInitializing, error } = useMediaRecorder()
    const { recordings, updateRecording, deleteRecording: deleteRecordingFromDB } = useRecordings()
    const { triggerSync, retryModeration } = useSync()

    // Trigger sync when the Recordings List screen is opened
    useEffect(() => {
        triggerSync()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const editRecordingName = async (id: number) => {
        const targetItem = recordings.find((item) => item.id === id)
        if (!targetItem) return

        const promptedName = window.prompt('Enter a new name', targetItem.name) ?? targetItem.name
        const newName = validateRecordingName(promptedName, targetItem.name)
        if (newName === targetItem.name && promptedName !== targetItem.name) {
            logger.info('The name must not be blank and less than 500 characters.')
            return
        }

        try {
            await updateRecording({ ...targetItem, name: newName })
            logger.debug('Saved recording name')
        } catch (error) {
            logger.error('Failed to update recording name:', error)
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
            logger.debug('Saved description')
        } catch (error) {
            logger.error('Failed to update description:', error)
        }
    }

    const handleBstCategoryChange = async (id: number, category: BstCategory) => {
        const targetItem = recordings.find((item) => item.id === id)
        if (!targetItem) return

        try {
            await updateRecording({ ...targetItem, bstCategory: category })
        } catch (error) {
            logger.error('Failed to update category:', error)
        }
    }

    const handleDeleteRecording = async (id: number) => {
        const shouldDelete = window.confirm('Are you sure you want to delete this recording?')
        if (shouldDelete) {
            // Animation is handled by the Recording component
            setTimeout(async () => {
                await deleteRecordingFromDB(id)
            }, ANIMATION.DELETE_DURATION_MS)
        }
    }

    const actions: RecordingActions = {
        onDelete: handleDeleteRecording,
        onEditName: editRecordingName,
        onEditDescription: editRecordingDescription,
        onBstCategoryChange: handleBstCategoryChange,
        onRetryModeration: retryModeration,
    }

    const getRecordingsList = () => {
        if (isInitializing) {
            return <p>Loading recordings…</p>
        }

        if (error) {
            return <p>Error accessing microphone: {error}</p>
        }

        if (!mediaRecorder) {
            return <p>Loading recordings…</p>
        }

        return recordings.slice(0).reverse().map((rec) => {
            const recordingData: RecordingData = {
                id: rec.id!,
                streamURL: rec.audioURL,
                name: rec.name,
                description: rec.description,
                bstCategory: rec.bstCategory,
                quality: rec.quality,
                freesoundId: rec.freesoundId,
                moderationStatus: rec.moderationStatus,
            }

            return (
                <Recording
                    key={rec.id}
                    recording={recordingData}
                    mimeType={mediaRecorder.mimeType}
                    actions={actions}
                />
            )
        })
    }

    return (
        <>
            {getRecordingsList()}
        </>
    )
}

export default RecordingsList