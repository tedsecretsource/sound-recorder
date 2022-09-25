import renderer from 'react-test-renderer';
import {render, screen} from '@testing-library/react';
import App from './App';

jest.mock('./hooks/useGetUserMedia')

describe('With an empty list of recordings', () => {
  // from https://stackoverflow.com/questions/61742491/referenceerror-mediastream-is-not-defined-with-jest-and-vue-typescript
  beforeAll(() => {
    window.MediaStream = jest.fn().mockImplementation(() => ({
      addTrack: jest.fn()
      // Add any method you want to mock
    }))
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