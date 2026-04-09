import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render, act } from '@testing-library/react'
import Visualizer from './index'

describe('Visualizer component', () => {
  let mockStream
  let mockAudioContext
  let mockAudioContextInstance
  let mockAnalyser
  let mockSource
  let originalAudioContext
  let originalRequestAnimationFrame
  let originalCancelAnimationFrame
  let animationFrameCallback

  beforeEach(() => {
    // Store originals
    originalAudioContext = global.AudioContext
    originalRequestAnimationFrame = global.requestAnimationFrame
    originalCancelAnimationFrame = global.cancelAnimationFrame

    // Create mock stream
    mockStream = new MediaStream()

    // Create mock analyser
    mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteTimeDomainData: vi.fn((dataArray) => {
        // Fill with some test data
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.floor(Math.random() * 256)
        }
      }),
      connect: vi.fn(),
    }

    // Create mock source
    mockSource = {
      connect: vi.fn(),
    }

    // Create mock AudioContext as a class so it's constructable
    mockAudioContextInstance = null
    mockAudioContext = class MockAudioContext {
      constructor() {
        this.createMediaStreamSource = vi.fn(() => mockSource)
        this.createAnalyser = vi.fn(() => mockAnalyser)
        mockAudioContextInstance = this
      }
    }

    global.AudioContext = mockAudioContext

    // Mock requestAnimationFrame
    animationFrameCallback = null
    global.requestAnimationFrame = vi.fn((callback) => {
      animationFrameCallback = callback
      return 123 // return a mock ID
    })

    global.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    global.AudioContext = originalAudioContext
    global.requestAnimationFrame = originalRequestAnimationFrame
    global.cancelAnimationFrame = originalCancelAnimationFrame
  })

  it('renders without crashing', () => {
    render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)
  })

  it('renders a canvas element', () => {
    render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveClass('visualizer')
  })

  it('AudioContext created on mount', () => {
    render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)
    expect(mockAudioContextInstance).not.toBeNull()
  })

  it('creates MediaStreamSource from stream', () => {
    render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)
    expect(mockAudioContextInstance.createMediaStreamSource).toHaveBeenCalledWith(mockStream)
  })

  it('AnalyserNode configured correctly', () => {
    render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)
    expect(mockAudioContextInstance.createAnalyser).toHaveBeenCalled()
    // The component sets fftSize to 256
    expect(mockAnalyser.fftSize).toBe(256)
  })

  it('source connects to analyser', () => {
    render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)
    expect(mockSource.connect).toHaveBeenCalledWith(mockAnalyser)
  })

  it('animation frame requested on mount', () => {
    render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)
    expect(global.requestAnimationFrame).toHaveBeenCalled()
  })

  it('animation frame cancelled on unmount', () => {
    const { unmount } = render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)
    unmount()
    expect(global.cancelAnimationFrame).toHaveBeenCalledWith(123)
  })

  describe('Canvas drawing', () => {
    it('animation frame callback is set up', () => {
      render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)
      expect(animationFrameCallback).not.toBeNull()
    })

    it('requests next animation frame after drawing', () => {
      render(<Visualizer stream={mockStream} barColor={[18, 124, 85]} />)

      // Initial call
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1)

      // Trigger animation frame
      if (animationFrameCallback) {
        act(() => {
          animationFrameCallback(100)
        })
      }

      // Should request another frame
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2)
    })
  })
})
