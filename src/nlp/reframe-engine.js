// src/nlp/reframe-engine.js
import apiClient from '../services/api';

async function getReframe(distortionType, originalText) {
  try {
    const response = await apiClient.post('/reframe', {
      distortionType,
      originalText
    });
    return response.data.suggestion;
  } catch (error) {
    console.error("Error generating reframing suggestion with Gemini API:", error);
    if (error.response && error.response.data && error.response.data.suggestion) {
      return error.response.data.suggestion;
    }
    return 'Could not generate reframing suggestion at this time. Please try again later.';
  }
}

export { getReframe };