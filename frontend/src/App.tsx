import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import ChatWidget from "./components/ChatWidget";
import FormPage from "./pages/FormPage";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";

const App: React.FC = () => {
  return (
    <Router>
      <div className="relative min-h-screen overflow-hidden bg-white">
        {/* Washed-out logo background for the whole page */}
        <img
          src="/easeTravelLogo.png"
          alt=""
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] opacity-5 pointer-events-none"
        />

        {/* Actual page content, layered on top */}
        <div className="relative z-10">
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/plan-trip" element={<FormPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </div>

        <ChatWidget />
      </div>
    </Router>
  );
};

export default App;