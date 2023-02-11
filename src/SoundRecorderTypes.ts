import { DBSchema } from 'idb'

export interface SoundRecorderDB extends DBSchema {
    recordings: {
        key: SoundRecorderDB['recordings']['value']['id']
        value: {
            id?: number
            data?: Blob
            name: string
            length: number
            audioURL: string
        }
        indexes: {
            name: string
        }
    }
}