import { useState } from 'react'
import PropTypes from 'prop-types'
import './style.css'


const Recording = ({ stream, name }) => {
    const [recordingName, setRecordingName] = useState(name)

    const deleteRecording = () => {

    }

    const editName = () => {
        let newName = window.prompt('Enter a new name', recordingName) ?? recordingName // necessary because this returns null if the user doesn't enter anything
        setRecordingName(newName)
    }

    return (
        <>
        <article>
            <audio controls="controls" src={stream} preload="auto" role="application">Sorry, your browser doesn't support recording audio.</audio>
            <p><span className="name" role="presentation">{recordingName}</span>
            <button onClick={editName} className="editName" title="Click to edit name">✏️</button>
            </p>
            <button onClick={deleteRecording} className="delete">Delete</button>
        </article>
        </>
    );
}

Recording.propTypes = {
    stream: PropTypes.string,
    name: PropTypes.string
}

export default Recording;