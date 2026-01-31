import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render } from '@testing-library/react'
import User from './index'



it('renders without crashing', () => {
    render(<User />);
})
