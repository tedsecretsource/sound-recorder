import { formatTime } from './formatTime'

describe('formatTime', () => {
    it('formats 0 seconds as 00:00:00', () => {
        expect(formatTime(0)).toBe('00:00:00')
    })

    it('formats seconds only', () => {
        expect(formatTime(5)).toBe('00:00:05')
        expect(formatTime(45)).toBe('00:00:45')
    })

    it('formats minutes and seconds', () => {
        expect(formatTime(60)).toBe('00:01:00')
        expect(formatTime(125)).toBe('00:02:05')
        expect(formatTime(599)).toBe('00:09:59')
    })

    it('formats hours, minutes, and seconds', () => {
        expect(formatTime(3600)).toBe('01:00:00')
        expect(formatTime(3661)).toBe('01:01:01')
        expect(formatTime(7384)).toBe('02:03:04')
    })

    it('zero-pads single-digit values', () => {
        expect(formatTime(1)).toBe('00:00:01')
        expect(formatTime(61)).toBe('00:01:01')
        expect(formatTime(3601)).toBe('01:00:01')
    })
})
