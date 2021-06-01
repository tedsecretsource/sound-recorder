import './style.css'


const Recording = ({ stream }) => {

    const deleteRecording = () => {

    }

    return (
        <>
        <article key={stream.toString()}>
            <audio controls="controls" src={stream}></audio>
            <p>Unnamed recording</p>
            <button onClick={deleteRecording}>Delete</button>
        </article>
        </>
    );
}

Recording.propTypes = {

}

export default Recording;