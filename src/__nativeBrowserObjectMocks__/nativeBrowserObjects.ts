const setupMockedMediaDevices = () => {
    const mockMediaDevices = {
      getUserMedia: jest.fn().mockImplementation(() => {
        console.log('========', 'I am inside mockMediaDevices', '========')
        return new Promise((resolve, reject) => {
          process.nextTick(() => {
          // reject(new Error('Error: getUserMedia failed!')),
          resolve(MediaStream)
          }
          )
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
          stream: "audioUrl",
          name: new Date().toISOString().split('.')[0].split('T').join(' '),
          id: `id${window.performance.now().toString()}`,
          addTrack: jest.fn()
        })
      })
      .mockName('MediaStream')
    })

    // If I uncomment this, I get the following error when running the tests:
    // TypeError: Right-hand side of 'instanceof' is not callable
    // This is because I am testing the type of the stream, and the stream is not a function, is not typed as a function, and is not callable.
    // Object.defineProperty(window, 'MediaStream', {
    //   writable: true,
    //   value: {
    //     stream: "audioUrl",
    //     name: new Date().toISOString().split('.')[0].split('T').join(' '),
    //     id: `id${window.performance.now().toString()}`,
    //     active: true,
    //     addTrack: jest.fn()
    //   }
    // })
    
    Object.defineProperty(window, 'MediaRecorder', {
      writable: true,
      value: jest.fn().mockImplementation(() => {
        console.log('========', 'I am inside of MediaRecorder', '========')
        return ({
        start: jest.fn(),
        stop: jest.fn(),
        ondataavailable: jest.fn(),
        onstop: jest.fn(),
        onstart: jest.fn(),
        onerror: jest.fn(),
        state: 'inactive',
        mimeType: 'audio/webm',
        stream: MediaStream
      })})
      .mockName('MediaRecorder')
    })
  }
  
  export default setupMockedMediaDevices