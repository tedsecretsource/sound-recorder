import { useEffect, useState } from 'react'

interface useConfigureMediaRecorderProps {
  mediaRecorder?: MediaRecorder,
}

const useConfigureMediaRecorder = (props?: useConfigureMediaRecorderProps) => {
  const { mediaRecorder } = props
    const [recorder, setRecorder] = useState<MediaRecorder>(mediaRecorder);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordings, setRecordings] = useState<any[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null)
    
    // https://stackoverflow.com/questions/54069253/the-usestate-set-method-is-not-reflecting-a-change-immediately
    useEffect(() => {
      setRecorder(mediaRecorder)
    }, [mediaRecorder])

    useEffect(() => {
      let chunks: any[] = []
      console.log('========', 'I am inside of the useConfigureMediaRecorder.useEffect', '========')

      if( recorder ) {
        console.log('========', 'I am inside of the useConfigureMediaRecorder.useEffect.recorder', '========')

        recorder.onstart = () => {
          console.log('started recording')
          setIsRecording(true);
        }
      
        recorder.onstop = () => {
            const blob = new Blob(chunks, { 'type' : recorder.mimeType })
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
      
        recorder.ondataavailable = (e) => {
            chunks.push(e.data)
        }
  
        setRecorder(recorder)
        setStream(recorder.stream)
      }
    }, [mediaRecorder, recorder])

    const returnVars = () => {
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