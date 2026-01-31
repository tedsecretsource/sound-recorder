import { renderHook, waitFor } from '@testing-library/react'

// Create mock db object
const mockDb = {
    get: jest.fn(),
    getAll: jest.fn(),
    add: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    close: jest.fn(),
}

// Mock the idb module
jest.mock('idb/with-async-ittr', () => ({
    openDB: jest.fn(() => Promise.resolve(mockDb))
}))

// Import after mocking
import { openDB } from 'idb/with-async-ittr'
import useIndexedDB from './useIndexedDB'

const mockedOpenDB = openDB as jest.Mock

describe('useIndexedDB', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Reset all mock implementations
        mockedOpenDB.mockImplementation(() => Promise.resolve(mockDb))
        mockDb.get.mockImplementation(() => Promise.resolve(undefined))
        mockDb.getAll.mockImplementation(() => Promise.resolve([]))
        mockDb.add.mockImplementation(() => Promise.resolve(42))
        mockDb.put.mockImplementation(() => Promise.resolve(5))
        mockDb.delete.mockImplementation(() => Promise.resolve(undefined))
    })

    describe('initialization', () => {
        it('connectionIsOpen starts false, becomes true after openDB resolves', async () => {
            const { result } = renderHook(() => useIndexedDB())

            // Initially false
            expect(result.current.connectionIsOpen).toBe(false)

            // Wait for openDB to resolve
            await waitFor(() => {
                expect(result.current.connectionIsOpen).toBe(true)
            })
        })

        it('openDB is called with correct params', async () => {
            renderHook(() => useIndexedDB())

            await waitFor(() => {
                expect(mockedOpenDB).toHaveBeenCalledWith(
                    'sound-recorder',
                    1,
                    expect.objectContaining({
                        upgrade: expect.any(Function)
                    })
                )
            })
        })
    })

    describe('getRecordingFromDB', () => {
        it('calls db.get and returns result', async () => {
            const mockRecording = { id: 1, name: 'Test', length: 0, audioURL: 'test' }
            mockDb.get.mockImplementation(() => Promise.resolve(mockRecording))

            const { result } = renderHook(() => useIndexedDB())

            await waitFor(() => {
                expect(result.current.connectionIsOpen).toBe(true)
            })

            const recording = await result.current.getRecordingFromDB(1)

            expect(mockDb.get).toHaveBeenCalledWith('recordings', 1)
            expect(recording).toEqual(mockRecording)
        })

        it('rejects with "No database connection" when db is null', async () => {
            mockedOpenDB.mockImplementation(() => Promise.resolve(null))

            const { result } = renderHook(() => useIndexedDB())

            await expect(result.current.getRecordingFromDB(1)).rejects.toBe('No database connection')
        })
    })

    describe('getAllRecordingsFromDB', () => {
        it('calls db.getAll and returns array', async () => {
            const mockRecordings = [
                { id: 1, name: 'Test 1', length: 0, audioURL: 'test1' },
                { id: 2, name: 'Test 2', length: 0, audioURL: 'test2' }
            ]
            mockDb.getAll.mockImplementation(() => Promise.resolve(mockRecordings))

            const { result } = renderHook(() => useIndexedDB())

            await waitFor(() => {
                expect(result.current.connectionIsOpen).toBe(true)
            })

            const recordings = await result.current.getAllRecordingsFromDB()

            expect(mockDb.getAll).toHaveBeenCalledWith('recordings')
            expect(recordings).toEqual(mockRecordings)
        })

        it('rejects with "No database connection" when db is null', async () => {
            mockedOpenDB.mockImplementation(() => Promise.resolve(null))

            const { result } = renderHook(() => useIndexedDB())

            await expect(result.current.getAllRecordingsFromDB()).rejects.toBe('No database connection')
        })
    })

    describe('addRecording', () => {
        it('calls db.add and returns ID', async () => {
            const newRecording = { name: 'New Recording', length: 0, audioURL: 'new' }

            const { result } = renderHook(() => useIndexedDB())

            await waitFor(() => {
                expect(result.current.connectionIsOpen).toBe(true)
            })

            const id = await result.current.addRecording(newRecording as any)

            expect(mockDb.add).toHaveBeenCalledWith('recordings', newRecording)
            expect(id).toBe(42)
        })

        it('rejects with "No database connection" when db is null', async () => {
            mockedOpenDB.mockImplementation(() => Promise.resolve(null))

            const { result } = renderHook(() => useIndexedDB())

            await expect(result.current.addRecording({ name: 'test', length: 0, audioURL: '' } as any)).rejects.toBe('No database connection')
        })
    })

    describe('putRecording', () => {
        it('calls db.put and returns ID', async () => {
            const recording = { id: 5, name: 'Updated Recording', length: 0, audioURL: 'updated' }

            const { result } = renderHook(() => useIndexedDB())

            await waitFor(() => {
                expect(result.current.connectionIsOpen).toBe(true)
            })

            const id = await result.current.putRecording(recording as any)

            expect(mockDb.put).toHaveBeenCalledWith('recordings', recording)
            expect(id).toBe(5)
        })

        it('rejects with "No database connection" when db is null', async () => {
            mockedOpenDB.mockImplementation(() => Promise.resolve(null))

            const { result } = renderHook(() => useIndexedDB())

            await expect(result.current.putRecording({ id: 1, name: 'test', length: 0, audioURL: '' } as any)).rejects.toBe('No database connection')
        })
    })

    describe('deleteRecordingFromDB', () => {
        it('calls db.delete', async () => {
            const { result } = renderHook(() => useIndexedDB())

            await waitFor(() => {
                expect(result.current.connectionIsOpen).toBe(true)
            })

            await result.current.deleteRecordingFromDB(3)

            expect(mockDb.delete).toHaveBeenCalledWith('recordings', 3)
        })

        it('rejects with "No database connection" when db is null', async () => {
            mockedOpenDB.mockImplementation(() => Promise.resolve(null))

            const { result } = renderHook(() => useIndexedDB())

            await expect(result.current.deleteRecordingFromDB(1)).rejects.toBe('No database connection')
        })
    })
})
