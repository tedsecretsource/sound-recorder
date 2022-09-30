import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Footer from './index';

test('has link to license, terms, and copyright notice', async () => {
    render(<Footer />)
    expect(screen.getByText('Terms of Use')).toBeInTheDocument()
    expect(screen.getByText('Terms of Use')).toHaveAttribute('href', './terms_of_use')
    expect(screen.getByText('License')).toBeInTheDocument()
    expect(screen.getByText('License')).toHaveAttribute('href', 'https://github.com/tedsecretsource/sound-recorder/blob/main/LICENSE.md')
    expect(screen.getByText('License')).toHaveAttribute('target', '_blank')
    expect(screen.getByText('License')).toHaveAttribute('rel', 'noreferrer')
    expect(screen.getByText('© Copyright Secret Source Technology 2022')).toBeInTheDocument()
});

// test('click on terms displays terms', async () => {
//     const user = userEvent.setup()
//     render(<Footer />)
//     await user.click(screen.getByRole('link', {name: /Terms of Use/i}))
//     expect(screen.getByText('liability')).toBeInTheDocument()
// });