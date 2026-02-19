// src/nlp/reframe-engine.js
import apiClient from '../services/api';

/**
 * Sends a request to the backend to generate a reframing suggestion.
 *
 * @param {string} distortionType - The type of cognitive distortion detected.
 * @param {string} originalText - The original thought text.
 * @returns {Promise<string>} - The reframing suggestion.
 */
async function getReframe(distortionType, originalText) {
  try {
    const response = await apiClient.post('/reframe', {
      distortionType,
      originalText
    });

    // Assuming the backend returns { suggestion: "..." }
    return response.data.suggestion;
  } catch (error) {
    console.error("Error generating reframing suggestion:", error);
    // Return a fallback message or null
    return 'Could not generate reframing suggestion at this time. Please try again later.';
  }
}

export { getReframe };
