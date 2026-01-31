import { DBSchema } from 'idb'
import { QualityMetadata } from './types/AudioSettings'

export interface Recording {
    id?: number
    data?: Blob
    name: string
    length: number
    audioURL: string
    quality?: QualityMetadata
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