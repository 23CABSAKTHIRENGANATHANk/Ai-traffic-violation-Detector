import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import Challans from './pages/Challans';
import Landing from './pages/Landing';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { TokenManager } from './config/api';

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = TokenManager.hasToken();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes (Require Authentication) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/live" 
          element={
            <ProtectedRoute>
              <Layout><Upload /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Layout><Admin /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Layout><Analytics /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/challans" 
          element={
            <ProtectedRoute>
              <Layout><Challans /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all: redirect to dashboard if authenticated, else to login */}
        <Route 
          path="*" 
          element={
            <Navigate to={TokenManager.hasToken() ? "/dashboard" : "/"} replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
