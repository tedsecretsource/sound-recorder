import useConfigureMediaRecorder from '../hooks/useConfigureMediaRecroder'

interface useMediaRecorderProps {
  mediaRecorder?: MediaRecorder
}

const useMediaRecorder = (props?: useMediaRecorderProps) => {
  const { mediaRecorder } = props

  return useConfigureMediaRecorder({mediaRecorder})
}

export default useMediaRecorder