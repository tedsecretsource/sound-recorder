import { useState } from 'react'

const useConfigureMediaRecorder = (mr: MediaRecorder) => {
    const [recorder, setRecorder] = useState<MediaRecorder>(mr);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordings, setRecordings] = useState<any[]>([]);
    let chunks: any[] = []
    const [stream, setStream] = useState<MediaStream | null>(null)

    mr.onstart = () => {
        console.log('started recording')
        setIsRecording(true);
    }
    
    mr.onstop = () => {
        const blob = new Blob(chunks, { 'type' : mr.mimeType })
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
    
    mr.ondataavailable = (e) => {
        chunks.push(e.data)
    }

    setRecorder(mr)

    const returnVars = () => {
        console.log('=======>', 'I am inside the returnVars function in the real hook and the value of stream is', stream, '<=======')
        return {
          recorder,
          recordings,
          setRecordings,
          isRecording,
          stream
        }
    }
    
      return returnVars()
}

export default useConfigureMediaRecorder