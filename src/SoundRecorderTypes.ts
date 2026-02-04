import { DBSchema } from 'idb'
import { QualityMetadata } from './types/AudioSettings'
import { SyncStatus } from './types/Freesound'

export interface Recording {
    id?: number
    data?: Blob
    name: string
    description?: string
    length: number
    audioURL: string
    quality?: QualityMetadata
    freesoundId?: number
    syncStatus?: SyncStatus
    lastSyncedAt?: string
    syncError?: string
}

// Default name format is ISO datetime: "2024-01-15 14:30:45"
const DATETIME_NAME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

export function isDefaultRecordingName(name: string): boolean {
    return DATETIME_NAME_PATTERN.test(name.trim())
}

export function isReadyForSync(recording: Recording): boolean {
    const hasCustomName = !isDefaultRecordingName(recording.name)
    const hasDescription = Boolean(recording.description?.trim())
    return hasCustomName && hasDescription
}

export interface SoundRecorderDB extends DBSchema {
    recordings: {
        key: SoundRecorderDB['recordings']['value']['id']
        value: Recording
        indexes: {
            name: string
        }
    }
}