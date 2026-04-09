import { render, screen } from '@testing-library/react'
import Logo from './Logo'

describe('Logo component', () => {
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

  it('uses BASE_URL in src path', () => {
    render(<Logo />)

    const logo = screen.getByRole('img')
    expect(logo).toHaveAttribute('src', '/logo512.webp')
  })
})
