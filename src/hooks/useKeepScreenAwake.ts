import { useEffect, useRef } from 'react'
import logger from '../utils/logger'

const useKeepScreenAwake = (enabled: boolean): void => {
    const sentinelRef = useRef<WakeLockSentinel | null>(null)

    useEffect(() => {
        if (!enabled) {
            sentinelRef.current?.release()
            sentinelRef.current = null
            return
        }

        if (!('wakeLock' in navigator)) {
            logger.debug('Screen Wake Lock API not supported')
            return
        }

        const keepScreenAwake = async () => {
            try {
                sentinelRef.current = await navigator.wakeLock.request('screen')
                logger.debug('Screen wake lock acquired')
            } catch (err) {
                logger.debug('Screen wake lock request failed:', err)
            }
        }

        keepScreenAwake()

        return () => {
            sentinelRef.current?.release()
            sentinelRef.current = null
        }
    }, [enabled])
}

export default useKeepScreenAwake
