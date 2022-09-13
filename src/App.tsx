import Recorder from './components/Recorder'
import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const constraints = {audio: true}
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // we call this here because we are setting state and if you set state
    // on initial render, it will cause a re-render loop
    getUserMedia()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const getUserMedia = async () => {
    navigator.mediaDevices.getUserMedia({video: false, audio: true})
      .then((stream) => {
        setStream(stream)
      })
      .catch((error) => {
        console.log(error)
      })
  }

  const recoderRenderer = () => {
    if( stream === null ) {
      return <button className="record-play">Loading…</button>
    }
    return (
      <Recorder stream={stream} />
    )
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
