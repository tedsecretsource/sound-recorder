import { useState, useEffect, useCallback, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'

const useInstallPrompt = () => {
    const [isInstallable, setIsInstallable] = useState(false)
    const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

    useEffect(() => {
        const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true'

        const handler = (e: Event) => {
            e.preventDefault()
            if (isDismissed) return
            deferredPrompt.current = e as BeforeInstallPromptEvent
            setIsInstallable(true)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const promptInstall = useCallback(async () => {
        const prompt = deferredPrompt.current
        if (!prompt) return

        await prompt.prompt()
        const { outcome } = await prompt.userChoice

        if (outcome === 'accepted') {
            deferredPrompt.current = null
            setIsInstallable(false)
        }
    }, [])

    const dismiss = useCallback(() => {
        deferredPrompt.current = null
        setIsInstallable(false)
        localStorage.setItem(DISMISSED_KEY, 'true')
    }, [])

    return { isInstallable, promptInstall, dismiss }
}

export default useInstallPrompt
