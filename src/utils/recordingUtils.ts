import { Recording } from '../SoundRecorderTypes'
import { QualityMetadata } from '../types/AudioSettings'

export function createAudioURL(blob: Blob): string {
    return window.URL.createObjectURL(blob)
}

export function createRecordingObject(
    blob: Blob,
    mimeType: string,
    id: number,
    quality?: QualityMetadata
): Recording {
    return {
        data: blob,
        audioURL: createAudioURL(blob),
        name: formatRecordingName(new Date()),
        id: id,
        length: 0,
        quality
    }
}

export function formatRecordingName(date: Date): string {
    return date.toISOString().split('.')[0].split('T').join(' ')
}

export function validateRecordingName(name: string, fallback: string): string {
    const trimmed = name.replace(/^\s+|\s+$/g, "")
    if (trimmed === '' || trimmed.length > 500) {
        return fallback
    }
    return trimmed
}
