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

export function getBaseMimeType(mimeType: string): string {
    return mimeType.split(';')[0]
}

export function getFileExtension(mimeType: string): string {
    if (mimeType.startsWith('audio/mp4')) return '.m4a'
    return '.webm'
}

export function validateRecordingName(name: string, fallback: string): string {
    const trimmed = name.replace(/^\s+|\s+$/g, "")
    if (trimmed === '' || trimmed.length > 500) {
        return fallback
    }
    return trimmed
}
