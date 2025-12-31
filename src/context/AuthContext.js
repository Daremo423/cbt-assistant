import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      if (response.data.accessToken) {
        const userData = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          roles: response.data.roles
        };
        const accessToken = response.data.accessToken;

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', accessToken);
        setUser(userData);
        setToken(accessToken);
        return { success: true };
      }
      return { success: false, message: "Login failed" };
    } catch (error) {
      console.error("Login error", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Login failed" 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      await authService.signup(username, email, password);
      return { success: true };
    } catch (error) {
      console.error("Registration error", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Registration failed" 
      };
    }
  }

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
