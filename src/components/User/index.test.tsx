import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render } from '@testing-library/react'
import User from './index'

vi.mock('../../contexts/FreesoundAuthContext', () => ({
    useFreesoundAuth: () => ({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
    })
}))

it('renders without crashing', () => {
    render(<User />);
})
