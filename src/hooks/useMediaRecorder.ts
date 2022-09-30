import {useEffect, useState} from "react";

interface useMediaRecorderProps {
  stream?: MediaStream
}

/**
 * This media recorder hook keeps all the logic needed to perform an audio recording decoupling it from any component
 * so it can be reused if needed.
 *
 * This way, when it comes to testing you only need to mock this `recorder` hook and its returned values.
 *
 * The hook in use would look like this:
 * const { recording, recordings, setRecordings, isRecording } = useMediaRecorded(stream);
 *
 * The `setRecordings` method is exposed so that we can perform modifications to the list of recordings from the component
 * avoiding to bloat the logic of this hook (tough it could also be a good idea to do so) but we kept it like this for simplicity
 *
 * @param {Object} stream
 * @returns {{
 * recorder: { start: Function, stop: Function },
 * isRecording: boolean,
 * recordings: any[],
 * setRecordings: Function
 * }}
 *
 */
const useMediaRecorder = (props: useMediaRecorderProps) => {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  let audioMimeType: string = 'audio/webm';
  let chunks: any[] = []

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    .then((stream) => {
      try {
        initMediaRecorder(stream, 'audio/webm')
      } catch (error) {
        console.log('This browser does not support mime type: audio/webm');
      }
      
      try {
        initMediaRecorder(stream, 'audio/mp4')
      } catch (error) {
        console.log('This browser does not support mime type: audio/mp4');
      }
    })
    .catch((error) => {
        console.log('You need to allow access to your microphone to use this app')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initMediaRecorder = (stream: MediaStream, mt: string) => {
    audioMimeType = mt
    const mr = new MediaRecorder(stream, { mimeType: mt });
    mr.onstart = handleStart
    mr.onstop = handleStop
    mr.ondataavailable = handleDataAvailable
    setRecorder(mr)
  }
  
  const handleStart = () => {
    console.log('started recording')
    setIsRecording(true);
  }

  const handleStop = () => {
    const blob = new Blob(chunks, { 'type' : audioMimeType })
    const audioURL = window.URL.createObjectURL(blob)
    console.log('stopped recording')

    // push the new recording to the recordings list
    setRecordings(currentRecordings => {
      return [...currentRecordings, ...[{
        stream: audioURL,
        name: new Date().toISOString().split('.')[0].split('T').join(' '),
        id: `id${window.performance.now().toString()}`
      }]]
    })

    chunks = []
    setIsRecording(false);
  }

  const handleDataAvailable = (e) => {
    chunks.push(e.data)
  }

  return {
    recorder,
    recordings,
    setRecordings,
    isRecording,
  }
}

export default useMediaRecorder