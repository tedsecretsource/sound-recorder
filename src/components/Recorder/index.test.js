/**
 * @jest-environment jsdom
 */
import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect'
import '../../mocks/mediaRecorder.js';
import Recorder from './index'
import useMediaRecorder from '../../hooks/useMediaRecorder'
jest.mock('../../hooks/useMediaRecorder')

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
    useMediaRecorder.mockReturnValue({state: 'inactive', start: jest.fn(), stop: jest.fn(), ondataavailable: jest.fn()})
    const component = renderer.create(
        <Recorder />,
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    
    // has recording-audio been added to the classes?
    render(<Recorder />)
    const recordButton = await screen.findByRole('button')
    expect(recordButton).toBeInTheDocument()
    expect(recordButton).toHaveTextContent('Record')
    userEvent.click(recordButton)
    await screen.findByText('Stop')
    expect(recordButton).toHaveClass('recording-audio')
})

it('prompts for name when recording is done', () => {
    // click recording button to start recording
    // click recording button to stop recording
    // expect to see name dialog
})

it('saves name', () => {

})