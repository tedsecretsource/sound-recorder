import renderer from 'react-test-renderer';
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

  test('has link to license, terms, and copyright', async () => {
    const component = await renderer.create(
      <App />,
    );
    expect(component).toContainHTML('href="./terms_of_use"');
    expect(component).toContainHTML('href="https://github.com/tedsecretsource/sound-recorder/blob/main/LICENSE.md"');
    expect(component).toContain('© Copyright Secret Source Technology 2022');
  });
})