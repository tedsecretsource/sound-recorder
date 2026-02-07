import { Link, Outlet, useOutletContext } from "react-router-dom"
import Footer from './components/Footer'
import './App.css'
import Logo from './components/Logo'
import useGetMediaRecorder, { MediaRecorderState } from './hooks/useGetMediaRecorder'
import { RecordingsProvider } from './contexts/RecordingsContext'
import { RecordingSessionProvider } from './contexts/RecordingSessionContext'
import { AudioSettingsProvider, useAudioSettings } from './contexts/AudioSettingsContext'
import { FreesoundAuthProvider } from './contexts/FreesoundAuthContext'
import { SyncProvider } from './contexts/SyncContext'
import SyncIndicator from './components/SyncIndicator'

const AppContent = () => {
  const { settings } = useAudioSettings()
  const mediaRecorderState = useGetMediaRecorder({ settings })

  return (
    <RecordingsProvider>
      <SyncProvider>
        <RecordingSessionProvider mediaRecorderState={mediaRecorderState}>
          <header>
            <div className="header-content">
              <h1 style={{margin: 0}}>
                <Link to="/" className='logo'>
                  <Logo />
                  Sound Recorder
                </Link>
              </h1>
              <SyncIndicator />
            </div>
          </header>
          <main>
            <Outlet context={mediaRecorderState} />
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
  return useOutletContext<MediaRecorderState>()
}

export default App
export { useMediaRecorder }
