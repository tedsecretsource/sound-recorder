import { renderHook, act } from '@testing-library/react'
import useKeepScreenAwake from './useKeepScreenAwake'

const flushPromises = () => act(() => Promise.resolve())

describe('useKeepScreenAwake', () => {
    let mockSentinel: { release: jest.Mock; released: boolean }
    let mockRequest: jest.Mock

    beforeEach(() => {
        mockSentinel = { release: jest.fn(), released: false }
        mockRequest = jest.fn().mockResolvedValue(mockSentinel)

        Object.defineProperty(navigator, 'wakeLock', {
            value: { request: mockRequest },
            writable: true,
            configurable: true,
        })
    })

    afterEach(() => {
        // @ts-ignore — clean up mock
        delete navigator.wakeLock
    })

    it('acquires a screen wake lock when enabled', async () => {
        renderHook(() => useKeepScreenAwake(true))

        await flushPromises()

        expect(mockRequest).toHaveBeenCalledWith('screen')
    })

    it('does not acquire a wake lock when disabled', () => {
        renderHook(() => useKeepScreenAwake(false))

        expect(mockRequest).not.toHaveBeenCalled()
    })

    it('releases the wake lock when disabled after being enabled', async () => {
        const { rerender } = renderHook(
            ({ enabled }) => useKeepScreenAwake(enabled),
            { initialProps: { enabled: true } }
        )

        await flushPromises()
        expect(mockRequest).toHaveBeenCalledTimes(1)

        rerender({ enabled: false })

        expect(mockSentinel.release).toHaveBeenCalled()
    })

    it('releases the wake lock on unmount', async () => {
        const { unmount } = renderHook(() => useKeepScreenAwake(true))

        await flushPromises()

        unmount()

        expect(mockSentinel.release).toHaveBeenCalled()
    })

    it('does nothing when the Wake Lock API is unavailable', () => {
        // @ts-ignore — simulate unsupported browser
        delete navigator.wakeLock

        expect(() => {
            renderHook(() => useKeepScreenAwake(true))
        }).not.toThrow()
    })
})
