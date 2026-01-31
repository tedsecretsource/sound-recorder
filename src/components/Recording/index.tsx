import { useRef } from 'react'
import { QualityMetadata, formatQualityBadge } from '../../types/AudioSettings'
import './style.css'

interface RecordingProps {
    streamURL: string
    name: string
    onDeleteHandler: (id: number) => void
    onEditNameHandler: (id: number) => void
    id: number
    mimeType: string
    quality?: QualityMetadata
}

const Recording = (props: RecordingProps) => {
    const { streamURL, name, onDeleteHandler, onEditNameHandler, id, mimeType, quality } = props
    const articleRef = useRef<HTMLElement>(null)

    const deleteRecording = () => {
        articleRef.current?.classList.add('vanish')
        onDeleteHandler(id)
    }

    const editName = () => {
        onEditNameHandler(id)
    }

    return (
        <article ref={articleRef} id={id?.toString()}>
            <audio controls={true} preload="metadata" role="application">
                <source src={streamURL} type={mimeType} />
            </audio>
            <p>
                <span className="name" role="presentation">{name}</span>
                <button onClick={editName} className="editName" title="Click to edit name" aria-label="Click to edit name">✏️</button>
            </p>
            {quality && (
                <p className="quality-badge">
                    <span className={`badge badge-${quality.preset}`}>
                        {formatQualityBadge(quality.preset)}
                    </span>
                </p>
            )}
            <button onClick={deleteRecording} className="delete">Delete</button>
        </article>
    )
}

export default Recording
