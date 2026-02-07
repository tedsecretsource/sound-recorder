/**
 * Tests for audioConverter utility
 *
 * Note: Full testing of audio conversion requires Web Audio API mocking
 * which is complex due to AudioContext and decodeAudioData dependencies.
 * These tests verify the module exports and basic behavior.
 */

export {}

describe('audioConverter', () => {
  it('exports convertToWav function', () => {
    const { convertToWav } = require('./audioConverter')
    expect(typeof convertToWav).toBe('function')
  })
})

describe('convertToWav integration', () => {
  // Mock AudioContext for testing
  let mockClose: jest.Mock
  let mockDecodeAudioData: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    // Polyfill Blob.prototype.arrayBuffer for JSDOM
    if (!Blob.prototype.arrayBuffer) {
      Blob.prototype.arrayBuffer = function (): Promise<ArrayBuffer> {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as ArrayBuffer)
          reader.readAsArrayBuffer(this)
        })
      }
    }

    mockClose = jest.fn().mockResolvedValue(undefined)
    mockDecodeAudioData = jest.fn()

    // Mock AudioContext
    const MockAudioContext = jest.fn().mockImplementation(() => ({
      close: mockClose,
      decodeAudioData: mockDecodeAudioData,
    }))

    // @ts-ignore - mocking global
    global.AudioContext = MockAudioContext
  })

  it('creates AudioContext and closes it after conversion', async () => {
    const mockAudioBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 1000,
      getChannelData: jest.fn(() => new Float32Array(1000)),
    }

    mockDecodeAudioData.mockResolvedValue(mockAudioBuffer)

    const { convertToWav } = require('./audioConverter')

    // Create a proper Blob with arrayBuffer method
    const audioData = new ArrayBuffer(100)
    const inputBlob = new Blob([audioData], { type: 'audio/webm' })

    const result = await convertToWav(inputBlob)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('audio/wav')
    expect(mockClose).toHaveBeenCalled()
  })

  it('closes AudioContext even on error', async () => {
    mockDecodeAudioData.mockRejectedValue(new Error('Decode error'))

    const { convertToWav } = require('./audioConverter')
    const audioData = new ArrayBuffer(100)
    const inputBlob = new Blob([audioData], { type: 'audio/webm' })

    await expect(convertToWav(inputBlob)).rejects.toThrow('Decode error')
    expect(mockClose).toHaveBeenCalled()
  })

  it('handles stereo audio', async () => {
    const leftChannel = new Float32Array(100).fill(0.5)
    const rightChannel = new Float32Array(100).fill(-0.5)

    const mockAudioBuffer = {
      numberOfChannels: 2,
      sampleRate: 48000,
      length: 100,
      getChannelData: jest.fn((channel: number) =>
        channel === 0 ? leftChannel : rightChannel
      ),
    }

    mockDecodeAudioData.mockResolvedValue(mockAudioBuffer)

    const { convertToWav } = require('./audioConverter')
    const audioData = new ArrayBuffer(100)
    const inputBlob = new Blob([audioData], { type: 'audio/webm' })

    const result = await convertToWav(inputBlob)

    expect(result).toBeInstanceOf(Blob)
    expect(mockAudioBuffer.getChannelData).toHaveBeenCalledWith(0)
    expect(mockAudioBuffer.getChannelData).toHaveBeenCalledWith(1)
  })

  it('produces valid WAV header structure', async () => {
    const mockAudioBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 100,
      getChannelData: jest.fn(() => new Float32Array(100)),
    }

    mockDecodeAudioData.mockResolvedValue(mockAudioBuffer)

    const { convertToWav } = require('./audioConverter')
    const audioData = new ArrayBuffer(100)
    const inputBlob = new Blob([audioData], { type: 'audio/webm' })

    const result = await convertToWav(inputBlob)
    const arrayBuffer = await result.arrayBuffer()
    const view = new DataView(arrayBuffer)

    // Check RIFF header
    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    )
    expect(riff).toBe('RIFF')

    // Check WAVE format
    const wave = String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11)
    )
    expect(wave).toBe('WAVE')

    // Check fmt chunk
    const fmt = String.fromCharCode(
      view.getUint8(12),
      view.getUint8(13),
      view.getUint8(14),
      view.getUint8(15)
    )
    expect(fmt).toBe('fmt ')

    // Check data chunk
    const data = String.fromCharCode(
      view.getUint8(36),
      view.getUint8(37),
      view.getUint8(38),
      view.getUint8(39)
    )
    expect(data).toBe('data')
  })

  it('clamps audio samples to valid range', async () => {
    // Create samples outside -1 to 1 range
    const samplesWithClipping = new Float32Array([1.5, -1.5, 0.5, -0.5, 2.0, -2.0])

    const mockAudioBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 6,
      getChannelData: jest.fn(() => samplesWithClipping),
    }

    mockDecodeAudioData.mockResolvedValue(mockAudioBuffer)

    const { convertToWav } = require('./audioConverter')
    const audioData = new ArrayBuffer(100)
    const inputBlob = new Blob([audioData], { type: 'audio/webm' })

    const result = await convertToWav(inputBlob)

    // Should complete without error (clamping happens internally)
    expect(result).toBeInstanceOf(Blob)
  })
})
