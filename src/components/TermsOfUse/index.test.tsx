import {screen, render, act} from '@testing-library/react'
import TermsOfUse from './index'

test('markdown renders as HTML', async () => {
    await act(async () => {
        render(<TermsOfUse />)
    })
    expect(screen.getByText(/terms of use sound recorder/i)).toBeInTheDocument()
})
