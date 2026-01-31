import { screen, render, act, waitFor } from '@testing-library/react'
import TermsOfUse from './index'

describe('TermsOfUse component', () => {
  beforeEach(() => {
    // Mock global fetch to prevent network requests
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve('')
      } as Response)
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the main heading', async () => {
    await act(async () => {
      render(<TermsOfUse />)
    })
    expect(screen.getByRole('heading', { level: 1, name: /terms of use sound recorder/i })).toBeInTheDocument()
  })

  it('renders the last revised date', async () => {
    await act(async () => {
      render(<TermsOfUse />)
    })
    expect(screen.getByText(/last revised on 11-11-2022/i)).toBeInTheDocument()
  })

  it('renders The Gist section', async () => {
    await act(async () => {
      render(<TermsOfUse />)
    })
    expect(screen.getByRole('heading', { level: 2, name: /the gist/i })).toBeInTheDocument()
  })

  it('renders multiple sections', async () => {
    await act(async () => {
      render(<TermsOfUse />)
    })
    expect(screen.getByRole('heading', { name: /your agreement with secret source technology/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^your account$/i })).toBeInTheDocument()
    // Use getAllByRole since there are multiple "use of sound recorder" headings
    expect(screen.getAllByRole('heading', { name: /use of sound recorder/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /^privacy policy$/i })).toBeInTheDocument()
  })

  it('contains Secret Source Technology references', async () => {
    await act(async () => {
      render(<TermsOfUse />)
    })
    // Use getAllByText since there are multiple matches
    expect(screen.getAllByText(/secret source technology/i).length).toBeGreaterThan(0)
  })

  it('contains link to secret-source.eu', async () => {
    await act(async () => {
      render(<TermsOfUse />)
    })
    const link = screen.getByRole('link', { name: /secret source technology slu/i })
    expect(link).toHaveAttribute('href', 'https://secret-source.eu')
  })
})
