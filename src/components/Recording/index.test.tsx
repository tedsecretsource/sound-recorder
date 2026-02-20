import Recording from './index'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockActions = {
    onDelete: jest.fn(),
    onEditName: jest.fn(),
    onSaveDescription: jest.fn(),
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
            recording: { ...mockRecording, freesoundId: 123, moderationStatus: 'processing' as const },
        }
        render(<Recording {...props} />)

        expect(screen.queryByRole('button', { name: /click to edit name/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /click to edit description/i })).not.toBeInTheDocument()
    })

    it('hides edit buttons when moderationStatus is in_moderation', () => {
        const props = {
            ...mockProps,
            recording: { ...mockRecording, freesoundId: 123, moderationStatus: 'in_moderation' as const },
        }
        render(<Recording {...props} />)

        expect(screen.queryByRole('button', { name: /click to edit name/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /click to edit description/i })).not.toBeInTheDocument()
    })

    it('shows edit buttons when moderationStatus is approved', () => {
        const props = {
            ...mockProps,
            recording: { ...mockRecording, freesoundId: 123, moderationStatus: 'approved' as const },
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

    describe('Inline description editing', () => {
        it('clicking edit description button shows textarea with Save and Cancel buttons', async () => {
            render(<Recording {...mockProps} />)

            const editButton = screen.getByRole('button', { name: /click to edit description/i })
            await userEvent.click(editButton)

            expect(screen.getByRole('textbox')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
        })

        it('textarea has correct attributes for mobile input', async () => {
            render(<Recording {...mockProps} />)

            const editButton = screen.getByRole('button', { name: /click to edit description/i })
            await userEvent.click(editButton)

            const textarea = screen.getByRole('textbox')
            expect(textarea).toHaveAttribute('rows', '5')
            expect(textarea).toHaveAttribute('maxlength', '500')
            expect(textarea).toHaveAttribute('autocapitalize', 'sentences')
        })

        it('textarea is pre-filled with existing description', async () => {
            const props = {
                ...mockProps,
                recording: { ...mockRecording, description: 'Existing description text' },
            }
            render(<Recording {...props} />)

            const editButton = screen.getByRole('button', { name: /click to edit description/i })
            await userEvent.click(editButton)

            const textarea = screen.getByRole('textbox')
            expect(textarea).toHaveValue('Existing description text')
        })

        it('Save button calls onSaveDescription with id and trimmed text', async () => {
            render(<Recording {...mockProps} />)

            const editButton = screen.getByRole('button', { name: /click to edit description/i })
            await userEvent.click(editButton)

            const textarea = screen.getByRole('textbox')
            await userEvent.type(textarea, 'A new description')

            const saveButton = screen.getByRole('button', { name: /save/i })
            await userEvent.click(saveButton)

            expect(mockActions.onSaveDescription).toHaveBeenCalledWith(1, 'A new description')
            // Textarea should be hidden after save
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
        })

        it('Cancel button reverts to display mode without saving', async () => {
            const props = {
                ...mockProps,
                recording: { ...mockRecording, description: 'Original' },
            }
            render(<Recording {...props} />)

            const editButton = screen.getByRole('button', { name: /click to edit description/i })
            await userEvent.click(editButton)

            const textarea = screen.getByRole('textbox')
            await userEvent.clear(textarea)
            await userEvent.type(textarea, 'Changed text')

            const cancelButton = screen.getByRole('button', { name: /cancel/i })
            await userEvent.click(cancelButton)

            expect(mockActions.onSaveDescription).not.toHaveBeenCalled()
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
            expect(screen.getByText('Original')).toBeInTheDocument()
        })

        it('hides edit description pencil while editing', async () => {
            render(<Recording {...mockProps} />)

            const editButton = screen.getByRole('button', { name: /click to edit description/i })
            await userEvent.click(editButton)

            expect(screen.queryByRole('button', { name: /click to edit description/i })).not.toBeInTheDocument()
        })
    })
})
