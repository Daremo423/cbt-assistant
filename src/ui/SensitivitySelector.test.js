import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    await userEvent.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(within(listbox).getByText('Low')).toBeInTheDocument();
    expect(within(listbox).getByText('Medium')).toBeInTheDocument();
    expect(within(listbox).getByText('High')).toBeInTheDocument();
  });

  test('calls onSensitivityChange with the new value when changed', async () => {
    const handleChange = jest.fn();
    render(<SensitivitySelector currentSensitivity="medium" onSensitivityChange={handleChange} />);

    // Material UI Select requires mouseDown to open
    fireEvent.mouseDown(screen.getByRole('combobox'));

    // Find the option in the portal (document.body) and click it
    const listbox = await screen.findByRole('listbox');
    const highOption = within(listbox).getByText('High');
    fireEvent.click(highOption);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('high');
  });
});
