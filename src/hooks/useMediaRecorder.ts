import { useState, useEffect } from 'react'
import useInitMediaRecorder from '../hooks/useInitMediaRecorder'
import useConfigureMediaRecorder from '../hooks/useConfigureMediaRecroder'

interface useMediaRecorderProps {
  stream?: MediaStream
}

const useMediaRecorder = async (props?: useMediaRecorderProps) => {
  const [mr, setMr] = useState<MediaRecorder | null>(null)
  const [configuredMr, setConfiguredMr] = useState(null)

  setMr(await useInitMediaRecorder())
  setConfiguredMr(useConfigureMediaRecorder(mr))
  
  return configuredMr
}

export default useMediaRecorder