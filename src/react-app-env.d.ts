/// <reference types="react-scripts" />

interface WakeLockSentinel extends EventTarget {
    readonly released: boolean
    readonly type: 'screen'
    release(): Promise<void>
}

interface WakeLock {
    request(type: 'screen'): Promise<WakeLockSentinel>
}

interface Navigator {
    readonly wakeLock: WakeLock
}
