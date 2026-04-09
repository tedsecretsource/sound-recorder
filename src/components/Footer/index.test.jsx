import { render, screen } from '@testing-library/react'
import { HashRouter, MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Footer from './index'

describe('Footer component', () => {
  it('renders all navigation icons', () => {
    render(<HashRouter><Footer /></HashRouter>)
    expect(screen.getByText('🎙')).toBeInTheDocument()
    expect(screen.getByText('🎧')).toBeInTheDocument()
    expect(screen.getByText('⚙️')).toBeInTheDocument()
    expect(screen.getByText('👤')).toBeInTheDocument()
  })

  it('renders footer element', () => {
    render(<HashRouter><Footer /></HashRouter>)
    expect(document.querySelector('footer')).toBeInTheDocument()
  })

  it('renders navigation element', () => {
    render(<HashRouter><Footer /></HashRouter>)
    expect(document.querySelector('nav')).toBeInTheDocument()
  })

  describe('NavLinks have correct "to" props', () => {
    it('Record link points to /', () => {
      render(<HashRouter><Footer /></HashRouter>)
      const recordLink = screen.getByRole('link', { name: '🎙' })
      expect(recordLink).toHaveAttribute('href', '#/')
    })

    it('Recordings link points to /recordings', () => {
      render(<HashRouter><Footer /></HashRouter>)
      const recordingsLink = screen.getByRole('link', { name: '🎧' })
      expect(recordingsLink).toHaveAttribute('href', '#/recordings')
    })

    it('Settings link points to /settings', () => {
      render(<HashRouter><Footer /></HashRouter>)
      const settingsLink = screen.getByRole('link', { name: '⚙️' })
      expect(settingsLink).toHaveAttribute('href', '#/settings')
    })

    it('User link points to /user', () => {
      render(<HashRouter><Footer /></HashRouter>)
      const userLink = screen.getByRole('link', { name: '👤' })
      expect(userLink).toHaveAttribute('href', '#/user')
    })
  })

  describe('NavLinks have correct titles', () => {
    it('Record link has correct title', () => {
      render(<HashRouter><Footer /></HashRouter>)
      const recordLink = screen.getByRole('link', { name: '🎙' })
      expect(recordLink).toHaveAttribute('title', 'Record')
    })

    it('Recordings link has correct title', () => {
      render(<HashRouter><Footer /></HashRouter>)
      const recordingsLink = screen.getByRole('link', { name: '🎧' })
      expect(recordingsLink).toHaveAttribute('title', 'Recordings')
    })

    it('Settings link has correct title', () => {
      render(<HashRouter><Footer /></HashRouter>)
      const settingsLink = screen.getByRole('link', { name: '⚙️' })
      expect(settingsLink).toHaveAttribute('title', 'Settings')
    })

    it('User link has correct title', () => {
      render(<HashRouter><Footer /></HashRouter>)
      const userLink = screen.getByRole('link', { name: '👤' })
      expect(userLink).toHaveAttribute('title', 'User Details')
    })
  })

  describe('Active link styling', () => {
    it('home link is selected when on root route', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      )
      const recordLink = screen.getByRole('link', { name: '🎙' })
      expect(recordLink).toHaveClass('selected')
    })

    it('recordings link is selected when on recordings route', () => {
      render(
        <MemoryRouter initialEntries={['/recordings']}>
          <Footer />
        </MemoryRouter>
      )
      const recordingsLink = screen.getByRole('link', { name: '🎧' })
      expect(recordingsLink).toHaveClass('selected')
    })

    it('settings link is selected when on settings route', () => {
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <Footer />
        </MemoryRouter>
      )
      const settingsLink = screen.getByRole('link', { name: '⚙️' })
      expect(settingsLink).toHaveClass('selected')
    })

    it('user link is selected when on user route', () => {
      render(
        <MemoryRouter initialEntries={['/user']}>
          <Footer />
        </MemoryRouter>
      )
      const userLink = screen.getByRole('link', { name: '👤' })
      expect(userLink).toHaveClass('selected')
    })
  })

  describe('Navigation click behavior', () => {
    it('clicking recording link navigates to recordings page', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      )

      const recordingsLink = screen.getByRole('link', { name: '🎧' })
      await userEvent.click(recordingsLink)

      expect(recordingsLink).toHaveClass('selected')
    })
  })
})
