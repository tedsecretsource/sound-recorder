import { useRef } from 'react'
import { QualityMetadata, formatQualityBadge } from '../../types/AudioSettings'
import { isDefaultRecordingName } from '../../SoundRecorderTypes'
import { BstCategory, BST_CATEGORIES } from '../../types/Freesound'
import './style.css'

interface RecordingProps {
    streamURL: string
    name: string
    description?: string
    bstCategory?: BstCategory
    onDeleteHandler: (id: number) => void
    onEditNameHandler: (id: number) => void
    onEditDescriptionHandler: (id: number) => void
    onBstCategoryChange: (id: number, category: BstCategory) => void
    id: number
    mimeType: string
    quality?: QualityMetadata
    freesoundId?: number
}

const Recording = (props: RecordingProps) => {
    const { streamURL, name, description, bstCategory, onDeleteHandler, onEditNameHandler, onEditDescriptionHandler, onBstCategoryChange, id, mimeType, quality, freesoundId } = props
    const articleRef = useRef<HTMLElement>(null)

    const deleteRecording = () => {
        articleRef.current?.classList.add('vanish')
        onDeleteHandler(id)
    }

    const editName = () => {
        onEditNameHandler(id)
    }

    const editDescription = () => {
        onEditDescriptionHandler(id)
    }

    const hasCustomName = !isDefaultRecordingName(name)
    const hasDescription = Boolean(description?.trim())
    const readyForSync = hasCustomName && hasDescription

    return (
        <article ref={articleRef} id={id?.toString()}>
            <audio controls={true} preload="metadata" role="application">
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
            <p className="bst-category-row">
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
            </p>
            {quality && (
                <p className="quality-badge">
                    <span className={`badge badge-${quality.preset}`}>
                        {formatQualityBadge(quality.preset)}
                    </span>
                </p>
            )}
            {freesoundId ? (
                <p className="sync-status synced">Synced to Freesound</p>
            ) : readyForSync ? (
                <p className="sync-status ready">Ready to sync</p>
            ) : (
                <p className="sync-status not-ready">
                    {!hasCustomName && 'Rename to sync'}
                    {!hasCustomName && !hasDescription && ' · '}
                    {!hasDescription && 'Add description to sync'}
                </p>
            )}
            <button onClick={deleteRecording} className="delete">Delete</button>
        </article>
    )
}

export default Recording
