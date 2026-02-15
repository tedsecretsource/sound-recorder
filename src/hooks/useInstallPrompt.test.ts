import { renderHook, act } from '@testing-library/react'
import useInstallPrompt from './useInstallPrompt'

const DISMISSED_KEY = 'pwa-install-dismissed'

describe('useInstallPrompt', () => {
    let addEventListenerSpy: jest.SpyInstance
    let removeEventListenerSpy: jest.SpyInstance
    let capturedHandler: ((e: Event) => void) | null = null

    const createBeforeInstallPromptEvent = (
        outcome: 'accepted' | 'dismissed' = 'dismissed'
    ) => {
        const event = new Event('beforeinstallprompt', { cancelable: true })
        Object.defineProperty(event, 'prompt', {
            value: jest.fn().mockResolvedValue(undefined),
        })
        Object.defineProperty(event, 'userChoice', {
            value: Promise.resolve({ outcome, platform: '' }),
        })
        return event as any
    }

    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
        capturedHandler = null

        addEventListenerSpy = jest.spyOn(window, 'addEventListener').mockImplementation(
            (type: string, handler: any) => {
                if (type === 'beforeinstallprompt') {
                    capturedHandler = handler
                }
                if (type === 'appinstalled') {
                    // store if needed
                }
            }
        )
        removeEventListenerSpy = jest.spyOn(window, 'removeEventListener').mockImplementation(() => {})
    })

    afterEach(() => {
        addEventListenerSpy.mockRestore()
        removeEventListenerSpy.mockRestore()
    })

    it('starts as not installable', () => {
        const { result } = renderHook(() => useInstallPrompt())
        expect(result.current.isInstallable).toBe(false)
    })

    it('becomes installable when beforeinstallprompt fires', () => {
        const { result } = renderHook(() => useInstallPrompt())

        const event = createBeforeInstallPromptEvent()
        act(() => {
            capturedHandler!(event)
        })

        expect(result.current.isInstallable).toBe(true)
    })

    it('prevents the default browser mini-infobar', () => {
        renderHook(() => useInstallPrompt())

        const event = createBeforeInstallPromptEvent()
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
        act(() => {
            capturedHandler!(event)
        })

        expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('calls prompt() on the deferred event when promptInstall is called', async () => {
        const { result } = renderHook(() => useInstallPrompt())

        const event = createBeforeInstallPromptEvent()
        act(() => {
            capturedHandler!(event)
        })

        await act(async () => {
            await result.current.promptInstall()
        })

        expect(event.prompt).toHaveBeenCalled()
    })

    it('becomes not installable after user accepts the install', async () => {
        const { result } = renderHook(() => useInstallPrompt())

        const event = createBeforeInstallPromptEvent('accepted')
        act(() => {
            capturedHandler!(event)
        })

        await act(async () => {
            await result.current.promptInstall()
        })

        expect(result.current.isInstallable).toBe(false)
    })

    it('remains installable after user dismisses the install dialog', async () => {
        const { result } = renderHook(() => useInstallPrompt())

        const event = createBeforeInstallPromptEvent()
        // userChoice defaults to 'dismissed'
        act(() => {
            capturedHandler!(event)
        })

        await act(async () => {
            await result.current.promptInstall()
        })

        expect(result.current.isInstallable).toBe(true)
    })

    it('dismiss() hides the prompt and persists to localStorage', () => {
        const { result } = renderHook(() => useInstallPrompt())

        const event = createBeforeInstallPromptEvent()
        act(() => {
            capturedHandler!(event)
        })
        expect(result.current.isInstallable).toBe(true)

        act(() => {
            result.current.dismiss()
        })

        expect(result.current.isInstallable).toBe(false)
        expect(localStorage.getItem(DISMISSED_KEY)).toBe('true')
    })

    it('does not become installable if previously dismissed', () => {
        localStorage.setItem(DISMISSED_KEY, 'true')

        const { result } = renderHook(() => useInstallPrompt())

        const event = createBeforeInstallPromptEvent()
        act(() => {
            capturedHandler!(event)
        })

        expect(result.current.isInstallable).toBe(false)
    })

    it('cleans up event listeners on unmount', () => {
        const { unmount } = renderHook(() => useInstallPrompt())
        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'beforeinstallprompt',
            expect.any(Function)
        )
    })
})
