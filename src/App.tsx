import { Link, Outlet, useOutletContext } from "react-router-dom"
import Footer from './components/Footer'
import './App.css'
import Logo from './components/Logo'
import useGetMediaRecorder from './hooks/useGetMediaRecorder'
import { RecordingsProvider } from './contexts/RecordingsContext'
import { RecordingSessionProvider } from './contexts/RecordingSessionContext'
import { AudioSettingsProvider, useAudioSettings } from './contexts/AudioSettingsContext'
import { FreesoundAuthProvider } from './contexts/FreesoundAuthContext'
import { SyncProvider } from './contexts/SyncContext'
import SyncIndicator from './components/SyncIndicator'

const AppContent = () => {
  const { settings } = useAudioSettings()
  const mediaRecorder = useGetMediaRecorder({ settings })

  return (
    <RecordingsProvider>
      <SyncProvider>
        <RecordingSessionProvider mediaRecorder={mediaRecorder}>
          <header>
            <h1 style={{marginTop: "0", marginBottom: "0"}}>
              <Link to="/" className='logo'>
                <Logo />
                Sound Recorder
              </Link>
              <SyncIndicator />
            </h1>
          </header>
          <main>
            <Outlet context={ mediaRecorder } />
          </main>
          <Footer />
        </RecordingSessionProvider>
      </SyncProvider>
    </RecordingsProvider>
  )
}

const App = () => {
  return (
    <FreesoundAuthProvider>
      <AudioSettingsProvider>
        <AppContent />
      </AudioSettingsProvider>
    </FreesoundAuthProvider>
  )
}

const useMediaRecorder = () => {
  return useOutletContext<ReturnType<typeof useGetMediaRecorder>>()
}

export default App
export { useMediaRecorder }
