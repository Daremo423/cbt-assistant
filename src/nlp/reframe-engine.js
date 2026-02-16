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
    if (error.response) {
      return error.response.data.error || 'Could not generate reframing suggestion. Please try again.';
    } else if (error.request) {
      return 'No response from server. Please check your connection.';
    } else {
      return 'An error occurred while requesting reframe.';
    }
  }
}

export { getReframe };
