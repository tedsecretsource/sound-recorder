import { render, screen } from '@testing-library/react'
import Logo from './Logo'

describe('Logo component', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, PUBLIC_URL: '/app' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('renders without crashing', () => {
    render(<Logo />)

    const logo = screen.getByRole('img')
    expect(logo).toBeInTheDocument()
  })

  it('renders an img element', () => {
    render(<Logo />)

    const logo = screen.getByRole('img')
    expect(logo.tagName).toBe('IMG')
  })

  it('has correct alt text', () => {
    render(<Logo />)

    const logo = screen.getByAltText('logo')
    expect(logo).toBeInTheDocument()
  })

  it('has logo-file class', () => {
    render(<Logo />)

    const logo = screen.getByRole('img')
    expect(logo).toHaveClass('logo-file')
  })

  it('uses PUBLIC_URL in src path', () => {
    render(<Logo />)

    const logo = screen.getByRole('img')
    expect(logo).toHaveAttribute('src', '/app/logo512.webp')
  })

  it('renders with empty PUBLIC_URL', () => {
    process.env = { ...process.env, PUBLIC_URL: '' }
    render(<Logo />)

    const logo = screen.getByRole('img')
    expect(logo).toHaveAttribute('src', '/logo512.webp')
  })
})
