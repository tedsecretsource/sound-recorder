import './style.css'


const Recording = ({ stream }) => {

    const deleteRecording = () => {

    }
    const editName = () => {

    }

    return (
        <>
        <article key={stream.toString()}>
            <audio controls="controls" src={stream}></audio>
            <p><span className="name">Unnamed recording</span>
            <button onClick={editName} className="editName" title="Click to edit name">✏️</button>
            </p>
            <button onClick={deleteRecording} className="delete">Delete</button>
        </article>
        </>
    );
}

Recording.propTypes = {

}

export default Recording;