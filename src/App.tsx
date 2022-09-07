import Recorder from './components/Recorder'
import './App.css';
import { useEffect, useState, useMemo } from 'react';

function App() {
  const constraints = useMemo(() => { return {audio: true} }, [])
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if ( stream ) {
      return
    }

    getUserMedia();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream])

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setStream(stream)
    } catch (err) {
        setError(err)
    }
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
