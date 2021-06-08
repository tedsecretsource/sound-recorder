import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
//import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Sound Recorder title', async () => {
  // render(<App />);
  // const linkElement = screen.getByText(/Sound Recorder/i);
  // expect(linkElement).toBeInTheDocument();
  const component = await renderer.create(
    <App />,
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
