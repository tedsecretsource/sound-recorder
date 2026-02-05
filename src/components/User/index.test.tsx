import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render } from '@testing-library/react'
import User from './index'

jest.mock('../../contexts/FreesoundAuthContext', () => ({
    useFreesoundAuth: () => ({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
    })
}))

it('renders without crashing', () => {
    render(<User />);
})
