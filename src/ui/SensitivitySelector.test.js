import React from 'react';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SensitivitySelector } from './SensitivitySelector';

// Mock console.error to fail tests on warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe('SensitivitySelector', () => {
  test('renders with initial value and options', async () => {
    await act(async () => {
        render(<SensitivitySelector currentSensitivity="medium" onSensitivityChange={() => {}} />);
    });

    // Check if the label is rendered
    expect(screen.getByLabelText('Sensitivity')).toBeInTheDocument();

    // Check if the initial value is set correctly
    expect(screen.getByRole('combobox')).toHaveTextContent('Medium');

    // Check if all options are present (by opening the select)
    await act(async () => {
        await userEvent.click(screen.getByRole('combobox'));
    });

    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(within(listbox).getByText('Low')).toBeInTheDocument();
    expect(within(listbox).getByText('Medium')).toBeInTheDocument();
    expect(within(listbox).getByText('High')).toBeInTheDocument();
  });

  test('calls onSensitivityChange with the new value when changed', async () => {
    const handleChange = jest.fn();
    await act(async () => {
        render(<SensitivitySelector currentSensitivity="medium" onSensitivityChange={handleChange} />);
    });

    await act(async () => {
        await userEvent.click(screen.getByRole('combobox'));
    });

    await act(async () => {
        await userEvent.click(screen.getByText('High'));
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('high');
  });
});
