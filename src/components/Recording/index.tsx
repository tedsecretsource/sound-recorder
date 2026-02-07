import { useRef, useEffect } from 'react'
import { QualityMetadata, formatQualityBadge } from '../../types/AudioSettings'
import { isDefaultRecordingName } from '../../SoundRecorderTypes'
import { BstCategory, BST_CATEGORIES, ModerationStatus } from '../../types/Freesound'
import './style.css'

/** Callback handlers for recording actions */
export interface RecordingActions {
    onDelete: (id: number) => void
    onEditName: (id: number) => void
    onEditDescription: (id: number) => void
    onBstCategoryChange: (id: number, category: BstCategory) => void
    onRetryModeration?: (id: number) => void
}

/** Data from a recording needed for display */
export interface RecordingData {
    id: number
    streamURL: string
    name: string
    description?: string
    bstCategory?: BstCategory
    quality?: QualityMetadata
    freesoundId?: number
    moderationStatus?: ModerationStatus
}

interface RecordingProps {
    recording: RecordingData
    mimeType: string
    actions: RecordingActions
}

const Recording = ({ recording, mimeType, actions }: RecordingProps) => {
    const { id, streamURL, name, description, bstCategory, quality, freesoundId, moderationStatus } = recording
    const { onDelete, onEditName, onEditDescription, onBstCategoryChange, onRetryModeration } = actions
    const articleRef = useRef<HTMLElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    // Force duration calculation for blob URLs
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        let seekingToEnd = false

        const forceDurationCalculation = () => {
            if (!isFinite(audio.duration)) {
                seekingToEnd = true
                audio.currentTime = Number.MAX_SAFE_INTEGER
            }
        }

        const handleSeeked = () => {
            if (seekingToEnd) {
                seekingToEnd = false
                audio.currentTime = 0
            }
        }

        audio.addEventListener('loadedmetadata', forceDurationCalculation)
        audio.addEventListener('seeked', handleSeeked)

        // Handle case where metadata already loaded
        if (audio.readyState >= 1 && !isFinite(audio.duration)) {
            forceDurationCalculation()
        }

        return () => {
            audio.removeEventListener('loadedmetadata', forceDurationCalculation)
            audio.removeEventListener('seeked', handleSeeked)
        }
    }, [streamURL])

    const deleteRecording = () => {
        articleRef.current?.classList.add('vanish')
        onDelete(id)
    }

    const editName = () => {
        onEditName(id)
    }

    const editDescription = () => {
        onEditDescription(id)
    }

    const hasCustomName = !isDefaultRecordingName(name)
    const hasDescription = Boolean(description?.trim())
    const readyForSync = hasCustomName && hasDescription

    return (
        <article ref={articleRef} id={id?.toString()}>
            <audio ref={audioRef} controls={true} preload="metadata" role="application">
                <source src={streamURL} type={mimeType} />
            </audio>
            <p>
                <span className="name" role="presentation">{name}</span>
                <button onClick={editName} className="editName" title="Click to edit name" aria-label="Click to edit name">✏️</button>
            </p>
            <p className="description-row">
                <span className="description" role="presentation">
                    {description?.trim() || <em className="no-description">No description</em>}
                </span>
                <button onClick={editDescription} className="editDescription" title="Click to edit description" aria-label="Click to edit description">✏️</button>
            </p>
            <div className="metadata-row">
                {quality && (
                    <span className={`badge badge-${quality.preset}`}>
                        {formatQualityBadge(quality.preset)}
                    </span>
                )}
                <label htmlFor={`bst-${id}`}>Category: </label>
                <select
                    id={`bst-${id}`}
                    className="bst-select"
                    value={bstCategory || 'fx-other'}
                    onChange={(e) => onBstCategoryChange(id, e.target.value as BstCategory)}
                    disabled={!!freesoundId}
                >
                    {Object.entries(BST_CATEGORIES).map(([code, label]) => (
                        <option key={code} value={code}>{label}</option>
                    ))}
                </select>
            </div>
            <div className="actions-row">
                {freesoundId && moderationStatus === 'moderation_failed' ? (
                    <span className="sync-status moderation-failed">
                        Moderation Failed
                        {onRetryModeration && (
                            <button className="retry-button" onClick={() => onRetryModeration(id)}>Retry</button>
                        )}
                    </span>
                ) : freesoundId && moderationStatus === 'in_moderation' ? (
                    <span className="sync-status in-moderation">In Moderation</span>
                ) : freesoundId && moderationStatus === 'processing' ? (
                    <span className="sync-status processing">Processing...</span>
                ) : freesoundId ? (
                    <span className="sync-status synced">Synced to Freesound</span>
                ) : readyForSync ? (
                    <span className="sync-status ready">Ready to sync</span>
                ) : (
                    <span className="sync-status not-ready">
                        {!hasCustomName && 'Rename to sync'}
                        {!hasCustomName && !hasDescription && ' · '}
                        {!hasDescription && 'Add description to sync'}
                    </span>
                )}
                <button onClick={deleteRecording} className="delete">Delete</button>
            </div>
        </article>
    )
}

export default Recording
