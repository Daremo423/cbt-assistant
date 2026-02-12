import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SensitivitySelector } from './SensitivitySelector';

describe('SensitivitySelector', () => {
  test('renders with initial value and options', () => {
    render(<SensitivitySelector currentSensitivity="medium" onSensitivityChange={() => {}} />);

    // Check if the label is rendered
    expect(screen.getByLabelText('Sensitivity')).toBeInTheDocument();

    // Check if the initial value is set correctly.
    // The role is 'combobox' based on the error output.
    const selectTrigger = screen.getByRole('combobox', { name: /sensitivity/i });
    expect(selectTrigger).toHaveTextContent('Medium');

    // Open the select
    fireEvent.mouseDown(selectTrigger);

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(within(listbox).getByText('Low')).toBeInTheDocument();
    expect(within(listbox).getByText('Medium')).toBeInTheDocument();
    expect(within(listbox).getByText('High')).toBeInTheDocument();
  });

  test('calls onSensitivityChange with the new value when changed', () => {
    const handleChange = jest.fn();
    render(<SensitivitySelector currentSensitivity="medium" onSensitivityChange={handleChange} />);

    const selectTrigger = screen.getByRole('combobox', { name: /sensitivity/i });

    // Open
    fireEvent.mouseDown(selectTrigger);
    // Click option
    fireEvent.click(screen.getByText('High'));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('high');
  });
});
