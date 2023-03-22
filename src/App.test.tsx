import setupMockedMediaDevices from './__nativeBrowserObjectMocks__/nativeBrowserObjects'
import {render} from '@testing-library/react'
import { HashRouter } from 'react-router-dom'
import App from './App'

jest.mock('./hooks/useGetMediaRecorder', () => () => {
  const originalModule = jest.requireActual('./hooks/useGetMediaRecorder');
  return {
    __esModule: true,
    ...originalModule,
    start: function() {this.state = 'recording'},
    stop: function() {this.state = 'inactive'},
    state: 'inactive',
    ondataavailable: jest.fn(),
    onstop: jest.fn(),
    onstart: jest.fn(),
    onerror: jest.fn(),
    onpause: jest.fn(),
    onresume: jest.fn(),
  }
})

jest.mock('./hooks/useIndexedDB', () => () => {
  const originalModule = jest.requireActual('./hooks/useIndexedDB');

  return {
    __esModule: true,
    ...originalModule,
    connectionIsOpen: true,
    getRecordingFromDB: jest.fn(() => Promise.resolve({
      id: 1,
      name: 'test',
      data: new Blob(['test'], { type: 'audio/mp4' }),
      length: 0,
      audioURL: 'test'
    })),
    getAllRecordingsFromDB: jest.fn(() => Promise.resolve([])),
    addRecording: jest.fn(() => Promise.resolve(Math.floor(Math.random() * 100000))),
    putRecording: jest.fn(() => Promise.resolve(true)),
    deleteRecordingFromDB: jest.fn(() => Promise.resolve(true)),
  }
})

setupMockedMediaDevices()

// jest.mock('./components/Recorder', () => () => 'Recorder')
describe('With an empty list of recordings', () => {
  test('renders Sound Recorder title', async () => {
    let tree
    const view = render(<HashRouter><App /></HashRouter>)
    tree = view.asFragment()
    expect(tree).toMatchSnapshot()
  })
})