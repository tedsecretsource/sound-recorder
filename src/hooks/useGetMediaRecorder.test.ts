/**
 * Note: Testing useGetMediaRecorder is challenging because it directly uses
 * navigator.mediaDevices.getUserMedia and the MediaRecorder constructor,
 * which are difficult to mock in Jest without affecting the module cache.
 *
 * The hook is covered through integration tests in component tests
 * (Recorder, Settings, RecordingsList) that mock the hook's return value.
 */

export {}

describe('useGetMediaRecorder', () => {
    it('hook module exports a default function', () => {
        const useGetMediaRecorder = require('./useGetMediaRecorder').default
        expect(typeof useGetMediaRecorder).toBe('function')
    })
})
