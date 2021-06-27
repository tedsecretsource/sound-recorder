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

    let didCancel = false

    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!didCancel) {
          setStream(stream);
        }
      } catch (err) {
        if (!didCancel) {
          setError(err);
        }
      }
    }

    const cancel = () => {
      didCancel = true;

      if (!stream) return;

      if ((stream).getAudioTracks) {
        (stream).getAudioTracks().map(track => track.stop());
      }

      if ((stream).stop) {
        (stream).stop();
      }
    }

    getUserMedia();

    return cancel;
  }, [constraints, stream, error])

  const recoderRenderer = () => {
    if( stream === null ) {
      return (<button className="record-play">Loading…</button>)
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
