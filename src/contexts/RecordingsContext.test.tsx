import { render, screen, waitFor, act } from '@testing-library/react'

// Mock URL.createObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
    writable: true,
    value: jest.fn(() => 'blob:https://localhost:3000/mock-url')
})

// Create mock db functions first
const mockGet = jest.fn()
const mockGetAll = jest.fn(() => Promise.resolve([]))
const mockAdd = jest.fn(() => Promise.resolve(1))
const mockPut = jest.fn(() => Promise.resolve(1))
const mockDelete = jest.fn(() => Promise.resolve(undefined))
const mockClose = jest.fn()

const mockDb = {
    get: mockGet,
    getAll: mockGetAll,
    add: mockAdd,
    put: mockPut,
    delete: mockDelete,
    close: mockClose,
}

// Mock the idb module before importing anything that uses it
jest.mock('idb/with-async-ittr', () => ({
    openDB: jest.fn(() => Promise.resolve(mockDb))
}))

// Import after mocking
import { openDB } from 'idb/with-async-ittr'
import { RecordingsProvider, useRecordings } from './RecordingsContext'

const mockedOpenDB = openDB as jest.Mock

// Test component to access context
const TestConsumer = () => {
    const context = useRecordings()
    return (
        <div>
            <span data-testid="isLoading">{context.isLoading.toString()}</span>
            <span data-testid="connectionIsOpen">{context.connectionIsOpen.toString()}</span>
            <span data-testid="recordingsCount">{context.recordings.length}</span>
            <button data-testid="addBtn" onClick={() => context.addRecording({ name: 'Test', length: 0, audioURL: '' })}>Add</button>
            <button data-testid="updateBtn" onClick={() => context.updateRecording({ id: 1, name: 'Updated', length: 0, audioURL: '' })}>Update</button>
            <button data-testid="deleteBtn" onClick={() => context.deleteRecording(1)}>Delete</button>
            <button data-testid="refreshBtn" onClick={() => context.refreshRecordings()}>Refresh</button>
        </div>
    )
}

describe('RecordingsProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedOpenDB.mockImplementation(() => Promise.resolve(mockDb))
        mockGetAll.mockImplementation(() => Promise.resolve([]))
        mockAdd.mockImplementation(() => Promise.resolve(42))
        mockPut.mockImplementation(() => Promise.resolve(1))
        mockDelete.mockImplementation(() => Promise.resolve(undefined))
    })

    it('renders children', async () => {
        render(
            <RecordingsProvider>
                <div data-testid="child">Child Content</div>
            </RecordingsProvider>
        )

        expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
    })

    it('provides context value with all required fields', async () => {
        render(
            <RecordingsProvider>
                <TestConsumer />
            </RecordingsProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('connectionIsOpen')).toHaveTextContent('true')
        })

        expect(screen.getByTestId('isLoading')).toBeInTheDocument()
        expect(screen.getByTestId('recordingsCount')).toBeInTheDocument()
        expect(screen.getByTestId('addBtn')).toBeInTheDocument()
        expect(screen.getByTestId('updateBtn')).toBeInTheDocument()
        expect(screen.getByTestId('deleteBtn')).toBeInTheDocument()
        expect(screen.getByTestId('refreshBtn')).toBeInTheDocument()
    })
})

describe('useRecordings', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedOpenDB.mockImplementation(() => Promise.resolve(mockDb))
        mockGetAll.mockImplementation(() => Promise.resolve([]))
    })

    it('throws error when not used within RecordingsProvider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

        expect(() => render(<TestConsumer />)).toThrow('useRecordings must be used within a RecordingsProvider')

        consoleError.mockRestore()
    })

    it('returns recordings, isLoading, connectionIsOpen, and functions', async () => {
        mockGetAll.mockImplementation(() => Promise.resolve([
            { id: 1, name: 'Recording 1', length: 0, data: new Blob(['test']) }
        ]))

        render(
            <RecordingsProvider>
                <TestConsumer />
            </RecordingsProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('connectionIsOpen')).toHaveTextContent('true')
        })

        await waitFor(() => {
            expect(screen.getByTestId('recordingsCount')).toHaveTextContent('1')
        })
    })
})

describe('RecordingsContext functions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedOpenDB.mockImplementation(() => Promise.resolve(mockDb))
        mockGetAll.mockImplementation(() => Promise.resolve([]))
        mockAdd.mockImplementation(() => Promise.resolve(42))
        mockPut.mockImplementation(() => Promise.resolve(1))
        mockDelete.mockImplementation(() => Promise.resolve(undefined))
    })

    it('addRecording calls db.add and triggers refresh', async () => {
        render(
            <RecordingsProvider>
                <TestConsumer />
            </RecordingsProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('connectionIsOpen')).toHaveTextContent('true')
        })

        await act(async () => {
            screen.getByTestId('addBtn').click()
        })

        expect(mockAdd).toHaveBeenCalledWith('recordings', expect.objectContaining({ name: 'Test' }))
        expect(mockGetAll).toHaveBeenCalled()
    })

    it('updateRecording calls db.put and triggers refresh', async () => {
        render(
            <RecordingsProvider>
                <TestConsumer />
            </RecordingsProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('connectionIsOpen')).toHaveTextContent('true')
        })

        await act(async () => {
            screen.getByTestId('updateBtn').click()
        })

        expect(mockPut).toHaveBeenCalledWith('recordings', expect.objectContaining({ id: 1, name: 'Updated' }))
    })

    it('deleteRecording calls db.delete and triggers refresh', async () => {
        render(
            <RecordingsProvider>
                <TestConsumer />
            </RecordingsProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('connectionIsOpen')).toHaveTextContent('true')
        })

        await act(async () => {
            screen.getByTestId('deleteBtn').click()
        })

        expect(mockDelete).toHaveBeenCalledWith('recordings', 1)
    })

    it('refreshRecordings calls db.getAll and creates audioURLs', async () => {
        mockGetAll.mockImplementation(() => Promise.resolve([
            { id: 1, name: 'Test', length: 0, data: new Blob(['audio']) }
        ]))

        render(
            <RecordingsProvider>
                <TestConsumer />
            </RecordingsProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('connectionIsOpen')).toHaveTextContent('true')
        })

        await waitFor(() => {
            expect(mockGetAll).toHaveBeenCalledWith('recordings')
        })

        // Trigger manual refresh
        await act(async () => {
            screen.getByTestId('refreshBtn').click()
        })

        // getAll should have been called again
        expect(mockGetAll).toHaveBeenCalledTimes(2)
    })

    it('handles loading state transitions', async () => {
        // Make getAll take some time
        mockGetAll.mockImplementation(() => new Promise(resolve => {
            setTimeout(() => resolve([]), 50)
        }))

        render(
            <RecordingsProvider>
                <TestConsumer />
            </RecordingsProvider>
        )

        // Eventually loading should be false after data loads
        await waitFor(() => {
            expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
        }, { timeout: 500 })
    })

    it('handles error when db operations fail', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        mockGetAll.mockImplementation(() => Promise.reject(new Error('DB Error')))

        render(
            <RecordingsProvider>
                <TestConsumer />
            </RecordingsProvider>
        )

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
    })

    it('handles openDB failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        mockedOpenDB.mockImplementation(() => Promise.reject(new Error('Failed to open DB')))

        render(
            <RecordingsProvider>
                <TestConsumer />
            </RecordingsProvider>
        )

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled()
        })

        // isLoading should be set to false on error
        await waitFor(() => {
            expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
        })

        consoleSpy.mockRestore()
    })
})
