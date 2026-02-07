import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render, screen } from '@testing-library/react'
import Settings from './index'
import { AudioSettingsProvider } from '../../contexts/AudioSettingsContext'

// Mock useRecordingSession from context
jest.mock('../../contexts/RecordingSessionContext', () => ({
  useRecordingSession: () => ({
    state: {
      isRecording: false,
      currentRecordingId: null,
      elapsedTime: 0
    },
    startRecording: jest.fn(),
    stopRecording: jest.fn()
  })
}))

const renderSettings = () => {
  return render(
    <AudioSettingsProvider>
      <Settings />
    </AudioSettingsProvider>
  )
}

describe('Settings component', () => {
  it('renders without crashing', () => {
    renderSettings()
  })

  it('renders Settings heading', () => {
    renderSettings()
    expect(screen.getByRole('heading', { level: 1, name: /settings/i })).toBeInTheDocument()
  })

  it('renders Audio Quality section heading', () => {
    renderSettings()
    expect(screen.getByRole('heading', { level: 2, name: /audio quality/i })).toBeInTheDocument()
  })

  it('renders copyright notice', () => {
    renderSettings()
    expect(screen.getByText(/Copyright © 2026 Ted Stresen-Reuter/)).toBeInTheDocument()
  })

  describe('Audio Quality Settings', () => {
    it('renders preset selector', () => {
      renderSettings()
      expect(screen.getByLabelText(/quality preset/i)).toBeInTheDocument()
    })

    it('renders file size estimate', () => {
      renderSettings()
      expect(screen.getByText(/estimated file size/i)).toBeInTheDocument()
    })

    it('renders advanced settings section', () => {
      renderSettings()
      expect(screen.getByText(/advanced settings/i)).toBeInTheDocument()
    })
  })
})
