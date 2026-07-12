import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-12 py-4 bg-white border-b border-slate-200">
      {/* Clickable Logo */}
      <button onClick={() => navigate("/")} className="flex items-center gap-3 focus:outline-none">
        <img src="/easeTravelLogo.png" alt="EaseTravel" className="h-10 w-10 object-contain"/>
        <span className="text-xl font-bold text-slate-900">EaseTravel</span>
      </button>

      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
          <button onClick={() => scrollToSection("browse")} className="hover:text-slate-900 transition-colors">
            Browse
          </button>
          <button onClick={() => scrollToSection("recommendations")} className="hover:text-slate-900 transition-colors">
            Recommendations
          </button>
        </nav>

        <button
          onClick={() => navigate("/plan-trip")}
          className="bg-indigo-800 text-white text-sm font-semibold px-5 py-2.5 rounded-md shadow-md shadow-indigo-600/30 hover:bg-indigo-800 hover:shadow-lg transition-all duration-150"
        >
          Travel Profile
        </button>
      </div>
    </header>
  );
};

export default Header;