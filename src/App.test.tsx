import setupMockedMediaDevices from './__nativeBrowserObjectMocks__/nativeBrowserObjects'
import {act, render, screen} from '@testing-library/react'
import App from './App'


describe('With an empty list of recordings', () => {
  beforeEach(() => {
    setupMockedMediaDevices()
  })

  test('renders Sound Recorder title', async () => {
    let tree
    await act( async () => {
      const component = render(<App />)
      tree = component.asFragment()
    })
    expect(tree).toMatchSnapshot()
  })

  test('has link to license, terms, and copyright notice', async () => {
    await act( async () => {
      render(<App />)
    })
    expect(screen.getByText('Terms of Use')).toBeInTheDocument()
    expect(screen.getByText('Terms of Use')).toHaveAttribute('href', './terms_of_use')
    expect(screen.getByText('License')).toBeInTheDocument()
    expect(screen.getByText('License')).toHaveAttribute('href', 'https://github.com/tedsecretsource/sound-recorder/blob/main/LICENSE.md')
    expect(screen.getByText('© Copyright Secret Source Technology 2022')).toBeInTheDocument()
  })
})