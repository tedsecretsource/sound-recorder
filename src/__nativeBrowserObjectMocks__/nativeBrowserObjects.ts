import { any } from "prop-types"

const mockMediaDevices = {
  getUserMedia: vi.fn().mockImplementation(() => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        // reject(new Error('Error: getUserMedia failed!')),
        resolve(MediaStream)
      })
    })
  })
}

Object.defineProperty(window.navigator, 'mediaDevices', {
  writable: true,
  value: mockMediaDevices,
})

class MediaStreamMock {
  active = true
  id = `id${window.performance.now().toString()}`
  onactive = vi.fn()
  onaddtrack = vi.fn()
  oninactive = vi.fn()
  onremovetrack = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn()
}

;(global as any).MediaStream = MediaStreamMock

class AudioContextMock {
  createMediaStreamSource = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onended: vi.fn(),
    onmute: vi.fn(),
    onunmute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
  createAnalyser = vi.fn().mockReturnValue({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getFloatFrequencyData: vi.fn(),
    getByteFrequencyData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
  });
  resume = vi.fn();
  suspend = vi.fn();
}

(global as any).AudioContext = AudioContextMock;


Object.defineProperty(global, 'MediaRecorder', {
  writable: true,
  value: vi.fn().mockImplementation(() => {
    return {
      ondataavailable: vi.fn(),
      audioBitrateMode: "variable",
      audioBitsPerSecond: 0,
      onerror: vi.fn(),
      onpause: vi.fn(),
      onresume: vi.fn(),
      mimeType: 'audio/webm',
      stream: global.MediaStream,
      state: "inactive",
      start: vi.fn((state) => {
      }),
      stop: vi.fn((state) => {
      }),
      pause: vi.fn(),
      resume: vi.fn(),
      requestData: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  })
  .mockName('MediaRecorder')
})

Object.defineProperty(global.MediaRecorder.prototype, 'state', {
  writable: true,
  value: 'inactive'
})

Object.defineProperty(global.MediaRecorder, 'isTypeSupported', {
  writable: true,
  value: () => true
})

Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn().mockImplementation(() => {
    return 'blob:https://localhost:3000/12345678-1234-1234-1234-123456789012'
  })
})

// Default export for backward compatibility - setup happens on import
const setupMockedMediaDevices = () => {}

export default setupMockedMediaDevices
export { mockMediaDevices, AudioContextMock }
