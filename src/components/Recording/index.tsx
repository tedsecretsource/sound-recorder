import './style.css'

interface RecordingProps {
    streamURL: string,
    name: string,
    onDeleteHandler: (e) => void,
    onEditNameHandler: (e) => void,
    id: number,
    mimeType: string
}

const Recording = (props: RecordingProps) => {

    const { streamURL, name, onDeleteHandler, onEditNameHandler, id, mimeType } = props

    const deleteRecording = (e: any) => {
        onDeleteHandler(e)
    }

    const editName = (e: any) => {
        onEditNameHandler(e)
    }

    return (
        <article id={id?.toString()}>
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

export default Recording;