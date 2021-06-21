import PropTypes from 'prop-types'
import './style.css'


const Recording = ({ stream, name, onDeleteHandler, onEditNameHandler, id }) => {

    const deleteRecording = (id) => {
        onDeleteHandler(id)
    }

    const editName = (id) => {
        onEditNameHandler(id)
    }

    return (
        <>
        <article id={id}>
            <audio controls="controls" src={stream} preload="auto" role="application">Sorry, your browser doesn't support recording audio.</audio>
            <p><span className="name" role="presentation">{name}</span>
            <button onClick={() => editName(id)} className="editName" title="Click to edit name">✏️</button>
            </p>
            <button onClick={() => deleteRecording(id)} className="delete">Delete</button>
        </article>
        </>
    );
}

Recording.defaultProps = {
    stream: {
        stream: 'blob:http://localhost',
        name: 'Default recording name',
        id: 'id0'
    }
  };

Recording.propTypes = {
    stream: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string,
    onDeleteHandler: PropTypes.func,
    onEditNameHandler: PropTypes.func
}

export default Recording;