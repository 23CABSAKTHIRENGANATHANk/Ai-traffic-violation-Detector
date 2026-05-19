import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import Challans from './pages/Challans';
import Landing from './pages/Landing';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - No Authentication Required */}
        <Route path="/" element={<Landing />} />
        
        <Route 
          path="/dashboard" 
          element={<Layout><Dashboard /></Layout>}
        />
        
        <Route 
          path="/live" 
          element={<Layout><Upload /></Layout>}
        />
        
        <Route 
          path="/admin" 
          element={<Layout><Admin /></Layout>}
        />
        
        <Route 
          path="/analytics" 
          element={<Layout><Analytics /></Layout>}
        />
        
        <Route 
          path="/challans" 
          element={<Layout><Challans /></Layout>}
        />
        
        <Route 
          path="/settings" 
          element={<Layout><Settings /></Layout>}
        />

        {/* Catch-all: redirect to home */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
