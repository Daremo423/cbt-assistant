# CBT Assistant

## Description
An AI-powered Cognitive Behavioral Therapy (CBT) assistant that transcribes spoken thoughts using Deepgram and utilizes Google's Gemini Pro model to detect cognitive distortions and provide helpful reframing suggestions.

## Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Daremo423/cbt-assistant.git
    cd cbt-assistant
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configuration:**
    Create a `.env` file in the root directory and add your API keys:
    ```env
    REACT_APP_GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_KEY
    REACT_APP_DEEPGRAM_API_KEY=YOUR_DEEPGRAM_API_KEY
    ```

## Usage
1.  **Run the application:**
    *   To start the Frontend: `npm start`
    *   To start the Backend Server: `node server/index.js`
2.  **Access:**
    Open your browser and navigate to `http://localhost:3000`.
3.  **Examples:**
    *   Click **"Start Recording"** and say: *"I always mess everything up, I'm such a failure."*
    *   The app will detect **"All-or-Nothing Thinking"** and **"Labeling"**.
    *   The AI will provide a reframe like: *"Everyone makes mistakes sometimes; one instance doesn't define your entire worth."*

## Contribution
1.  Fork the repository.
2.  Create a feature branch: `git checkout -b feature/new-feature`.
3.  Commit your changes: `git commit -m 'feat: Add new feature'`.
4.  Push to the branch: `git push origin feature/new-feature`.
5.  Open a Pull Request.

## License
This project is licensed under the MIT License.
