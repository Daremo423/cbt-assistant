import React, { useState, useEffect } from 'react';
import { TranscriptionWindow } from './TranscriptionWindow';
import { ReframeWindow } from './ReframeWindow';
import { SensitivitySelector } from './SensitivitySelector';
import { detectCDs } from '../nlp/cd-detector';
import { getReframe } from '../nlp/reframe-engine';
import { startDeepgramStream } from '../audio/deepgram-client';
import {
  Container, Typography, TextField, Button, Grid, Card, CardContent, CircularProgress, Box,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

// API Key Checks
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;

if (!GEMINI_API_KEY) console.warn("GEMINI_API_KEY not set. Reframing suggestions disabled.");
if (!DEEPGRAM_API_KEY) console.warn("DEEPGRAM_API_KEY not set. Speech-to-text disabled.");

function Dashboard() {
  const [inputText, setInputText] = useState('');
  const [detectedCDs, setDetectedCDs] = useState([]);
  const [reframingSuggestion, setReframingSuggestion] = useState('');
  const [sensitivity, setSensitivity] = useState('medium');
  const [loadingCDs, setLoadingCDs] = useState(false);
  const [loadingReframe, setLoadingReframe] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stopStreamFn, setStopStreamFn] = useState(null);

  const [openDisclaimer, setOpenDisclaimer] = useState(true);

  const handleDisclaimerClose = () => {
    setOpenDisclaimer(false);
  };

  useEffect(() => {
    const detect = async () => {
      if (inputText.trim() === '') {
        setDetectedCDs([]);
        setReframingSuggestion('');
        return;
      }
      setLoadingCDs(true);
      const cds = await detectCDs(inputText, sensitivity);
      setDetectedCDs(cds);
      setLoadingCDs(false);
    };
    const handler = setTimeout(() => detect(), 500); // Debounce detection
    return () => clearTimeout(handler);
  }, [inputText, sensitivity]);

  useEffect(() => {
    const reframe = async () => {
      if (detectedCDs.length > 0) {
        setLoadingReframe(true);
        const suggestion = await getReframe(detectedCDs[0], inputText);
        setReframingSuggestion(suggestion);
        setLoadingReframe(false);
      } else {
        setReframingSuggestion('');
      }
    };
    reframe();
  }, [detectedCDs, inputText]);

  const handleStartRecording = async () => {
    if (!DEEPGRAM_API_KEY) {
      alert("DEEPGRAM_API_KEY is not set.");
      return;
    }
    const onTranscription = (transcript) => {
      setInputText(prevText => (prevText.trim() ? prevText + ' ' : '') + transcript);
    };
    const stopFn = await startDeepgramStream(DEEPGRAM_API_KEY, onTranscription);
    setStopStreamFn(() => stopFn);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (stopStreamFn) stopStreamFn();
    setIsRecording(false);
    setStopStreamFn(null);
  };

  const highlightWords = inputText.split(' ').map(() => detectedCDs.length > 0);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        CBT Assistant
      </Typography>

      <Dialog
        open={openDisclaimer}
        onClose={() => {}}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Legal Disclaimer"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This application is an AI-powered tool for educational and self-help purposes only.
            It is NOT a substitute for professional mental health advice, diagnosis, or treatment.
            If you are experiencing a crisis, please contact your local emergency services immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisclaimerClose} autoFocus>
            I Agree
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Your Thoughts</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="I always mess things up. I should have done better."
                disabled={isRecording}
                variant="outlined"
                sx={{ mt: 2 }}
              />
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  onClick={!isRecording ? handleStartRecording : handleStopRecording}
                  disabled={!DEEPGRAM_API_KEY}
                  startIcon={isRecording ? <MicOffIcon /> : <MicIcon />}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                {isRecording && <CircularProgress size={24} sx={{ ml: 2 }} />}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Transcription & Analysis</Typography>
              {loadingCDs ? <CircularProgress /> : <TranscriptionWindow transcript={inputText} highlights={highlightWords} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
            <Card>
                <CardContent>
                    <Typography variant="h6">Detected Distortions</Typography>
                    {loadingCDs ? <CircularProgress /> : (
                        detectedCDs.length > 0 ? (
                            <ul>{detectedCDs.map((cd, i) => <li key={i}>{cd}</li>)}</ul>
                        ) : <p>None detected.</p>
                    )}
                </CardContent>
            </Card>
        </Grid>

        <Grid item xs={12}>
            <Card>
                <CardContent>
                    <SensitivitySelector currentSensitivity={sensitivity} onSensitivityChange={setSensitivity} />
                </CardContent>
            </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Reframing Suggestion</Typography>
              {loadingReframe ? <CircularProgress /> : <ReframeWindow suggestion={reframingSuggestion} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
