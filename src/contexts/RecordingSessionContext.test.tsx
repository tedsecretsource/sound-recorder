import '../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecordingSessionProvider, useRecordingSession } from './RecordingSessionContext'
import { AudioSettingsProvider } from './AudioSettingsContext'

// Mock useRecordings from context
const mockAddRecording = jest.fn(() => Promise.resolve(1))
const mockUpdateRecording = jest.fn(() => Promise.resolve())

jest.mock('./RecordingsContext', () => ({
    useRecordings: () => ({
        recordings: [],
        isLoading: false,
        connectionIsOpen: true,
        addRecording: mockAddRecording,
        updateRecording: mockUpdateRecording,
        deleteRecording: jest.fn(() => Promise.resolve()),
        refreshRecordings: jest.fn(() => Promise.resolve()),
    })
}))

const createMockMediaRecorder = (initialState = 'inactive'): any => {
    const mr: any = {
        stream: new MediaStream(),
        mimeType: 'audio/webm',
        state: initialState,
        ondataavailable: null,
        onstop: null,
        onstart: null,
        onerror: jest.fn(),
        onpause: jest.fn(),
        onresume: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
    }
    mr.start = jest.fn(() => {
        mr.state = 'recording'
        if (mr.onstart) mr.onstart()
    })
    mr.stop = jest.fn(() => {
        mr.state = 'inactive'
        if (mr.ondataavailable) {
            mr.ondataavailable({ data: new Blob(['test audio'], { type: 'audio/webm' }) })
        }
        if (mr.onstop) mr.onstop()
    })
    return mr
}

// Test component to access context
const TestConsumer = () => {
    const { state, startRecording, stopRecording } = useRecordingSession()
    return (
        <div>
            <span data-testid="isRecording">{state.isRecording.toString()}</span>
            <span data-testid="currentRecordingId">{state.currentRecordingId?.toString() ?? 'null'}</span>
            <span data-testid="elapsedTime">{state.elapsedTime}</span>
            <button data-testid="startBtn" onClick={startRecording}>Start</button>
            <button data-testid="stopBtn" onClick={stopRecording}>Stop</button>
        </div>
    )
}

// Helper to create mock MediaRecorderState
const createMockMediaRecorderState = (mediaRecorder: any) => ({
    mediaRecorder,
    isInitializing: false,
    error: null,
    gainNode: null,
    audioContext: null
})

// Helper to wrap with required providers
const renderWithProviders = (ui: React.ReactElement, mediaRecorder: any) => {
    return render(
        <AudioSettingsProvider>
            <RecordingSessionProvider mediaRecorderState={createMockMediaRecorderState(mediaRecorder)}>
                {ui}
            </RecordingSessionProvider>
        </AudioSettingsProvider>
    )
}

describe('RecordingSessionProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders children', () => {
        const mockMediaRecorder = createMockMediaRecorder()
        render(
            <AudioSettingsProvider>
                <RecordingSessionProvider mediaRecorderState={createMockMediaRecorderState(mockMediaRecorder)}>
                    <div data-testid="child">Child Content</div>
                </RecordingSessionProvider>
            </AudioSettingsProvider>
        )

        expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
    })

    it('provides context value with all required fields', () => {
        const mockMediaRecorder = createMockMediaRecorder()
        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        expect(screen.getByTestId('isRecording')).toHaveTextContent('false')
        expect(screen.getByTestId('currentRecordingId')).toHaveTextContent('null')
        expect(screen.getByTestId('elapsedTime')).toHaveTextContent('0')
        expect(screen.getByTestId('startBtn')).toBeInTheDocument()
        expect(screen.getByTestId('stopBtn')).toBeInTheDocument()
    })
})

describe('useRecordingSession', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('throws error when not used within RecordingSessionProvider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

        expect(() => render(<TestConsumer />)).toThrow('useRecordingSession must be used within its Provider')

        consoleError.mockRestore()
    })
})

