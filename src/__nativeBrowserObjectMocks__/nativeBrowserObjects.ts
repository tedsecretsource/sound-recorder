import { any } from "prop-types"

const setupMockedMediaDevices = () => {
    const mockMediaDevices = {
      getUserMedia: jest.fn().mockImplementation(() => {
        console.log('========', 'I am inside mockMediaDevices', '========')
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
        return ({
          active: true,
          id: `id${window.performance.now().toString()}`,
          onactive: jest.fn(),
          onaddtrack: jest.fn(),
          oninactive: jest.fn(),
          onremovetrack: jest.fn(),
        })
      })
      .mockName('MediaStream')
    })

    Object.defineProperty(global, 'MediaRecorder', {
      writable: true,
      value: jest.fn().mockImplementation(() => {
        console.log('========', 'I am inside of the mocked MediaRecorder', '========')
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
          start: () => {
            console.log('========', 'I am inside of the mocked MediaRecorder.start() method', '========')
          },
          stop: jest.fn((state) => {
            console.log('========', 'I am inside of the mocked MediaRecorder.stop() method', '========')
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
  }
  
  export default setupMockedMediaDevices