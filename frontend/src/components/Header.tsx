import React from "react";
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handlePlanTripClick = () => {
    navigate("/plan-trip");
  };

  return (
    <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
      <h1 className="text-xl font-bold">TravelMind</h1>
      <button
        onClick={handlePlanTripClick}
        className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-200"
      >
        Plan A Trip
      </button>
    </header>
  );
};

export default Header;