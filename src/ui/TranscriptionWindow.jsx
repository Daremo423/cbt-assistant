import React from 'react';
import { Typography, Box } from '@mui/material';

export const TranscriptionWindow = ({ transcript, highlights }) => (
  <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '4px', minHeight: '120px', whiteSpace: 'pre-wrap' }}>
    <Typography component="div">
      {transcript.split(' ').map((word, i) =>
        highlights[i] ? (
          <Box component="span" key={i} sx={{ backgroundColor: '#ffe066', borderRadius: '4px' }}>
            {word + ' '}
          </Box>
        ) : (
          <span key={i}>{word + ' '}</span>
        )
      )}
    </Typography>
  </Box>
);
