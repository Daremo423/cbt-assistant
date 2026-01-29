import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export const DisclaimerDialog = () => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {"Disclaimer"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          This application is not a substitute for professional mental health advice. If you are in crisis, please call emergency services.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          I Understand
        </Button>
      </DialogActions>
    </Dialog>
  );
};
