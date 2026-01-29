import React, { useState, useEffect, useRef } from 'react';
import { TranscriptionWindow } from './TranscriptionWindow';
import { ReframeWindow } from './ReframeWindow';
import { SensitivitySelector } from './SensitivitySelector';
import { DisclaimerDialog } from './DisclaimerDialog';
import { detectCDs } from '../nlp/cd-detector';
import { getReframe } from '../nlp/reframe-engine';
import { startDeepgramStream } from '../audio/deepgram-client';
import { Container, Typography, TextField, Button, Grid, Card, CardContent, CircularProgress, Box } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

// API Key Checks (no change)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!GEMINI_API_KEY) console.warn("GEMINI_API_KEY not set. Reframing suggestions disabled.");
if (!DEEPGRAM_API_KEY) console.warn("DEEPGRAM_API_KEY not set. Speech-to-text disabled.");

function App() {
  const [inputText, setInputText] = useState('');
  const [detectedCDs, setDetectedCDs] = useState([]); // List of all unique CDs found
  const [reframingSuggestion, setReframingSuggestion] = useState('');
  const [sensitivity, setSensitivity] = useState('medium');
  const [loadingCDs, setLoadingCDs] = useState(false);
  const [loadingReframe, setLoadingReframe] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stopStreamFn, setStopStreamFn] = useState(null);

  // Cache for detection results: Map<sentence, Array<distortion>>
  const detectionCache = useRef(new Map());

  useEffect(() => {
    // Clear cache if sensitivity changes, as results might differ
    detectionCache.current.clear();
  }, [sensitivity]);

  useEffect(() => {
    const detect = async () => {
      if (inputText.trim() === '') {
        setDetectedCDs([]);
        setReframingSuggestion('');
        return;
      }
      setLoadingCDs(true);

      // Split into sentences (simple regex)
      const sentences = inputText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
      const currentUniqueCDs = new Set();

      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;

        let cds;
        if (detectionCache.current.has(trimmed)) {
            cds = detectionCache.current.get(trimmed);
        } else {
            // Only run detection on new sentences or changed last sentence
            // Note: For very long text, we might want to avoid re-checking the last sentence if it hasn't changed,
            // but here we check everything not in cache.
            // Since cache is persistent, this works for appending text.
            cds = await detectCDs(trimmed, sensitivity);
            detectionCache.current.set(trimmed, cds);
        }

        cds.forEach(cd => currentUniqueCDs.add(cd));
      }

      setDetectedCDs(Array.from(currentUniqueCDs));
      setLoadingCDs(false);
    };

    const handler = setTimeout(() => detect(), 500); // Debounce detection
    return () => clearTimeout(handler);
  }, [inputText, sensitivity]);

  useEffect(() => {
    const reframe = async () => {
      // Reframe based on the latest detected distortion or the first one in the list
      // Ideally, we reframe the *latest* thought.
      if (detectedCDs.length > 0) {
        setLoadingReframe(true);
        // We pass the *full text* to reframe engine, but maybe we should pass the latest distorted sentence?
        // For MVP, passing full text with distortion type is okay, or we can improve context.
        // Let's stick to existing logic but maybe pick the last added CD?
        // For now, just pick the first one as before to minimize risk.
        const suggestion = await getReframe(detectedCDs[0], inputText);
        setReframingSuggestion(suggestion);
        setLoadingReframe(false);
      } else {
        setReframingSuggestion('');
      }
    };
    // Only reframe if detectedCDs changes significantly or text stops changing?
    // Debouncing reframe is handled by dependency on detectedCDs (which is updated debounced)
    if (detectedCDs.length > 0) {
        reframe();
    } else {
        setReframingSuggestion('');
    }
  }, [detectedCDs, inputText]); // dependent on inputText too for context

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
  
  // Calculate highlights based on sentence detection
  const calculateHighlights = () => {
      const words = inputText.split(' ');
      const highlights = [];
      let currentSentenceWords = [];

      words.forEach((word) => {
          currentSentenceWords.push(word);
          // Check if sentence ends
          if (/[.!?]$/.test(word)) {
              const sentenceText = currentSentenceWords.join(' ').trim();
              // Check cache (fuzzy match might be needed if split differs, but we try exact)
              // We reconstruct sentence from words, which should match how we constructed sentences for detection (mostly)
              // Note: regex split vs join(' ') might differ in spacing.
              // Let's look up by checking if any cached sentence *contains* this text or is equal.
              // A safer way: iterate cached sentences and check overlap? Too slow.
              // Simple way: check if cache has this constructed sentence.

              // Issue: `inputText.match` splits by delimiters. `currentSentenceWords.join(' ')` puts spaces.
              // If inputText had "Hello.World", `match` sees "Hello." and "World".
              // `split(' ')` sees "Hello.World".
              // This is the tricky part.
              // Simplification: Check if the *word* belongs to a distorted part.
              // Let's assume standard spacing "Hello. World."

              const cds = detectionCache.current.get(sentenceText) || [];
              const isDistorted = cds.length > 0;
              currentSentenceWords.forEach(() => highlights.push(isDistorted));
              currentSentenceWords = [];
          }
      });

      // Handle remaining words (incomplete sentence)
      if (currentSentenceWords.length > 0) {
          const sentenceText = currentSentenceWords.join(' ').trim();
           const cds = detectionCache.current.get(sentenceText) || [];
           const isDistorted = cds.length > 0;
           currentSentenceWords.forEach(() => highlights.push(isDistorted));
      }

      return highlights;
  };

  const highlightWords = calculateHighlights();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <DisclaimerDialog />
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
              {/* Note: TranscriptionWindow maps highlightWords by index. Length must match. */}
              {loadingCDs && highlightWords.length === 0 ? <CircularProgress /> : <TranscriptionWindow transcript={inputText} highlights={highlightWords} />}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
            <Card>
                <CardContent>
                    <Typography variant="h6">Detected Distortions</Typography>
                    {detectedCDs.length > 0 ? (
                        <ul>{detectedCDs.map((cd, i) => <li key={i}>{cd}</li>)}</ul>
                    ) : <p>None detected.</p>}
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
