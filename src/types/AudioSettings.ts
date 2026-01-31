export type AudioQualityPreset = 'voice' | 'music' | 'hifi' | 'custom'

export interface AudioSettings {
    preset: AudioQualityPreset
    sampleRate: number
    channelCount: 1 | 2
    bitrate: number
}

export interface QualityMetadata {
    preset: AudioQualityPreset
    sampleRate: number
    channelCount: number
    bitrate: number
}

export const AUDIO_PRESETS: Record<AudioQualityPreset, Omit<AudioSettings, 'preset'>> = {
    voice: {
        sampleRate: 22050,
        channelCount: 1,
        bitrate: 64000
    },
    music: {
        sampleRate: 44100,
        channelCount: 2,
        bitrate: 128000
    },
    hifi: {
        sampleRate: 48000,
        channelCount: 2,
        bitrate: 320000
    },
    custom: {
        sampleRate: 44100,
        channelCount: 2,
        bitrate: 128000
    }
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
    preset: 'music',
    ...AUDIO_PRESETS.music
}

export const SAMPLE_RATE_OPTIONS = [22050, 44100, 48000] as const
export const BITRATE_OPTIONS = [64000, 96000, 128000, 192000, 256000, 320000] as const

export function formatQualityBadge(preset: AudioQualityPreset): string {
    const labels: Record<AudioQualityPreset, string> = {
        voice: 'Voice',
        music: 'Music',
        hifi: 'Hi-Fi',
        custom: 'Custom'
    }
    return labels[preset]
}

export function formatBitrate(bitrate: number): string {
    return `${Math.round(bitrate / 1000)} kbps`
}

export function formatSampleRate(sampleRate: number): string {
    return `${(sampleRate / 1000).toFixed(1)} kHz`
}

export function estimateFileSizePerMinute(bitrate: number): string {
    const bytesPerMinute = (bitrate / 8) * 60
    const mbPerMinute = bytesPerMinute / (1024 * 1024)
    return `~${mbPerMinute.toFixed(1)} MB/min`
}
