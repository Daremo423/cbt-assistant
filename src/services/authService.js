import apiClient from './api';

const signup = (username, email, password, roles) => {
  return apiClient.post('/auth/signup', {
    username,
    email,
    password,
    roles
  });
};

const login = (username, password) => {
  return apiClient.post('/auth/signin', {
    username,
    password
  });
};

const googleLogin = (token) => {
  return apiClient.post('/auth/google', {
    token
  });
};

export default {
  signup,
  login,
  googleLogin,
};
