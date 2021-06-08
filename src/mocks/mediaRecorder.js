Object.defineProperty(window, 'MediaRecorder', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
        start: jest.fn(),
        ondataavailable: jest.fn(),
        onerror: jest.fn(),
        state: "",
        stop: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
    })),
})

Object.defineProperty(MediaRecorder, 'isTypeSupported', {
    writable: true,
    value: () => true
})


// export const mockMediaRecorder = jest.fn();
// const mock = jest.fn().mockImplementation(() => {
//     return {
//         playSoundFile: mockMediaRecorder
//     };
// });


// export default mock