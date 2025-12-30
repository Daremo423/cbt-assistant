# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **UI Migration:** Migrated the entire user interface to Material UI (MUI) for a modern, responsive design.
- **Model-Based Detection:** Replaced regex-based cognitive distortion detection with a machine learning model using TensorFlow.js and the Universal Sentence Encoder for improved semantic understanding.
- **Deepgram Integration:** Implemented real-time speech-to-text using the Deepgram API via WebSocket.
- **Gemini API Integration:** Added `reframe-engine.js` to utilize Google's Gemini Pro model for generating contextual reframing suggestions.
- **Unit Tests:** Added comprehensive unit tests for `cd-detector.js` (mocking TensorFlow.js) and `SensitivitySelector.jsx`.
- **Documentation:** Added `docs/API.md`, `CONTRIBUTING.md`, and this `CHANGELOG.md`.

### Changed
- **Project Structure:** reorganized `src/` to include clear separation of concerns (`nlp/`, `audio/`, `ui/`).
- **Refactoring:** Updated `cd-detector.js` to use embedding similarity instead of simple pattern matching.
- **Refactoring:** Updated `App.jsx` to manage state for recording, detection, and reframing more efficiently.

### Removed
- **Legacy Regex:** Removed the old regex-based patterns from `cd-detector.js`.
