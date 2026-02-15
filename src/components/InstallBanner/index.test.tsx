import { render, screen, fireEvent } from '@testing-library/react'

const mockUseInstallPrompt = jest.fn()

jest.mock('../../hooks/useInstallPrompt', () => ({
    __esModule: true,
    default: () => mockUseInstallPrompt(),
}))

import InstallBanner from './index'

describe('InstallBanner', () => {
    const defaultHookValue = {
        isInstallable: true,
        promptInstall: jest.fn(),
        dismiss: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseInstallPrompt.mockReturnValue(defaultHookValue)
    })

    it('renders the banner when installable', () => {
        render(<InstallBanner />)

        expect(screen.getByText(/install this app/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()
    })

    it('renders nothing when not installable', () => {
        mockUseInstallPrompt.mockReturnValue({
            ...defaultHookValue,
            isInstallable: false,
        })

        const { container } = render(<InstallBanner />)
        expect(container.firstChild).toBeNull()
    })

    it('calls promptInstall when install button is clicked', () => {
        const promptInstall = jest.fn()
        mockUseInstallPrompt.mockReturnValue({
            ...defaultHookValue,
            promptInstall,
        })

        render(<InstallBanner />)
        fireEvent.click(screen.getByRole('button', { name: 'Install' }))

        expect(promptInstall).toHaveBeenCalled()
    })

    it('calls dismiss when dismiss button is clicked', () => {
        const dismiss = jest.fn()
        mockUseInstallPrompt.mockReturnValue({
            ...defaultHookValue,
            dismiss,
        })

        render(<InstallBanner />)
        fireEvent.click(screen.getByRole('button', { name: /dismiss install/i }))

        expect(dismiss).toHaveBeenCalled()
    })
})
