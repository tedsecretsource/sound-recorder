import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
    AudioSettings,
    AudioQualityPreset,
    AUDIO_PRESETS,
    DEFAULT_AUDIO_SETTINGS,
    QualityMetadata
} from '../types/AudioSettings'

const STORAGE_KEY = 'audio-settings'

interface AudioSettingsContextValue {
    settings: AudioSettings
    setPreset: (preset: AudioQualityPreset) => void
    setSampleRate: (sampleRate: number) => void
    setChannelCount: (channelCount: 1 | 2) => void
    setBitrate: (bitrate: number) => void
    getQualityMetadata: () => QualityMetadata
}

const AudioSettingsContext = createContext<AudioSettingsContextValue | null>(null)

interface AudioSettingsProviderProps {
    children: ReactNode
}

function loadSettings(): AudioSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return {
                preset: parsed.preset ?? DEFAULT_AUDIO_SETTINGS.preset,
                sampleRate: parsed.sampleRate ?? DEFAULT_AUDIO_SETTINGS.sampleRate,
                channelCount: parsed.channelCount ?? DEFAULT_AUDIO_SETTINGS.channelCount,
                bitrate: parsed.bitrate ?? DEFAULT_AUDIO_SETTINGS.bitrate
            }
        }
    } catch (error) {
        console.error('Failed to load audio settings from localStorage:', error)
    }
    return DEFAULT_AUDIO_SETTINGS
}

function saveSettings(settings: AudioSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
        console.error('Failed to save audio settings to localStorage:', error)
    }
}

export const AudioSettingsProvider = ({ children }: AudioSettingsProviderProps) => {
    const [settings, setSettings] = useState<AudioSettings>(loadSettings)

    useEffect(() => {
        saveSettings(settings)
    }, [settings])

    const setPreset = useCallback((preset: AudioQualityPreset) => {
        if (preset === 'custom') {
            setSettings(prev => ({ ...prev, preset }))
        } else {
            setSettings({
                preset,
                ...AUDIO_PRESETS[preset]
            })
        }
    }, [])

    const setSampleRate = useCallback((sampleRate: number) => {
        setSettings(prev => ({
            ...prev,
            preset: 'custom',
            sampleRate
        }))
    }, [])

    const setChannelCount = useCallback((channelCount: 1 | 2) => {
        setSettings(prev => ({
            ...prev,
            preset: 'custom',
            channelCount
        }))
    }, [])

    const setBitrate = useCallback((bitrate: number) => {
        setSettings(prev => ({
            ...prev,
            preset: 'custom',
            bitrate
        }))
    }, [])

    const getQualityMetadata = useCallback((): QualityMetadata => {
        return {
            preset: settings.preset,
            sampleRate: settings.sampleRate,
            channelCount: settings.channelCount,
            bitrate: settings.bitrate
        }
    }, [settings])

    const value: AudioSettingsContextValue = {
        settings,
        setPreset,
        setSampleRate,
        setChannelCount,
        setBitrate,
        getQualityMetadata
    }

    return (
        <AudioSettingsContext.Provider value={value}>
            {children}
        </AudioSettingsContext.Provider>
    )
}

export const useAudioSettings = (): AudioSettingsContextValue => {
    const context = useContext(AudioSettingsContext)
    if (!context) {
        throw new Error('useAudioSettings must be used within an AudioSettingsProvider')
    }
    return context
}

export default AudioSettingsContext
