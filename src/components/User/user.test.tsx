import setupMockedMediaDevices from '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render } from '@testing-library/react'
import User from './user'

setupMockedMediaDevices()
var mr = new global.MediaRecorder(new MediaStream(), { mimeType: 'audio/mp4' })



it('renders without crashing', () => {
    render(<User />);
})
