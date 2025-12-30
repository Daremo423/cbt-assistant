import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

export const SensitivitySelector = ({ currentSensitivity, onSensitivityChange }) => (
  <Box sx={{ minWidth: 120 }}>
    <FormControl fullWidth>
      <InputLabel id="sensitivity-select-label">Sensitivity</InputLabel>
      <Select
        labelId="sensitivity-select-label"
        id="sensitivity-select"
        value={currentSensitivity}
        label="Sensitivity"
        onChange={(e) => onSensitivityChange(e.target.value)}
      >
        <MenuItem value="low">Low</MenuItem>
        <MenuItem value="medium">Medium</MenuItem>
        <MenuItem value="high">High</MenuItem>
      </Select>
    </FormControl>
  </Box>
);
