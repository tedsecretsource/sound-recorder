import { useState, useEffect, useCallback, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'

const useInstallPrompt = () => {
    const [showBanner, setShowBanner] = useState(false)
    const installEvent = useRef<BeforeInstallPromptEvent | null>(null)

    // Capture the browser's install event so we can trigger it later on user action
    useEffect(() => {
        const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true'

        const handler = (e: Event) => {
            e.preventDefault()
            if (isDismissed) return
            installEvent.current = e as BeforeInstallPromptEvent
            setShowBanner(true)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const install = useCallback(async () => {
        const event = installEvent.current
        if (!event) return

        await event.prompt()
        const { outcome } = await event.userChoice

        if (outcome === 'accepted') {
            installEvent.current = null
            setShowBanner(false)
        }
    }, [])

    const dismiss = useCallback(() => {
        installEvent.current = null
        setShowBanner(false)
        localStorage.setItem(DISMISSED_KEY, 'true')
    }, [])

    return { showBanner, install, dismiss }
}

export default useInstallPrompt
