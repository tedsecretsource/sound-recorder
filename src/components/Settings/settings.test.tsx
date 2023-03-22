import setupMockedMediaDevices from '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render } from '@testing-library/react'
import Settings from './settings'

setupMockedMediaDevices()

// this is necessary because getUserMedia is called in the file being tested (via a custom hook)
jest.mock('../../hooks/useGetMediaRecorder', () => () => {
    const originalModule = jest.requireActual('../../hooks/useGetMediaRecorder');
    const mediaRecorder = {
      __esModule: true,
      ...originalModule,
        state: jest.fn(() => 'inactive'),
        ondataavailable: jest.fn(),
        onstop: jest.fn(),
        onstart: jest.fn(),
        onerror: jest.fn(),
        onpause: jest.fn(),
        onresume: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        stream: {
            id: 'stream-id',
            active: true,
            getTracks: jest.fn(() => [{ getSettings: jest.fn(() => ({ deviceId: 'device-id' }))}])
        },
    }
    return mediaRecorder
  })
  

it('renders without crashing', () => {
    render(<Settings />);
})
