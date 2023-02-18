import setupMockedMediaDevices from '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render } from '@testing-library/react'
import Visualizer from './index'

setupMockedMediaDevices()
var mr = new global.MediaRecorder(new MediaStream(), { mimeType: 'audio/mp4' })



it('renders without crashing', () => {
    render(<Visualizer stream={mr.stream} barColor={[18,124,85]} />);
})

