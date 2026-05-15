import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import Challans from './pages/Challans';
import Landing from './pages/Landing';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page (No Layout) */}
        <Route path="/" element={<Landing />} />

        {/* App Pages (With Layout) */}
        <Route path="/live" element={<Layout><Upload /></Layout>} />
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
        <Route path="/challans" element={<Layout><Challans /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
