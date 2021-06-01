import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Sound Recorder title', () => {
  render(<App />);
  const linkElement = screen.getByText(/Sound Recorder/i);
  expect(linkElement).toBeInTheDocument();
});
