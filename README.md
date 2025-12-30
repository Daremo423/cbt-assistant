# CBT Assistant

An AI-powered Cognitive Behavioral Therapy (CBT) assistant designed to help users identify and reframe cognitive distortions in their thoughts.

## Features

*   **Real-time Speech-to-Text:** Transcribes user's spoken thoughts using Deepgram.
*   **Cognitive Distortion Detection:** Utilizes a Universal Sentence Encoder model to detect common cognitive distortions (e.g., All-or-Nothing Thinking, Catastrophizing, Should Statements).
*   **AI-Powered Reframing:** Generates personalized reframing suggestions using the Google Gemini API to help users challenge unhelpful thinking patterns.
*   **Adjustable Sensitivity:** Control the detection sensitivity for cognitive distortions.

## Tech Stack

*   **Frontend:** React, Material UI
*   **Speech-to-Text:** Deepgram API
*   **Cognitive Distortion Detection:** TensorFlow.js, Universal Sentence Encoder
*   **Reframing Engine:** Google Gemini API

## Prerequisites

*   Node.js (v18 or higher recommended)
*   npm (or yarn) package manager
*   **API Keys:**
    *   `GEMINI_API_KEY`: For Google Gemini API access.
    *   `DEEPGRAM_API_KEY`: For Deepgram speech-to-text service.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd cbt-assistant
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set Environment Variables:**
    Create a `.env` file in the root directory and add your API keys:
    ```env
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    DEEPGRAM_API_KEY=YOUR_DEEPGRAM_API_KEY
    ```
    *Note: If you are running this locally and need to set environment variables, you might need to export them in your terminal or use a tool like `dotenv`.*

## Usage

1.  **Start the application:**
    ```bash
    npm start
    ```
    The application will typically run on `http://localhost:3000`.

2.  **Interact with the Assistant:**
    *   Enter your thoughts in the "Your Thoughts" text area or use the "Start Recording" button to transcribe your speech.
    *   The assistant will analyze your input for cognitive distortions.
    *   A reframing suggestion will be provided based on the detected distortion.
    *   Adjust the "Sensitivity" slider to fine-tune distortion detection.

## Testing

To run the unit tests:
```bash
npm test
```

## Contributing

Please see the `CONTRIBUTING.md` file for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License.