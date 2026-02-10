import React from 'react';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SensitivitySelector } from './SensitivitySelector';

describe('SensitivitySelector', () => {
  test('renders with initial value and options', async () => {
    // Render the component
    render(<SensitivitySelector currentSensitivity="medium" onSensitivityChange={() => {}} />);

    // Check if the label is rendered
    expect(screen.getByLabelText('Sensitivity')).toBeInTheDocument();

    // Check if the initial value is set correctly (MUI Select renders the value inside the combobox div)
    // In some versions/configurations, MUI Select is a combobox, not a button
    expect(screen.getByRole('combobox')).toHaveTextContent('Medium');
  });

  test('calls onSensitivityChange with the new value when changed', async () => {
    const handleChange = jest.fn();
    render(<SensitivitySelector currentSensitivity="medium" onSensitivityChange={handleChange} />);

    // Open the select menu (MUI Select uses mouseDown to open)
    // Use getByRole('combobox') as the trigger
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.mouseDown(selectTrigger);

    // Wait for the listbox (menu options) to appear
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // Find and click the 'High' option inside the listbox
    const highOption = within(listbox).getByText('High');
    fireEvent.click(highOption);

    // Assert that the callback was called with the correct value
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('high');
  });
});
