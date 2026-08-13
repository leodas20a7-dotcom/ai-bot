import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingView from './components/LandingView';
import FormView from './components/FormView';
import ChatbotWidget from './components/ChatbotWidget';
import AdminView from './components/AdminView';
import { DialogProvider } from './components/Dialog';

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
    <DialogProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-sans">
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<FormView />} />
              <Route path="/enquire" element={<FormView />} />
              <Route path="/form" element={<FormView />} />
              <Route path="/landing" element={<LandingView />} />
              <Route path="/home" element={<LandingView />} />
              <Route path="/ai-chat" element={<LandingView />} />
            </Route>
            <Route path="/admin" element={<AdminView />} />
          </Routes>
        </div>
      </Router>
    </DialogProvider>
  );
}

export default App;
