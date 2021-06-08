import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import '../../mocks/mediaRecorder.js';
import Recorder from './index'

beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    // Recorder.mockClear();
});

/**
 * We need to mock the getUserMedia function
 * https://github.com/goldingdamien/get-user-media-mock
 * https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
 */
it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Recorder />, div);
})

it('record turns colors when clicked', async () => {
    // const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({current: {MediaRecorder}})
    // const spy = jest.spyOn(MediaRecorder, 'start')
    const component = await renderer.create(
        <Recorder />,
      );
      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    
      // manually trigger the callback
      tree.props.onClick();
      // re-rendering
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    
      // manually trigger the callback
      tree.props.onClick();
      // re-rendering
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    //   spy.mockRestore();
})

it('prompts for name when recording is done', () => {
    // click recording button to start recording
    // click recording button to stop recording
    // expect to see name dialog
})

it('saves name', () => {

})