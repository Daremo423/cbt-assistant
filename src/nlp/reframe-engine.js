import apiClient from '../services/api';

async function getReframe(distortionType, originalText) {
  try {
    const response = await apiClient.post('/reframe', {
      distortionType,
      originalText
    });
    return response.data.suggestion;
  } catch (error) {
    console.error("Error generating reframing suggestion:", error);
    if (error.response && error.response.status === 401) {
        return 'Please log in to receive reframing suggestions.';
    }
    return 'Could not generate reframing suggestion at this time. Please try again later.';
  }
}

export { getReframe };
