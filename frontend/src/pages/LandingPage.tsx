import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const recommendations = [
  {
    name: "Bali",
    description: "From luxury hotels to cozy homes, find the perfect place to stay wherever you go.",
    image: "https://picsum.photos/seed/bali/600/500",
  },
  {
    name: "Costa Rica",
    description: "Discover curated experiences and hidden gems that turn your trip into more than just a stay.",
    image: "https://picsum.photos/seed/costarica/600/500",
  },
  {
    name: "Morocco",
    description: "Book airport transfers, car rentals and local transport all in one place.",
    image: "https://picsum.photos/seed/morocco/600/500",
  },
];

const LandingPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", search);
  };

  return (
    <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
      {/* Hero */}
      <div id="browse" className="flex flex-col items-center justify-center scroll-mt-24">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
            Plan your next trip with ease.
          </h1>

        </div>
      </div>

      {/* Centered search bar */}
      <form onSubmit={handleSearch} className="flex justify-center mt-10 mb-16">
        <div className="flex items-center gap-2 w-full max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations, stays, or experiences"
            className="flex-1 border border-slate-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <button
            onClick={() => navigate("/chat", { state: { destination: search } })}
            className="bg-indigo-800 text-white font-medium px-5 py-3 rounded-md shadow-md shadow-indigo-600/30 hover:bg-indigo-800 hover:shadow-lg transition-all duration-150"
          >
            Build Itinerary
          </button>
        </div>
      </form>

      {/* Recommendations */}
      <div id="recommendations" className="mt-16 scroll-mt-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Recommendations</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div
              key={rec.name}
              className="relative rounded-md overflow-hidden shadow-md shadow-slate-900/10 h-80"
            >
              <img
                src={rec.image}
                alt={rec.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h3 className="text-lg font-bold mb-1">{rec.name}</h3>
                <p className="text-sm text-white/80 mb-3">{rec.description}</p>
                <button
                  onClick={() => navigate("/plan-trip")}
                  className="flex items-center gap-1 text-sm font-semibold hover:underline"
                >
                  Build Itinerary
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;