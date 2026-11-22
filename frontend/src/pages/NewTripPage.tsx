import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useApi } from "../lib/api";
import { MAX_TRIP_DAYS, Trip, daysBetween } from "../lib/trips";

const paceOptions = ["Adventurous", "Laid back", "A mix of both"];

const inputClass =
  "w-full border border-slate-300 p-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-800 focus:border-indigo-800 transition-all";

const NewTripPage: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [searchParams] = useSearchParams();

  const [destination, setDestination] = useState(searchParams.get("destination") ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [origin, setOrigin] = useState("");
  const [travelers, setTravelers] = useState(1);
  const [pace, setPace] = useState("");
  const [useProfile, setUseProfile] = useState(true);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill "traveling from" with the home location in their Travel Profile
  useEffect(() => {
    let cancelled = false;
    api
      .get<{ homeLocation?: string } | null>("/api/travel-profile")
      .then((res) => {
        const home = res.data?.homeLocation;
        if (!cancelled && home) setOrigin((current) => current || home);
      })
      .catch((err) => console.error("Failed to load travel profile:", err));
    return () => {
      cancelled = true;
    };
  }, [api]);

  const numDays = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const dateError =
    startDate && endDate && numDays < 1
      ? "End date must be on or after the start date."
      : numDays > MAX_TRIP_DAYS
        ? `Trips can be at most ${MAX_TRIP_DAYS} days for now.`
        : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post<Trip>("/api/trips", {
        destination: destination.trim(),
        origin: origin.trim(),
        startDate,
        endDate,
        travelers,
        pace,
        useProfile,
        notes: notes.trim(),
      });
      navigate(`/trips/${res.data.id}`);
    } catch (err) {
      console.error("Failed to create trip:", err);
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detail === "string" ? detail : "Couldn't create your planner board. Please try again.");
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-800 animate-spin mb-6" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Building your planner board for {destination}…</h2>
        <p className="text-sm text-slate-500">Picking places to stay, things to do and where to eat. This usually takes 15–30 seconds.</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-md shadow-md shadow-slate-900/10 p-6 md:p-8 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Plan a new trip</h2>
          <p className="text-sm text-slate-500 mt-1">We'll build a day-by-day planner board you can edit.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Where to?</label>
          <input
            type="text"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Lisbon, Portugal"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Traveling from</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            maxLength={200}
            placeholder="e.g. Chicago, IL"
            className={inputClass}
          />
          <p className="text-xs text-slate-500 mt-1">
            We'll plan flights or transport from here. Set a default in your Travel Profile.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End date</label>
            <input
              type="date"
              required
              min={startDate || undefined}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        {dateError ? (
          <p className="text-xs text-red-600 -mt-3">{dateError}</p>
        ) : numDays > 0 ? (
          <p className="text-xs text-slate-500 -mt-3">{numDays} day{numDays === 1 ? "" : "s"}</p>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">How many people?</label>
          <input
            type="number"
            min={1}
            max={20}
            required
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Adventurous or laid back?</label>
          <div className="flex flex-wrap gap-2">
            {paceOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPace(pace === opt ? "" : opt)}
                className={`px-3.5 py-2 rounded-md text-sm font-medium border transition-all duration-150 ${
                  pace === opt
                    ? "bg-indigo-800 text-white border-indigo-800"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Anything else? (optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            placeholder="e.g. We love seafood and want one beach day"
            className={inputClass}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={useProfile}
            onChange={(e) => setUseProfile(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-indigo-800"
          />
          <span>
            Use my Travel Profile
            <span className="block text-xs text-slate-500">Tailor stays, activities and food to your saved preferences.</span>
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!!dateError}
          className="w-full bg-indigo-800 text-white font-semibold px-6 py-3 rounded-md shadow-md shadow-indigo-800/30 hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Planner Board
        </button>
      </form>
    </div>
  );
};

export default NewTripPage;
