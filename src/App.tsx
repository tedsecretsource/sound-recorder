import Recorder from './components/Recorder'
import './App.css';
import useGetUserMedia from "./hooks/useGetUserMedia";

function App() {
  let theStream = useGetUserMedia()

  const recoderRenderer = () => {
    if( theStream === null ) {
      return <button className="record-play" title="Please either allow or decline the use of your microphone">Loading…</button>
    } else if ( theStream instanceof MediaStream ) {
      return <Recorder stream={theStream} />
    } else if ( theStream instanceof DOMException ) {
      return <button className="record-play">Error: {theStream.message}</button>
    } else {
      return <button className="record-play">Error: unknown!</button>
    }
  }
  
  return (
    <>
    <header>
      <h1>Sound Recorder</h1>
    </header>
    <main>
      {recoderRenderer()}
    </main>
    </>
  );
}

export default App;
