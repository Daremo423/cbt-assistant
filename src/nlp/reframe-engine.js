import apiClient from '../services/api';

async function getReframe(distortionType, originalText) {
  try {
    const response = await apiClient.post('/reframe', {
      distortion: distortionType,
      text: originalText
    });
    return response.data.suggestion;
  } catch (error) {
    console.error("Error generating reframing suggestion:", error);
    return 'Could not generate reframing suggestion at this time. Please try again later.';
  }
}

export { getReframe };
