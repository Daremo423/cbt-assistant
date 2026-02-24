import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add an interceptor to include JWT token if available
// For now, it's not implemented as token management will be in AuthContext
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token'); // Or get from context
//     if (token) {
//       config.headers['x-access-token'] = token;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

export default apiClient;
