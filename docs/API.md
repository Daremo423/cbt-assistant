# API Documentation

This document outlines the key internal modules and external API integrations used in the CBT Assistant.

## Environment Variables

The application requires the following environment variables to be set:

*   `GEMINI_API_KEY`: API key for Google's Gemini generative AI service. Used for generating reframing suggestions.
*   `DEEPGRAM_API_KEY`: API key for Deepgram. Used for real-time speech-to-text transcription.

## Internal Modules

### Cognitive Distortion Detection (`src/nlp/cd-detector.js`)

Uses TensorFlow.js and the Universal Sentence Encoder to detect cognitive distortions in text.

#### `detectCDs(text, sensitivity)`

*   **Description:** Analyzes the provided text for cognitive distortions.
*   **Parameters:**
    *   `text` (string): The user's input text.
    *   `sensitivity` (string, optional): Detection sensitivity level. Options: `'low'`, `'medium'` (default), `'high'`.
*   **Returns:** `Promise<string[]>` - A promise that resolves to an array of detected cognitive distortion types (e.g., `['All-or-Nothing', 'Catastrophizing']`).

### Reframe Engine (`src/nlp/reframe-engine.js`)

Interacts with the Google Gemini API to generate reframing suggestions.

#### `getReframe(distortionType, originalText)`

*   **Description:** Generates a reframing suggestion for a specific distortion type and the original thought.
*   **Parameters:**
    *   `distortionType` (string): The type of cognitive distortion detected (e.g., `'All-or-Nothing'`).
    *   `originalText` (string): The user's original thought text.
*   **Returns:** `Promise<string>` - A promise that resolves to the generated reframing suggestion.

### Audio Transcription (`src/audio/deepgram-client.js`)

Manages the real-time audio stream to Deepgram.

#### `startDeepgramStream(apiKey, onTranscription)`

*   **Description:** Starts recording audio from the microphone and streams it to Deepgram for transcription.
*   **Parameters:**
    *   `apiKey` (string): The Deepgram API key.
    *   `onTranscription` (function): A callback function that is called with the transcribed text `(transcript) => void`.
*   **Returns:** `Promise<function>` - A promise that resolves to a cleanup function. Calling the returned function stops the recording and closes the connection.

## External APIs

### Google Gemini API

*   **Model:** `gemini-pro`
*   **Purpose:** Generating context-aware cognitive reframing suggestions.

### Deepgram API

*   **Endpoint:** `wss://api.deepgram.com/v1/listen`
*   **Model:** `nova-2`
*   **Features:** `smart_format=true`, `interim_results=true`
*   **Purpose:** Real-time speech-to-text transcription.
