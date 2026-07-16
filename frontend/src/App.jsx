import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingView from './components/LandingView';
import FormView from './components/FormView';
import ChatbotWidget from './components/ChatbotWidget';
import AdminView from './components/AdminView';

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <ChatbotWidget />
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingView />} />
            <Route path="/enquire" element={<FormView />} />
          </Route>
          <Route path="/admin" element={<AdminView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
