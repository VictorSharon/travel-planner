import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ClerkProvider, RedirectToSignIn, Show } from "@clerk/react";
import Header from "./components/Header";
import ChatWidget from "./components/ChatWidget";
import FormPage from "./pages/FormPage";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import { SignInPage, SignUpPage } from "./pages/AuthPages";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to frontend/.env");
}

// ClerkProvider lives inside the Router so Clerk can navigate with react-router
const ClerkWithRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
};

// Sends signed-out users to the sign-in page, then back here afterwards
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Show when="signed-in">{children}</Show>
    <Show when="signed-out">
      <RedirectToSignIn />
    </Show>
  </>
);

const App: React.FC = () => {
  return (
    <Router>
      <ClerkWithRouter>
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
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
              <Route path="/plan-trip" element={<RequireAuth><FormPage /></RequireAuth>} />
              <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
            </Routes>
          </div>

          <ChatWidget />
        </div>
      </ClerkWithRouter>
    </Router>
  );
};

export default App;
