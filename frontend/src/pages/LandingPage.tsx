import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { useApi } from "../lib/api";

interface Destination {
  name: string;
  country: string;
  reason: string;
  bestTimeToVisit: string;
}

interface Recommendations {
  personalized: boolean;
  destinations: Destination[];
}

// Destination goes in the URL so it survives the sign-in redirect
const newTripUrl = (destination: string) =>
  destination.trim() ? `/trips/new?destination=${encodeURIComponent(destination.trim())}` : "/trips/new";

// Placeholder photo, stable per destination
const imageFor = (name: string) => `https://picsum.photos/seed/${encodeURIComponent(name)}/600/500`;

const LandingPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const api = useApi();
  const { isLoaded, isSignedIn } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [recStatus, setRecStatus] = useState<"loading" | "ready" | "error">("loading");

  // Signed-in users get picks based on their travel profile; everyone else gets popular destinations
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    setRecStatus("loading");
    api
      .get<Recommendations>(isSignedIn ? "/api/recommendations" : "/api/recommendations/popular")
      .then((res) => {
        if (cancelled) return;
        setRecommendations(res.data);
        setRecStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load recommendations:", err);
        if (!cancelled) setRecStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [api, isLoaded, isSignedIn]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(newTripUrl(search));
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
            type="submit"
            className="bg-indigo-800 text-white font-medium px-5 py-3 rounded-md shadow-md shadow-indigo-600/30 hover:bg-indigo-800 hover:shadow-lg transition-all duration-150"
          >
            Build Itinerary
          </button>
        </div>
      </form>

      {/* Recommendations */}
      <div id="recommendations" className="mt-16 scroll-mt-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          {recommendations?.personalized ? "Recommended for you" : "Popular destinations"}
        </h2>
        {recStatus === "ready" && !recommendations?.personalized && (
          <p className="text-sm text-slate-500 mb-6">
            {isSignedIn ? "Fill out your " : "Sign in and build your "}
            <button
              onClick={() => navigate("/plan-trip")}
              className="font-semibold text-indigo-800 hover:underline"
            >
              Travel Profile
            </button>{" "}
            to get picks tailored to you.
          </p>
        )}
        {recStatus === "ready" && recommendations?.personalized && (
          <p className="text-sm text-slate-500 mb-6">Based on your Travel Profile.</p>
        )}
        {recStatus === "loading" && <p className="text-sm text-slate-500 mb-6">Finding destinations for you…</p>}
        {recStatus === "error" && (
          <p className="text-sm text-slate-500 mb-6">We couldn't load recommendations right now. Please try again later.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recStatus === "loading" &&
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-md h-80 bg-slate-200 animate-pulse" />
            ))}
          {recStatus === "ready" && recommendations?.destinations.map((rec) => (
            <div
              key={`${rec.name}-${rec.country}`}
              className="relative rounded-md overflow-hidden shadow-md shadow-slate-900/10 h-80"
            >
              <img
                src={imageFor(rec.name)}
                alt={rec.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h3 className="text-lg font-bold">{rec.name}</h3>
                <p className="text-xs text-white/70 mb-1">
                  {rec.country} · Best time: {rec.bestTimeToVisit}
                </p>
                <p className="text-sm text-white/80 mb-3">{rec.reason}</p>
                <button
                  onClick={() => navigate(newTripUrl(`${rec.name}, ${rec.country}`))}
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