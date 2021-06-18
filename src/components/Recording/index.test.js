import React from 'react';
import ReactDOM from 'react-dom';
import Recording from './index'
import { render, screen, logRoles } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * We need to mock the getUserMedia function
 * https://github.com/goldingdamien/get-user-media-mock
 * https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
 */

const stream = {
    key: "lsdkjflds",
    stream: "sdkfjsdf08sdf",
    name: "is this right?"
}

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Recording stream={stream} />, div);
})

it('recording can be renamed', async () => {
    const newName = 'The new name'
    render(<Recording stream={stream} />)
    const editButton = await screen.findByRole('button', { name: "Click to edit name"})
    const recordingName = await screen.findByRole('presentation')
    expect(editButton).toBeInTheDocument()
    userEvent.click(editButton)
    // wait for prompt
    // enter new name
    // click OK
    window.confirm = jest.fn().mockImplementation(() => newName) // https://stackoverflow.com/questions/41732903/stubbing-window-functions-in-jest
    // expect new text in span
    // expect(recordingName).toHaveTextContent(newName)

})