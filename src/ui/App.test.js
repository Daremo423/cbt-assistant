import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock axios to avoid ESM issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  })),
}));

// Mock deepgram client
jest.mock('../audio/deepgram-client', () => ({
  startDeepgramStream: jest.fn(),
}));

// Mock NLP services
jest.mock('../nlp/cd-detector', () => ({
  detectCDs: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../nlp/reframe-engine', () => ({
  getReframe: jest.fn(() => Promise.resolve('')),
}));

test('redirects to login when not authenticated', async () => {
  render(<App />);

  // Wait for loading to finish and Login to appear
  await waitFor(() => {
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  // Should not see Dashboard content
  expect(screen.queryByText('Reframing Suggestion')).not.toBeInTheDocument();
});
