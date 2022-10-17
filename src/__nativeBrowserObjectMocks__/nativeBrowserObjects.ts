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
        console.log('========', 'I am inside of MediaStream', '========')
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

    // Object.defineProperty(global, 'MediaRecorder', {
    //   writable: true,
    //   value: jest.fn().mockImplementation(() => {
    //     console.log('========', 'I am inside of MediaRecorder', '========')
    //     return ({
          // ondataavailable: jest.fn(),
          // audioBitrateMode: "variable",
          // audioBitsPerSecond: 0,
          // onstop: jest.fn(),
          // onstart: jest.fn(),
          // onerror: jest.fn(),
          // onpause: jest.fn(),
          // onresume: jest.fn(),
          // state: 'recording',
          // mimeType: 'audio/webm',
          // stream: global.MediaStream
      //   })})
    //   .mockName('MediaRecorder')
    // })
  }
  
  export default setupMockedMediaDevices