import renderer from 'react-test-renderer';
import {render, screen} from '@testing-library/react';
import App from './App';


const setupMockedMediaDevices = () => {
  const mockMediaDevices = {
    getUserMedia: jest.fn().mockResolvedValueOnce('fake data' as any),
  }

  Object.defineProperty(window.navigator, 'mediaDevices', {
    writable: true,
    value: mockMediaDevices,
  })

  window.MediaStream = jest.fn().mockImplementation(() => ({
    addTrack: jest.fn()
  }))
}


describe('With an empty list of recordings', () => {
  beforeEach(() => {
    setupMockedMediaDevices()
  })

  test('renders Sound Recorder title', async () => {
    const component = await renderer.create(
      <App />,
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('has link to license, terms, and copyright notice', async () => {
    render(<App />)
    expect(screen.getByText('Terms of Use')).toBeInTheDocument()
    expect(screen.getByText('Terms of Use')).toHaveAttribute('href', './terms_of_use')
    expect(screen.getByText('License')).toBeInTheDocument()
    expect(screen.getByText('License')).toHaveAttribute('href', 'https://github.com/tedsecretsource/sound-recorder/blob/main/LICENSE.md')
    expect(screen.getByText('© Copyright Secret Source Technology 2022')).toBeInTheDocument()
  });
})