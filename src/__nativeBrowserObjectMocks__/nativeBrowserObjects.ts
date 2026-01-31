import { any } from "prop-types"

const mockMediaDevices = {
  getUserMedia: jest.fn().mockImplementation(() => {
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

Object.defineProperty(global, 'MediaStream', {
  writable: true,
  value: jest.fn().mockImplementation(() => {
    return {
      active: true,
      id: `id${window.performance.now().toString()}`,
      onactive: jest.fn(),
      onaddtrack: jest.fn(),
      oninactive: jest.fn(),
      onremovetrack: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }
  })
  .mockName('MediaStream')
})

Object.defineProperty(global.MediaStream.prototype, 'active', {
  writable: true,
  value: true
})

Object.defineProperty(global.MediaStream.prototype, 'id', {
  writable: true,
  value: `id${window.performance.now().toString()}`
})

class AudioContextMock {
  createMediaStreamSource = jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    onended: jest.fn(),
    onmute: jest.fn(),
    onunmute: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
  createAnalyser = jest.fn().mockReturnValue({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getFloatFrequencyData: jest.fn(),
    getByteFrequencyData: jest.fn(),
    getFloatTimeDomainData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
  });
  resume = jest.fn();
  suspend = jest.fn();
}

(global as any).AudioContext = AudioContextMock;


Object.defineProperty(global, 'MediaRecorder', {
  writable: true,
  value: jest.fn().mockImplementation(() => {
    return {
      ondataavailable: jest.fn(),
      audioBitrateMode: "variable",
      audioBitsPerSecond: 0,
      onerror: jest.fn(),
      onpause: jest.fn(),
      onresume: jest.fn(),
      mimeType: 'audio/webm',
      stream: global.MediaStream,
      state: "inactive",
      start: jest.fn((state) => {
      }),
      stop: jest.fn((state) => {
      }),
      pause: jest.fn(),
      resume: jest.fn(),
      requestData: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
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
  value: jest.fn().mockImplementation(() => {
    return 'blob:https://localhost:3000/12345678-1234-1234-1234-123456789012'
  })
})

// Default export for backward compatibility - setup happens on import
const setupMockedMediaDevices = () => {}

export default setupMockedMediaDevices
export { mockMediaDevices, AudioContextMock }
