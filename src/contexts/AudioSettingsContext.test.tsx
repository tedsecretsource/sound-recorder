import { render, screen, act } from '@testing-library/react'
import { AudioSettingsProvider, useAudioSettings } from './AudioSettingsContext'
import { DEFAULT_AUDIO_SETTINGS, AUDIO_PRESETS } from '../types/AudioSettings'

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: jest.fn((key: string) => store[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value
        }),
        clear: jest.fn(() => {
            store = {}
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key]
        })
    }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Test component to access context
const TestConsumer = () => {
    const {
        settings,
        setPreset,
        setSampleRate,
        setChannelCount,
        setBitrate,
        getQualityMetadata
    } = useAudioSettings()

    return (
        <div>
            <span data-testid="preset">{settings.preset}</span>
            <span data-testid="sampleRate">{settings.sampleRate}</span>
            <span data-testid="channelCount">{settings.channelCount}</span>
            <span data-testid="bitrate">{settings.bitrate}</span>
            <button data-testid="setVoice" onClick={() => setPreset('voice')}>Voice</button>
            <button data-testid="setMusic" onClick={() => setPreset('music')}>Music</button>
            <button data-testid="setHifi" onClick={() => setPreset('hifi')}>HiFi</button>
            <button data-testid="setCustom" onClick={() => setPreset('custom')}>Custom</button>
            <button data-testid="setSampleRate" onClick={() => setSampleRate(48000)}>Set 48kHz</button>
            <button data-testid="setChannelCount" onClick={() => setChannelCount(1)}>Set Mono</button>
            <button data-testid="setBitrate" onClick={() => setBitrate(256000)}>Set 256kbps</button>
            <button data-testid="getMetadata" onClick={() => {
                const meta = getQualityMetadata()
                document.getElementById('metaOutput')!.textContent = JSON.stringify(meta)
            }}>Get Metadata</button>
            <span id="metaOutput" data-testid="metaOutput"></span>
        </div>
    )
}

describe('AudioSettingsProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorageMock.clear()
    })

    it('renders children', () => {
        render(
            <AudioSettingsProvider>
                <div data-testid="child">Child Content</div>
            </AudioSettingsProvider>
        )

        expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
    })

    it('provides default settings when localStorage is empty', () => {
        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        expect(screen.getByTestId('preset')).toHaveTextContent(DEFAULT_AUDIO_SETTINGS.preset)
        expect(screen.getByTestId('sampleRate')).toHaveTextContent(DEFAULT_AUDIO_SETTINGS.sampleRate.toString())
        expect(screen.getByTestId('channelCount')).toHaveTextContent(DEFAULT_AUDIO_SETTINGS.channelCount.toString())
        expect(screen.getByTestId('bitrate')).toHaveTextContent(DEFAULT_AUDIO_SETTINGS.bitrate.toString())
    })

    it('loads settings from localStorage', () => {
        const savedSettings = {
            preset: 'hifi',
            sampleRate: 48000,
            channelCount: 2,
            bitrate: 320000
        }
        localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedSettings))

        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        expect(screen.getByTestId('preset')).toHaveTextContent('hifi')
        expect(screen.getByTestId('sampleRate')).toHaveTextContent('48000')
        expect(screen.getByTestId('bitrate')).toHaveTextContent('320000')
    })

    it('handles corrupted localStorage gracefully', () => {
        localStorageMock.getItem.mockReturnValueOnce('invalid json')

        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        expect(screen.getByTestId('preset')).toHaveTextContent(DEFAULT_AUDIO_SETTINGS.preset)
    })
})

describe('useAudioSettings', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorageMock.clear()
    })

    it('throws error when not used within AudioSettingsProvider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

        expect(() => render(<TestConsumer />)).toThrow('useAudioSettings must be used within its Provider')

        consoleError.mockRestore()
    })

    it('setPreset changes to voice preset with correct values', () => {
        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        act(() => {
            screen.getByTestId('setVoice').click()
        })

        expect(screen.getByTestId('preset')).toHaveTextContent('voice')
        expect(screen.getByTestId('sampleRate')).toHaveTextContent(AUDIO_PRESETS.voice.sampleRate.toString())
        expect(screen.getByTestId('channelCount')).toHaveTextContent(AUDIO_PRESETS.voice.channelCount.toString())
        expect(screen.getByTestId('bitrate')).toHaveTextContent(AUDIO_PRESETS.voice.bitrate.toString())
    })

    it('setPreset changes to hifi preset with correct values', () => {
        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        act(() => {
            screen.getByTestId('setHifi').click()
        })

        expect(screen.getByTestId('preset')).toHaveTextContent('hifi')
        expect(screen.getByTestId('sampleRate')).toHaveTextContent(AUDIO_PRESETS.hifi.sampleRate.toString())
        expect(screen.getByTestId('bitrate')).toHaveTextContent(AUDIO_PRESETS.hifi.bitrate.toString())
    })

    it('setPreset to custom preserves current values', () => {
        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        // First set to hifi
        act(() => {
            screen.getByTestId('setHifi').click()
        })

        // Then set to custom
        act(() => {
            screen.getByTestId('setCustom').click()
        })

        // Values should remain from hifi
        expect(screen.getByTestId('preset')).toHaveTextContent('custom')
        expect(screen.getByTestId('sampleRate')).toHaveTextContent(AUDIO_PRESETS.hifi.sampleRate.toString())
        expect(screen.getByTestId('bitrate')).toHaveTextContent(AUDIO_PRESETS.hifi.bitrate.toString())
    })

    it('setSampleRate switches to custom preset', () => {
        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        act(() => {
            screen.getByTestId('setSampleRate').click()
        })

        expect(screen.getByTestId('preset')).toHaveTextContent('custom')
        expect(screen.getByTestId('sampleRate')).toHaveTextContent('48000')
    })

    it('setChannelCount switches to custom preset', () => {
        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        act(() => {
            screen.getByTestId('setChannelCount').click()
        })

        expect(screen.getByTestId('preset')).toHaveTextContent('custom')
        expect(screen.getByTestId('channelCount')).toHaveTextContent('1')
    })

    it('setBitrate switches to custom preset', () => {
        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        act(() => {
            screen.getByTestId('setBitrate').click()
        })

        expect(screen.getByTestId('preset')).toHaveTextContent('custom')
        expect(screen.getByTestId('bitrate')).toHaveTextContent('256000')
    })

    it('getQualityMetadata returns current settings', () => {
        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        act(() => {
            screen.getByTestId('setVoice').click()
        })

        act(() => {
            screen.getByTestId('getMetadata').click()
        })

        const metaOutput = screen.getByTestId('metaOutput').textContent
        const meta = JSON.parse(metaOutput!)

        expect(meta.preset).toBe('voice')
        expect(meta.sampleRate).toBe(AUDIO_PRESETS.voice.sampleRate)
        expect(meta.channelCount).toBe(AUDIO_PRESETS.voice.channelCount)
        expect(meta.bitrate).toBe(AUDIO_PRESETS.voice.bitrate)
    })

    it('saves settings to localStorage on change', () => {
        render(
            <AudioSettingsProvider>
                <TestConsumer />
            </AudioSettingsProvider>
        )

        act(() => {
            screen.getByTestId('setHifi').click()
        })

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'audio-settings',
            expect.stringContaining('"preset":"hifi"')
        )
    })
})
