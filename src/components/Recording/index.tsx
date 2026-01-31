import { useRef } from 'react'
import './style.css'

interface RecordingProps {
    streamURL: string
    name: string
    onDeleteHandler: (id: number) => void
    onEditNameHandler: (id: number) => void
    id: number
    mimeType: string
}

const Recording = (props: RecordingProps) => {
    const { streamURL, name, onDeleteHandler, onEditNameHandler, id, mimeType } = props
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
            <button onClick={deleteRecording} className="delete">Delete</button>
        </article>
    )
}

export default Recording