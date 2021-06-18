/**
 * @jest-environment jsdom
 */
import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import { render, screen, logRoles } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect'
// import '../../mocks/mediaRecorder.js';
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
    useMediaRecorder.mockReturnValue({
        state: 'inactive', 
        start: jest.fn(), 
        stop: jest.fn(), 
        ondataavailable: jest.fn(),
        onstop: jest.fn()
    })
    const div = document.createElement('div');
    ReactDOM.render(<Recorder />, div);
})

it('is a snapshot', () => {
    useMediaRecorder.mockReturnValue({state: 'inactive', start: jest.fn(), stop: jest.fn(), ondataavailable: jest.fn()})
    const component = renderer.create(
        <Recorder />,
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
})

describe('Recording audio', () => {
    global.URL.createObjectURL = jest.fn();
    it('record turns colors when clicked', async () => {
        // has recording-audio been added to the classes?
        useMediaRecorder.mockReturnValue({state: 'inactive', start: jest.fn(), stop: jest.fn(), ondataavailable: jest.fn()})
        render(<Recorder />)
        const recordButton = await screen.findByRole('button')
        expect(recordButton).toBeInTheDocument()
        expect(recordButton).toHaveTextContent('Record')
        userEvent.click(recordButton)
        await screen.findByText('Stop')
        expect(recordButton).toHaveClass('recording-audio')
    })
})


