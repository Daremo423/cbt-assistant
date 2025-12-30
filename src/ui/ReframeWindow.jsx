import React from 'react';
import { Typography, Box } from '@mui/material';

export const ReframeWindow = ({ suggestion }) => (
  <Box sx={{ p: 2, backgroundColor: '#e3f6f5', borderRadius: '4px', minHeight: '80px' }}>
    <Typography variant="body1">{suggestion}</Typography>
  </Box>
);
