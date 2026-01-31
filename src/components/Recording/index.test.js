import Recording from './index'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockProps = {
    streamURL: 'blob:https://localhost:3000/test-audio',
    name: '2021-06-18 07:37:46',
    id: 1,
    mimeType: 'audio/webm',
    onDeleteHandler: jest.fn(),
    onEditNameHandler: jest.fn()
}

describe('Recording component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders without crashing', () => {
        render(<Recording {...mockProps} />)
    })

    it('renders name', () => {
        render(<Recording {...mockProps} />)
        expect(screen.getByText('2021-06-18 07:37:46')).toBeInTheDocument()
    })

    it('renders audio element', () => {
        render(<Recording {...mockProps} />)
        const audio = screen.getByRole('application')
        expect(audio).toBeInTheDocument()
        expect(audio.tagName.toLowerCase()).toBe('audio')
    })

    it('renders edit button', () => {
        render(<Recording {...mockProps} />)
        const editButton = screen.getByRole('button', { name: /click to edit name/i })
        expect(editButton).toBeInTheDocument()
    })

    it('renders delete button', () => {
        render(<Recording {...mockProps} />)
        const deleteButton = screen.getByRole('button', { name: /delete/i })
        expect(deleteButton).toBeInTheDocument()
    })

    it('edit button calls onEditNameHandler with id', async () => {
        render(<Recording {...mockProps} />)

        const editButton = screen.getByRole('button', { name: /click to edit name/i })
        await userEvent.click(editButton)

        expect(mockProps.onEditNameHandler).toHaveBeenCalledTimes(1)
        expect(mockProps.onEditNameHandler).toHaveBeenCalledWith(1)
    })

    it('delete button calls onDeleteHandler with id', async () => {
        render(<Recording {...mockProps} />)

        const deleteButton = screen.getByRole('button', { name: /delete/i })
        await userEvent.click(deleteButton)

        expect(mockProps.onDeleteHandler).toHaveBeenCalledTimes(1)
        expect(mockProps.onDeleteHandler).toHaveBeenCalledWith(1)
    })

    it('delete adds vanish class to article', async () => {
        render(<Recording {...mockProps} />)

        const article = screen.getByRole('article')
        expect(article).not.toHaveClass('vanish')

        const deleteButton = screen.getByRole('button', { name: /delete/i })
        await userEvent.click(deleteButton)

        expect(article).toHaveClass('vanish')
    })

    it('article has correct id attribute', () => {
        render(<Recording {...mockProps} />)
        const article = screen.getByRole('article')
        expect(article).toHaveAttribute('id', '1')
    })
})
