import React, { useState, useEffect, useRef } from 'react';
import { TranscriptionWindow } from './TranscriptionWindow';
import { ReframeWindow } from './ReframeWindow';
import { SensitivitySelector } from './SensitivitySelector';
import { detectCDs } from '../nlp/cd-detector';
import { getReframe } from '../nlp/reframe-engine';
import { startDeepgramStream } from '../audio/deepgram-client';
import { Container, Typography, TextField, Button, Grid, Card, CardContent, CircularProgress, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton, List, ListItem, ListItemText } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import FlagIcon from '@mui/icons-material/Flag';

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
  const [disclaimerOpen, setDisclaimerOpen] = useState(true);
  const audioCtxRef = useRef(null);

  // Audio Context for Beep
  const playBeep = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioCtx = audioCtxRef.current;

    // Resume context if suspended (browser policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1); // Beep for 0.1 seconds
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

      if (cds.length > 0) {
        playBeep();
      }
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

  const handleDisclaimerClose = () => {
    setDisclaimerOpen(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Dialog
        open={disclaimerOpen}
        onClose={handleDisclaimerClose}
        aria-labelledby="disclaimer-dialog-title"
        aria-describedby="disclaimer-dialog-description"
      >
        <DialogTitle id="disclaimer-dialog-title">
          {"Disclaimer"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="disclaimer-dialog-description">
            This application is for educational and informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            <br /><br />
            For privacy, please use headphones if you are in a public place.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisclaimerClose} autoFocus>
            Accept
          </Button>
        </DialogActions>
      </Dialog>

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
                            <List dense>
                              {detectedCDs.map((cd, i) => (
                                <ListItem
                                  key={i}
                                  secondaryAction={
                                    <IconButton edge="end" aria-label="flag" onClick={() => console.log(`Feedback: False Positive for ${cd}`)}>
                                      <FlagIcon />
                                    </IconButton>
                                  }
                                >
                                  <ListItemText primary={cd} />
                                </ListItem>
                              ))}
                            </List>
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

export default App;