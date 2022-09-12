import './style.css'

interface RecordingProps {
    streamURL: string,
    name: string,
    onDeleteHandler: (e) => void,
    onEditNameHandler: (e) => void,
    id: string
}

const Recording = (props: RecordingProps) => {

    const { streamURL, name, onDeleteHandler, onEditNameHandler, id } = props

    const deleteRecording = (e) => {
        onDeleteHandler(e)
    }

    const editName = (e) => {
        onEditNameHandler(e)
    }

    return (
        <article id={id}>
            <audio controls={true} src={streamURL} preload="auto" role="application">Sorry, your browser doesn't support recording audio.</audio>
            <p>
                <span className="name" role="presentation">{name}</span>
                <button onClick={editName} className="editName" title="Click to edit name" aria-label="Click to edit name">✏️</button>
            </p>
            <button onClick={deleteRecording} className="delete">Delete</button>
        </article>
    )
}

export default Recording;