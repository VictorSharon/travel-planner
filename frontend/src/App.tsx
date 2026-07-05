import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import FormPage from "./pages/FormPage";

const App: React.FC = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/plan-trip" element={<FormPage />} />
        <Route path="/" element={<div>Welcome to TravelMind!</div>} />
      </Routes>
    </Router>
  );
};

export default App;