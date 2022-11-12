import {act, render, screen} from '@testing-library/react'
import { HashRouter } from 'react-router-dom'
import App from './App'

jest.mock('./components/RecorderProvider', () => () => 'RecorderProvider')

describe('With an empty list of recordings', () => {
  beforeEach(() => {
  })

  test('renders Sound Recorder title', async () => {
    let tree
    await act( async () => {
      const component = render(<HashRouter><App /></HashRouter>)
      tree = component.asFragment()
    })
    expect(tree).toMatchSnapshot()
  })

  test('has link to license, terms, and copyright notice', async () => {
    await act( async () => {
      render(<HashRouter><App /></HashRouter>)
    })
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument()
    expect(screen.getByText('License')).toBeInTheDocument()
    expect(screen.getByText('License')).toHaveAttribute('href', 'https://github.com/tedsecretsource/sound-recorder/blob/main/LICENSE.md')
    expect(screen.getByText('© Copyright Secret Source Technology 2022')).toBeInTheDocument()
  })
})