import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SensitivitySelector } from './SensitivitySelector';

describe('SensitivitySelector', () => {
  test('renders with initial value and options', async () => {
    render(<SensitivitySelector currentSensitivity="medium" onSensitivityChange={() => {}} />);

    // Check if the label is rendered
    expect(screen.getByLabelText('Sensitivity')).toBeInTheDocument();

    // Check if the initial value is set correctly
    expect(screen.getByRole('combobox')).toHaveTextContent('Medium');

    // Check if all options are present (by opening the select)
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole('combobox'));
    });
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(within(listbox).getByText('Low')).toBeInTheDocument();
    expect(within(listbox).getByText('Medium')).toBeInTheDocument();
    expect(within(listbox).getByText('High')).toBeInTheDocument();
  });

  test('calls onSensitivityChange with the new value when changed', async () => {
    const handleChange = jest.fn();
    render(<SensitivitySelector currentSensitivity="medium" onSensitivityChange={handleChange} />);

    await act(async () => {
      fireEvent.mouseDown(screen.getByRole('combobox'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('High'));
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('high');
  });
});
