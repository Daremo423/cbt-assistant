import axios from 'axios';

const API_URL = 'http://localhost:8080/api'; // Replace with your backend URL

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add an interceptor to include JWT token if available
// For now, it's not implemented as token management will be in AuthContext
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Or get from context
    if (token) {
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
