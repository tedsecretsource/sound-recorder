import Recording from './index'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockActions = {
    onDelete: jest.fn(),
    onEditName: jest.fn(),
    onEditDescription: jest.fn(),
    onBstCategoryChange: jest.fn(),
}

const mockRecording = {
    id: 1,
    streamURL: 'blob:https://localhost:3000/test-audio',
    name: '2021-06-18 07:37:46',
}

const mockProps = {
    recording: mockRecording,
    mimeType: 'audio/webm',
    actions: mockActions,
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

    it('edit button calls onEditName with id', async () => {
        render(<Recording {...mockProps} />)

        const editButton = screen.getByRole('button', { name: /click to edit name/i })
        await userEvent.click(editButton)

        expect(mockActions.onEditName).toHaveBeenCalledTimes(1)
        expect(mockActions.onEditName).toHaveBeenCalledWith(1)
    })

    it('delete button calls onDelete with id', async () => {
        render(<Recording {...mockProps} />)

        const deleteButton = screen.getByRole('button', { name: /delete/i })
        await userEvent.click(deleteButton)

        expect(mockActions.onDelete).toHaveBeenCalledTimes(1)
        expect(mockActions.onDelete).toHaveBeenCalledWith(1)
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

    it('hides edit buttons when moderationStatus is processing', () => {
        const props = {
            ...mockProps,
            recording: { ...mockRecording, freesoundId: 123, moderationStatus: 'processing' },
        }
        render(<Recording {...props} />)

        expect(screen.queryByRole('button', { name: /click to edit name/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /click to edit description/i })).not.toBeInTheDocument()
    })

    it('hides edit buttons when moderationStatus is in_moderation', () => {
        const props = {
            ...mockProps,
            recording: { ...mockRecording, freesoundId: 123, moderationStatus: 'in_moderation' },
        }
        render(<Recording {...props} />)

        expect(screen.queryByRole('button', { name: /click to edit name/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /click to edit description/i })).not.toBeInTheDocument()
    })

    it('shows edit buttons when moderationStatus is approved', () => {
        const props = {
            ...mockProps,
            recording: { ...mockRecording, freesoundId: 123, moderationStatus: 'approved' },
        }
        render(<Recording {...props} />)

        expect(screen.getByRole('button', { name: /click to edit name/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /click to edit description/i })).toBeInTheDocument()
    })

    it('shows edit buttons when no moderationStatus (not yet synced)', () => {
        render(<Recording {...mockProps} />)

        expect(screen.getByRole('button', { name: /click to edit name/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /click to edit description/i })).toBeInTheDocument()
    })
})
