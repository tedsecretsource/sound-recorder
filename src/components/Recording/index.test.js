import React from 'react';
import Recording from './index'
import { render, screen, logRoles, prettyDOM } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * We need to mock the getUserMedia function
 * https://github.com/goldingdamien/get-user-media-mock
 * https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
 */

const stream = {
    key: "lsdkjflds",
    stream: "sdkfjsdf08sdf",
    name: "2021-06-18 07:37:46"
}

it('renders without crashing', () => {
    const div = document.createElement('div');
    render(<Recording stream={stream.stream} name={stream.name} key={stream.key} />, div);
})

it('recording can be renamed', async () => {
    const newName = 'The new name'
    global.prompt = () => newName // https://stackoverflow.com/questions/41732903/stubbing-window-functions-in-jest
    render(<Recording stream={stream.stream} name={stream.name} key={stream.key} />)
    const editButton = await screen.findByRole('button', { name: "Click to edit name"})
    const recordingName = await screen.findByRole('presentation')
    console.log(prettyDOM(recordingName))
    expect(editButton).toBeInTheDocument()
    userEvent.click(editButton)
    // wait for prompt
    // enter new name
    // click OK
    // expect new text in span
    expect(recordingName).toHaveTextContent(newName)
    console.log(prettyDOM(recordingName))

})