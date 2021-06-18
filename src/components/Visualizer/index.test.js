import React from 'react';
import ReactDOM from 'react-dom';
import Visualizer from './index'

/**
 * We need to mock the getUserMedia function
 * https://github.com/goldingdamien/get-user-media-mock
 * https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
 */

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Visualizer />, div);
})

