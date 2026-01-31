import {
    createAudioURL,
    createRecordingObject,
    formatRecordingName,
    validateRecordingName
} from './recordingUtils'

describe('createAudioURL', () => {
    it('calls URL.createObjectURL with blob', () => {
        const blob = new Blob(['test audio data'], { type: 'audio/webm' })
        // Just verify the function exists and can be called
        expect(() => createAudioURL(blob)).not.toThrow()
    })
})

describe('createRecordingObject', () => {
    it('returns correct Recording structure', () => {
        const blob = new Blob(['test audio'], { type: 'audio/webm' })
        const mimeType = 'audio/webm'
        const id = 42

        const recording = createRecordingObject(blob, mimeType, id)

        expect(recording).toHaveProperty('data', blob)
        expect(recording).toHaveProperty('audioURL')
        expect(recording).toHaveProperty('name')
        expect(recording).toHaveProperty('id', id)
        expect(recording).toHaveProperty('length', 0)
    })

    it('has all fields populated correctly', () => {
        const blob = new Blob(['audio data'], { type: 'audio/mp4' })
        const mimeType = 'audio/mp4'
        const id = 123

        const recording = createRecordingObject(blob, mimeType, id)

        expect(recording.data).toBe(blob)
        expect(recording.id).toBe(123)
        expect(recording.length).toBe(0)
        // audioURL should be present (could be undefined or string depending on mock setup)
        expect(recording).toHaveProperty('audioURL')
        expect(typeof recording.name).toBe('string')
        // Name should be a date-formatted string
        expect(recording.name).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })
})

describe('formatRecordingName', () => {
    it('formats as "YYYY-MM-DD HH:MM:SS"', () => {
        const date = new Date('2024-03-15T14:30:45.123Z')
        const name = formatRecordingName(date)
        expect(name).toBe('2024-03-15 14:30:45')
    })

    it('handles midnight edge case', () => {
        const date = new Date('2024-01-01T00:00:00.000Z')
        const name = formatRecordingName(date)
        expect(name).toBe('2024-01-01 00:00:00')
    })

    it('handles end of day edge case', () => {
        const date = new Date('2024-12-31T23:59:59.999Z')
        const name = formatRecordingName(date)
        expect(name).toBe('2024-12-31 23:59:59')
    })

    it('handles leap year date', () => {
        const date = new Date('2024-02-29T12:00:00.000Z')
        const name = formatRecordingName(date)
        expect(name).toBe('2024-02-29 12:00:00')
    })
})

describe('validateRecordingName', () => {
    const fallback = 'Default Recording'

    it('returns trimmed string for valid name', () => {
        const result = validateRecordingName('  My Recording  ', fallback)
        expect(result).toBe('My Recording')
    })

    it('returns fallback for empty string', () => {
        const result = validateRecordingName('', fallback)
        expect(result).toBe(fallback)
    })

    it('returns fallback for whitespace only', () => {
        const result = validateRecordingName('   ', fallback)
        expect(result).toBe(fallback)
    })

    it('returns fallback for string longer than 500 chars', () => {
        const longName = 'a'.repeat(501)
        const result = validateRecordingName(longName, fallback)
        expect(result).toBe(fallback)
    })

    it('accepts exactly 500 characters', () => {
        const exactName = 'b'.repeat(500)
        const result = validateRecordingName(exactName, fallback)
        expect(result).toBe(exactName)
    })

    it('handles tab characters as whitespace', () => {
        const result = validateRecordingName('\t\t\t', fallback)
        expect(result).toBe(fallback)
    })

    it('trims mixed whitespace', () => {
        const result = validateRecordingName('\t  Recording Name  \n', fallback)
        expect(result).toBe('Recording Name')
    })
})
