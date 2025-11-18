// src/utils/pause-detector.js
// Waits for speech inactivity of >0.6s as a pause (MVP, tune as needed)
export function isPause(lastHeardAt, now, threshold=600) {
  return (now - lastHeardAt) > threshold;
}