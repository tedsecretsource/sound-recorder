import React from 'react'
import './__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render, screen } from '@testing-library/react'
import { HashRouter, MemoryRouter, Routes, Route } from 'react-router-dom'
import App, { useMediaRecorder } from './App'

const mockMediaRecorder = {
  start: function() { this.state = 'recording' },
  stop: function() { this.state = 'inactive' },
  state: 'inactive',
  mimeType: 'audio/webm',
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  onstart: jest.fn(),
  onerror: jest.fn(),
  onpause: jest.fn(),
  onresume: jest.fn(),
  stream: {
    id: 'stream-id',
    active: true,
    getTracks: jest.fn(() => [{ getSettings: jest.fn(() => ({ deviceId: 'device-id' })) }])
  },
}

const mockMediaRecorderState = {
  mediaRecorder: mockMediaRecorder,
  isInitializing: false,
  error: null
}

jest.mock('./hooks/useGetMediaRecorder', () => () => mockMediaRecorderState)

// Mock RecordingsContext to avoid IndexedDB issues in App test
jest.mock('./contexts/RecordingsContext', () => ({
  RecordingsProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="recordings-provider">{children}</div>,
  useRecordings: () => ({
    recordings: [],
    isLoading: false,
    connectionIsOpen: true,
    addRecording: jest.fn(() => Promise.resolve(1)),
    updateRecording: jest.fn(() => Promise.resolve()),
    deleteRecording: jest.fn(() => Promise.resolve()),
    refreshRecordings: jest.fn(() => Promise.resolve()),
  })
}))

describe('App component', () => {
  describe('Rendering', () => {
    it('renders header with logo and title', () => {
      render(<HashRouter><App /></HashRouter>)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByText('Sound Recorder')).toBeInTheDocument()
    })

    it('renders logo link to home', () => {
      render(<HashRouter><App /></HashRouter>)
      const logoLink = screen.getByRole('link', { name: /sound recorder/i })
      expect(logoLink).toHaveAttribute('href', '#/')
      expect(logoLink).toHaveClass('logo')
    })

    it('renders RecordingsProvider wrapper', () => {
      render(<HashRouter><App /></HashRouter>)
      expect(screen.getByTestId('recordings-provider')).toBeInTheDocument()
    })

    it('renders Footer', () => {
      render(<HashRouter><App /></HashRouter>)
      expect(document.querySelector('footer')).toBeInTheDocument()
    })

    it('renders main content area', () => {
      render(<HashRouter><App /></HashRouter>)
      expect(document.querySelector('main')).toBeInTheDocument()
    })
  })

  describe('Layout structure', () => {
    it('has header as first major element', () => {
      render(<HashRouter><App /></HashRouter>)
      const header = document.querySelector('header')
      expect(header).toBeInTheDocument()
    })

    it('has main content area', () => {
      render(<HashRouter><App /></HashRouter>)
      const main = document.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    it('header contains h1 with Sound Recorder', () => {
      render(<HashRouter><App /></HashRouter>)
      const header = document.querySelector('header')
      const h1 = header?.querySelector('h1')
      expect(h1).toBeInTheDocument()
      expect(h1).toHaveTextContent('Sound Recorder')
    })
  })

  describe('Outlet context', () => {
    it('Outlet receives mediaRecorderState context', () => {
      // Create a test component to access outlet context
      const TestOutletConsumer = () => {
        const mrState = useMediaRecorder()
        return <div data-testid="outlet-consumer">{mrState?.mediaRecorder?.mimeType || 'no context'}</div>
      }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<TestOutletConsumer />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByTestId('outlet-consumer')).toHaveTextContent('audio/webm')
    })
  })

  describe('useMediaRecorder hook', () => {
    it('returns the mediaRecorderState from context', () => {
      const TestComponent = () => {
        const mrState = useMediaRecorder()
        return (
          <div>
            <span data-testid="mimeType">{mrState?.mediaRecorder?.mimeType}</span>
            <span data-testid="state">{mrState?.mediaRecorder?.state}</span>
            <span data-testid="isInitializing">{mrState?.isInitializing?.toString()}</span>
          </div>
        )
      }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<TestComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByTestId('mimeType')).toHaveTextContent('audio/webm')
      expect(screen.getByTestId('state')).toHaveTextContent('inactive')
      expect(screen.getByTestId('isInitializing')).toHaveTextContent('false')
    })
  })

  describe('Navigation links in footer', () => {
    it('renders navigation links', () => {
      render(<HashRouter><App /></HashRouter>)
      expect(screen.getByRole('link', { name: '🎙' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '🎧' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '⚙️' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '👤' })).toBeInTheDocument()
    })
  })
})