describe('RecordingSession functions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        mockAddRecording.mockImplementation(() => Promise.resolve(42))
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('startRecording creates DB entry and starts MediaRecorder', async () => {
        const mockMediaRecorder = createMockMediaRecorder()
        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        await act(async () => {
            await userEvent.click(screen.getByTestId('startBtn'))
        })

        expect(mockAddRecording).toHaveBeenCalledWith({
            name: 'New Recording',
            length: 0,
            audioURL: ''
        })
        expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000)

        await waitFor(() => {
            expect(screen.getByTestId('isRecording')).toHaveTextContent('true')
        })
        expect(screen.getByTestId('currentRecordingId')).toHaveTextContent('42')
    })

    it('stopRecording saves recording and resets state', async () => {
        const mockMediaRecorder = createMockMediaRecorder()
        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        // Start recording first
        await act(async () => {
            await userEvent.click(screen.getByTestId('startBtn'))
        })

        await waitFor(() => {
            expect(screen.getByTestId('isRecording')).toHaveTextContent('true')
        })

        // Simulate data available
        act(() => {
            if (mockMediaRecorder.ondataavailable) {
                mockMediaRecorder.ondataavailable({ data: new Blob(['chunk1'], { type: 'audio/webm' }) })
            }
        })

        // Stop recording
        await act(async () => {
            await userEvent.click(screen.getByTestId('stopBtn'))
            // Advance timers to allow the setTimeout in stopRecording to complete
            jest.advanceTimersByTime(200)
        })

        await waitFor(() => {
            expect(mockUpdateRecording).toHaveBeenCalled()
        })

        await waitFor(() => {
            expect(screen.getByTestId('isRecording')).toHaveTextContent('false')
        })
        expect(screen.getByTestId('currentRecordingId')).toHaveTextContent('null')
    })

    it('ondataavailable accumulates chunks', async () => {
        const mockMediaRecorder = createMockMediaRecorder()
        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        // Wait for useEffect to set up handlers
        await waitFor(() => {
            expect(mockMediaRecorder.ondataavailable).not.toBeNull()
        })

        // Start recording
        await act(async () => {
            await userEvent.click(screen.getByTestId('startBtn'))
        })

        // Simulate multiple data chunks
        act(() => {
            mockMediaRecorder.ondataavailable({ data: new Blob(['chunk1']) })
            mockMediaRecorder.ondataavailable({ data: new Blob(['chunk2']) })
            mockMediaRecorder.ondataavailable({ data: new Blob(['chunk3']) })
        })

        // Stop and verify the recording is saved with combined chunks
        await act(async () => {
            await userEvent.click(screen.getByTestId('stopBtn'))
            jest.advanceTimersByTime(200)
        })

        await waitFor(() => {
            expect(mockUpdateRecording).toHaveBeenCalled()
        })

        // The updateRecording should have been called with a recording object
        expect(mockUpdateRecording.mock.calls.length).toBeGreaterThan(0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calls = mockUpdateRecording.mock.calls as any[][]
        const call = calls[0][0] as { data: Blob }
        expect(call).toHaveProperty('data')
        expect(call.data).toBeInstanceOf(Blob)
    })

    it('elapsed time increments while recording', async () => {
        const mockMediaRecorder = createMockMediaRecorder()
        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        expect(screen.getByTestId('elapsedTime')).toHaveTextContent('0')

        await act(async () => {
            await userEvent.click(screen.getByTestId('startBtn'))
        })

        await waitFor(() => {
            expect(screen.getByTestId('isRecording')).toHaveTextContent('true')
        })

        // Advance time
        act(() => {
            jest.advanceTimersByTime(3000)
        })

        expect(screen.getByTestId('elapsedTime')).toHaveTextContent('3')
    })
})

describe('beforeunload handling', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        mockAddRecording.mockImplementation(() => Promise.resolve(42))
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('shows confirmation when recording and user tries to close browser', async () => {
        const mockMediaRecorder = createMockMediaRecorder()
        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        // Start recording
        await act(async () => {
            await userEvent.click(screen.getByTestId('startBtn'))
        })

        await waitFor(() => {
            expect(screen.getByTestId('isRecording')).toHaveTextContent('true')
        })

        // Simulate beforeunload event
        const event = new Event('beforeunload', { cancelable: true })
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

        window.dispatchEvent(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('does not show confirmation when not recording', async () => {
        const mockMediaRecorder = createMockMediaRecorder()
        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        // Ensure we're not recording
        expect(screen.getByTestId('isRecording')).toHaveTextContent('false')

        // Simulate beforeunload event
        const event = new Event('beforeunload', { cancelable: true })
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

        window.dispatchEvent(event)

        expect(preventDefaultSpy).not.toHaveBeenCalled()
    })
})

describe('MediaRecorder event handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('onstart logs message', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        const mockMediaRecorder = createMockMediaRecorder()

        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        await waitFor(() => {
            expect(mockMediaRecorder.onstart).not.toBeNull()
        })

        act(() => {
            if (mockMediaRecorder.onstart) {
                mockMediaRecorder.onstart()
            }
        })

        expect(consoleSpy).toHaveBeenCalledWith('[DEBUG]', 'Started recording')
        consoleSpy.mockRestore()
    })

    it('onstop logs message', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        const mockMediaRecorder = createMockMediaRecorder()

        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        await waitFor(() => {
            expect(mockMediaRecorder.onstop).not.toBeNull()
        })

        act(() => {
            if (mockMediaRecorder.onstop) {
                mockMediaRecorder.onstop()
            }
        })

        expect(consoleSpy).toHaveBeenCalledWith('[DEBUG]', 'Stopped recording')
        consoleSpy.mockRestore()
    })
})

describe('Error handling', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        mockAddRecording.mockImplementation(() => Promise.resolve(42))
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('handles error when save fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        mockUpdateRecording.mockRejectedValueOnce(new Error('Save failed'))

        const mockMediaRecorder = createMockMediaRecorder()

        renderWithProviders(<TestConsumer />, mockMediaRecorder)

        // Start recording
        await act(async () => {
            await userEvent.click(screen.getByTestId('startBtn'))
        })

        await waitFor(() => {
            expect(screen.getByTestId('isRecording')).toHaveTextContent('true')
        })

        // Add some data
        act(() => {
            if (mockMediaRecorder.ondataavailable) {
                mockMediaRecorder.ondataavailable({ data: new Blob(['test']) })
            }
        })

        // Stop recording
        await act(async () => {
            await userEvent.click(screen.getByTestId('stopBtn'))
            jest.advanceTimersByTime(200)
        })

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
    })
})
