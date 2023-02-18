import { DBSchema } from 'idb'

export interface Recording {
    id?: number
    data?: Blob
    name: string
    length: number
    audioURL: string
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