import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as cdDetector from '../nlp/cd-detector';
import * as reframeEngine from '../nlp/reframe-engine';

// Mock the dependencies
jest.mock('../nlp/cd-detector');
jest.mock('../nlp/reframe-engine');
jest.mock('../audio/deepgram-client', () => ({
  startDeepgramStream: jest.fn(),
}));

describe('App Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('reproduces excessive getReframe calls', async () => {
    // Setup mocks
    // We want detectCDs to return a result so detectedCDs becomes non-empty.
    // IMPT: Must return a new array instance each time to trigger React state updates,
    // reflecting the real behavior of detectCDs.
    cdDetector.detectCDs.mockImplementation(() => Promise.resolve(['Catastrophizing']));
    reframeEngine.getReframe.mockResolvedValue('Try to think positively.');

    render(<App />);

    const input = screen.getByPlaceholderText(/I always mess things up/i);

    // 1. Initial input
    // We use fireEvent or userEvent. userEvent.type triggers key presses.
    // Since we are mocking timers, userEvent.type might hang if it waits.
    // Let's use userEvent but be careful.
    userEvent.type(input, 'A');

    // Advance timers to trigger debounce
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Wait for promises to resolve (detectCDs is async)
    // We can use process.nextTick or setImmediate loop, or just wait.
    // Since detectCDs returns a promise, we need to wait for it to resolve and state to update.
    await act(async () => {
      // Allow async effects to settle
      await Promise.resolve();
      await Promise.resolve();
    });

    // Expect detection to have happened
    expect(cdDetector.detectCDs).toHaveBeenCalledTimes(1);
    // Expect reframe to have happened once
    expect(reframeEngine.getReframe).toHaveBeenCalledTimes(1);

    // 2. Type another character
    // This triggers inputText change.
    userEvent.type(input, 'B');

    // In current implementation (optimized):
    // useEffect depends only on detectedCDs.
    // So getReframe should NOT be called immediately.

    expect(reframeEngine.getReframe).toHaveBeenCalledTimes(1);

    // 3. Type another character
    userEvent.type(input, 'C');
    expect(reframeEngine.getReframe).toHaveBeenCalledTimes(1);

    // 4. Advance timers to let debounce fire and detection happen
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Wait for async operations
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });

    // NOW it should have been called again (total 2)
    // detectCDs runs -> setDetectedCDs -> effect runs -> reframe
    expect(reframeEngine.getReframe).toHaveBeenCalledTimes(2);
  });
});
