// src/audio/deepgram-client.js
// Manages the connection to the Deepgram API for real-time streaming STT.

export async function startDeepgramStream(apiKey, onTranscription) {
  let mediaRecorder;
  let socket;

  try {
    // 1. Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 2. Open WebSocket connection to Deepgram
    // We use 'nova-2' for speed/accuracy and 'smart_format' for punctuation
    const deepgramUrl = 'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true';
    socket = new WebSocket(deepgramUrl, ['token', apiKey]);

    // 3. Handle WebSocket Events
    socket.onopen = () => {
      console.log('Deepgram WebSocket connected.');
      
      // Initialize MediaRecorder to capture audio
      // 'audio/webm' is widely supported in Chrome/Firefox
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      // Send audio chunks to Deepgram as they become available
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0 && socket.readyState === 1) {
          socket.send(event.data);
        }
      });

      // Start recording, slicing audio into 250ms chunks for low latency
      mediaRecorder.start(250);
    };

    socket.onmessage = (message) => {
      const received = JSON.parse(message.data);
      
      // Check if we have a valid transcript in the response
      const transcript = received.channel?.alternatives?.[0]?.transcript;
      
      if (transcript && received.is_final) {
        // Only send 'final' results to the UI to avoid flickering text
        // (You can remove '&& received.is_final' if you want instant interim results)
        onTranscription(transcript);
      }
    };

    socket.onerror = (error) => {
      console.error('Deepgram WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('Deepgram WebSocket closed.');
    };

  } catch (error) {
    console.error('Error starting audio stream:', error);
  }

  // 4. Return a cleanup function to stop recording and close socket
  return function stopStream() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (socket && socket.readyState === 1) {
      socket.close();
    }
    // Stop all audio tracks to release the microphone
    if (mediaRecorder && mediaRecorder.stream) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };
}
