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
    if( stream ) return
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
