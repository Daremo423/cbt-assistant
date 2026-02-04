import React, { useState, useEffect } from 'react';
import { TranscriptionWindow } from './TranscriptionWindow';
import { ReframeWindow } from './ReframeWindow';
import { SensitivitySelector } from './SensitivitySelector';
import { detectCDs } from '../nlp/cd-detector';
import { getReframe } from '../nlp/reframe-engine';
import { startDeepgramStream } from '../audio/deepgram-client';
import { playBeep } from '../audio/beep-handler';
import {
  Container, Typography, TextField, Button, Grid, Card, CardContent,
  CircularProgress, Box, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

// API Key Checks (no change)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!GEMINI_API_KEY) console.warn("GEMINI_API_KEY not set. Reframing suggestions disabled.");
if (!DEEPGRAM_API_KEY) console.warn("DEEPGRAM_API_KEY not set. Speech-to-text disabled.");

function App() {
  const [inputText, setInputText] = useState('');
  const [detectedCDs, setDetectedCDs] = useState([]);
  const [reframingSuggestion, setReframingSuggestion] = useState('');
  const [sensitivity, setSensitivity] = useState('medium');
  const [loadingCDs, setLoadingCDs] = useState(false);
  const [loadingReframe, setLoadingReframe] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stopStreamFn, setStopStreamFn] = useState(null);
  const [openDisclaimer, setOpenDisclaimer] = useState(true);

  useEffect(() => {
    const detect = async () => {
      if (inputText.trim() === '') {
        setDetectedCDs([]);
        setReframingSuggestion('');
        return;
      }
      setLoadingCDs(true);
      const cds = await detectCDs(inputText, sensitivity);

      // Play beep if new distortions are detected or if the list changes
      if (cds.length > 0 && JSON.stringify(cds) !== JSON.stringify(detectedCDs)) {
        playBeep();
      }

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

      <Dialog
        open={openDisclaimer}
        onClose={() => setOpenDisclaimer(false)}
        aria-labelledby="disclaimer-dialog-title"
        aria-describedby="disclaimer-dialog-description"
      >
        <DialogTitle id="disclaimer-dialog-title">
          {"Legal Disclaimer"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="disclaimer-dialog-description">
            This application is an AI-powered tool designed for self-reflection and journaling.
            <strong> It is NOT a substitute for professional mental health advice, diagnosis, or treatment.</strong>
            <br /><br />
            If you are in crisis, experiencing a medical emergency, or have thoughts of self-harm, please contact a professional doctor, therapist, or emergency services immediately.
            <br /><br />
            By using this application, you acknowledge that you understand this disclaimer and that the creators of this software accept no liability for any actions taken based on its output.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDisclaimer(false)} variant="contained" autoFocus>
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
