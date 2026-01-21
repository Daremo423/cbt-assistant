// src/audio/beep-handler.js

let audioCtx = null;

export function playBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(e => console.error("Audio resume failed", e));
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // 440Hz (A4)

    // Fade out to avoid clicking
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);

    // Cleanup nodes after they are done (garbage collection handles this usually,
    // but explicit disconnect is good practice)
    oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
    };

  } catch (error) {
    console.error("Error playing beep:", error);
  }
}
