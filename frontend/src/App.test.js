import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

test('renders App component without crashing', () => {
  render(<App />);
});
