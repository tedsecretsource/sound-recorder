import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render, screen } from '@testing-library/react'
import Settings from './index'

let mockMediaRecorderValue: any = {
  state: 'inactive',
  mimeType: 'audio/webm',
  audioBitsPerSecond: 128000,
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  onstart: jest.fn(),
  onerror: jest.fn(),
  onpause: jest.fn(),
  onresume: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  stream: {
    id: 'stream-id-123',
    active: true,
    getTracks: jest.fn(() => [{ getSettings: jest.fn(() => ({ deviceId: 'device-id-456' })) }])
  },
}

// Mock useMediaRecorder from App
jest.mock('../../App', () => ({
  useMediaRecorder: () => mockMediaRecorderValue
}))

describe('Settings component', () => {
  beforeEach(() => {
    mockMediaRecorderValue = {
      state: 'inactive',
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000,
      ondataavailable: jest.fn(),
      onstop: jest.fn(),
      onstart: jest.fn(),
      onerror: jest.fn(),
      onpause: jest.fn(),
      onresume: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      stream: {
        id: 'stream-id-123',
        active: true,
        getTracks: jest.fn(() => [{ getSettings: jest.fn(() => ({ deviceId: 'device-id-456' })) }])
      },
    }
  })

  it('renders without crashing', () => {
    render(<Settings />)
  })

  it('renders Settings heading', () => {
    render(<Settings />)
    expect(screen.getByRole('heading', { level: 1, name: /settings/i })).toBeInTheDocument()
  })

  it('renders MediaRecorder section heading', () => {
    render(<Settings />)
    expect(screen.getByRole('heading', { level: 2, name: /mediarecorder/i })).toBeInTheDocument()
  })

  describe('mrStatsGenerator extracts correct stats', () => {
    it('displays stream ID', () => {
      render(<Settings />)
      expect(screen.getByText(/stream ID:/i)).toBeInTheDocument()
      expect(screen.getByText(/stream-id-123/)).toBeInTheDocument()
    })

    it('displays stream active status', () => {
      render(<Settings />)
      expect(screen.getByText(/stream active:/i)).toBeInTheDocument()
      expect(screen.getByText(/true/)).toBeInTheDocument()
    })

    it('displays mimeType', () => {
      render(<Settings />)
      expect(screen.getByText(/mimeType:/i)).toBeInTheDocument()
      expect(screen.getByText(/audio\/webm/)).toBeInTheDocument()
    })

    it('displays state', () => {
      render(<Settings />)
      expect(screen.getByText(/state:/i)).toBeInTheDocument()
      expect(screen.getByText(/inactive/)).toBeInTheDocument()
    })

    it('displays audioBitsPerSecond', () => {
      render(<Settings />)
      expect(screen.getByText(/audioBitsPerSecond:/i)).toBeInTheDocument()
      expect(screen.getByText(/128000/)).toBeInTheDocument()
    })
  })

  describe('mrStats renders all stat items', () => {
    it('renders multiple stat paragraphs', () => {
      render(<Settings />)
      const statsContainer = screen.getByRole('heading', { level: 2, name: /mediarecorder/i }).parentElement
      const statParagraphs = statsContainer?.querySelectorAll('p')
      expect(statParagraphs?.length).toBeGreaterThan(0)
    })
  })

  describe('Loading state', () => {
    it('shows loading message when mediaRecorder is null', () => {
      mockMediaRecorderValue = null
      render(<Settings />)
      expect(screen.getByText(/loading mediarecorder/i)).toBeInTheDocument()
    })
  })

  describe('console.table called with settings', () => {
    it('calls console.table with track settings', () => {
      const consoleSpy = jest.spyOn(console, 'table').mockImplementation(() => {})

      render(<Settings />)

      expect(consoleSpy).toHaveBeenCalledWith({ deviceId: 'device-id-456' })

      consoleSpy.mockRestore()
    })
  })
})
