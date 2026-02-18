// src/nlp/reframe-engine.js
import apiClient from '../services/api';

async function getReframe(distortionType, originalText) {
  try {
    const token = localStorage.getItem('token');
    const response = await apiClient.post('/reframe', {
      distortionType,
      originalText
    }, {
      headers: {
        'x-access-token': token
      }
    });
    return response.data.suggestion;
  } catch (error) {
    console.error("Error generating reframing suggestion:", error);
    return 'Could not generate reframing suggestion at this time. Please try again later.';
  }
}

export { getReframe };