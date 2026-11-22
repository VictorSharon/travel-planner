import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../lib/api";
import { TripSummary, daysBetween, formatDate } from "../lib/trips";

const TripCard: React.FC<{ trip: TripSummary }> = ({ trip }) => (
  <Link
    to={`/trips/${trip.id}`}
    className="block bg-white rounded-md shadow-md shadow-slate-900/10 p-5 hover:shadow-lg transition-shadow duration-150"
  >
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-yellow-700">{trip.destination}</p>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
          trip.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
        }`}
      >
        {trip.status === "approved" ? "✓ Approved" : "Draft"}
      </span>
    </div>
    <h3 className="text-lg font-bold text-slate-900 mt-1">{trip.title}</h3>
    <p className="text-sm text-slate-500 mt-1">
      {formatDate(trip.startDate)} – {formatDate(trip.endDate, { month: "short", day: "numeric", year: "numeric" })} ·{" "}
      {daysBetween(trip.startDate, trip.endDate)} days
    </p>
  </Link>
);

const TripSection: React.FC<{ title: string; subtitle: string; trips: TripSummary[] }> = ({ title, subtitle, trips }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold text-slate-900">
      {title} <span className="text-slate-400 font-medium">({trips.length})</span>
    </h2>
    <p className="text-sm text-slate-500 mb-4">{subtitle}</p>
    {trips.length === 0 ? (
      <p className="text-sm text-slate-400">None yet.</p>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    )}
  </section>
);

const TripsPage: React.FC = () => {
  const api = useApi();
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<TripSummary[]>("/api/trips")
      .then((res) => !cancelled && setTrips(res.data))
      .catch((err) => {
        console.error("Failed to load trips:", err);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div className="px-4 md:px-12 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My trips</h1>
        <Link
          to="/trips/new"
          className="bg-indigo-800 text-white text-sm font-semibold px-5 py-2.5 rounded-md shadow-md shadow-indigo-600/30 hover:shadow-lg transition-all duration-150"
        >
          + New trip
        </Link>
      </div>

      {error && <p className="text-slate-600">We couldn't load your trips. Please refresh to try again.</p>}
      {!error && trips === null && <p className="text-slate-600">Loading your trips…</p>}
      {trips?.length === 0 && (
        <div className="text-center py-16 bg-white rounded-md shadow-md shadow-slate-900/10">
          <p className="text-slate-600 mb-4">You haven't planned any trips yet.</p>
          <Link to="/trips/new" className="font-semibold text-indigo-800 hover:underline">
            Plan your first trip →
          </Link>
        </div>
      )}

      {trips && trips.length > 0 && (
        <>
          <TripSection
            title="Approved trips"
            subtitle="Locked in and ready to go."
            trips={trips.filter((t) => t.status === "approved")}
          />
          <TripSection
            title="Draft trips"
            subtitle="Still planning. Open one to edit it with AI or approve it."
            trips={trips.filter((t) => t.status === "draft")}
          />
        </>
      )}
    </div>
  );
};

export default TripsPage;
