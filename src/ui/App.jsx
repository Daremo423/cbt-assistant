import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
          </Box>
      );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Fallback route - redirect to dashboard (which handles auth) or login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
