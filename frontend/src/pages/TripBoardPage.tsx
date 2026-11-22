import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import BookingsSection from "../components/BookingsSection";
import DayChatPanel, { DayChatState, emptyChatState } from "../components/DayChatPanel";
import DayTile from "../components/DayTile";
import { useApi } from "../lib/api";
import { DayPlan, Trip, TripStatus, formatDate } from "../lib/trips";

const TripBoardPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const api = useApi();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "notFound" | "error">("loading");
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [chats, setChats] = useState<Record<number, DayChatState>>({});
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [refreshingBookings, setRefreshingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    api
      .get<Trip>(`/api/trips/${tripId}`)
      .then((res) => {
        if (cancelled) return;
        setTrip(res.data);
        setLoadState("ready");
      })
      .catch((err) => {
        console.error("Failed to load trip:", err);
        if (!cancelled) setLoadState(axios.isAxiosError(err) && err.response?.status === 404 ? "notFound" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [api, tripId]);

  const replaceDay = (updated: DayPlan) =>
    setTrip((t) => (t ? { ...t, days: t.days.map((d) => (d.day === updated.day ? updated : d)) } : t));

  const setStatus = async (status: TripStatus) => {
    setStatusSaving(true);
    setStatusError(null);
    try {
      const res = await api.put<Trip>(`/api/trips/${tripId}/status`, { status });
      setTrip(res.data);
      if (status === "approved") setActiveDay(null);
    } catch (err) {
      console.error("Failed to update trip status:", err);
      setStatusError("Couldn't update the trip. Please try again.");
    } finally {
      setStatusSaving(false);
    }
  };

  const refreshBookings = async () => {
    setRefreshingBookings(true);
    setBookingsError(null);
    try {
      const res = await api.post<Trip>(`/api/trips/${tripId}/bookings/refresh`);
      setTrip(res.data);
    } catch (err) {
      console.error("Failed to refresh bookings:", err);
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setBookingsError(typeof detail === "string" ? detail : "Couldn't update bookings. Please try again.");
    } finally {
      setRefreshingBookings(false);
    }
  };

  if (loadState !== "ready" || !trip) {
    return (
      <div className="flex justify-center px-4 py-24 text-center text-slate-600">
        {loadState === "loading" && <p>Loading your planner board…</p>}
        {loadState === "notFound" && (
          <p>
            We couldn't find that trip.{" "}
            <Link to="/trips" className="font-semibold text-indigo-800 hover:underline">
              See your trips
            </Link>
          </p>
        )}
        {loadState === "error" && <p>Something went wrong loading this trip. Please refresh to try again.</p>}
      </div>
    );
  }

  const approved = trip.status === "approved";
  const openDay = trip.days.find((d) => d.day === activeDay);

  return (
    <div className={`px-4 md:px-12 py-10 max-w-7xl mx-auto transition-[padding] ${openDay ? "sm:pr-[452px]" : ""}`}>
      <div className="mb-8">
        <Link to="/trips" className="text-sm text-slate-500 hover:text-slate-700">
          ← My trips
        </Link>
        <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-yellow-700">Planner board · {trip.destination}</p>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                  approved ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {approved ? "✓ Approved" : "Draft"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-1">{trip.title}</h1>
            <p className="text-sm text-slate-500 mt-2">
              {formatDate(trip.startDate)} – {formatDate(trip.endDate, { month: "short", day: "numeric", year: "numeric" })} ·{" "}
              {trip.days.length} day{trip.days.length === 1 ? "" : "s"} · {trip.travelers} traveler{trip.travelers === 1 ? "" : "s"}
              {trip.origin && ` · from ${trip.origin}`}
            </p>
            {trip.summary && <p className="text-slate-700 mt-3 max-w-3xl">{trip.summary}</p>}
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-1">
            {approved ? (
              <button
                onClick={() => setStatus("draft")}
                disabled={statusSaving}
                className="bg-white text-slate-700 font-semibold px-5 py-2.5 rounded-md border border-slate-300 hover:border-slate-400 transition-all duration-150 disabled:opacity-60"
              >
                {statusSaving ? "Updating…" : "Move back to draft"}
              </button>
            ) : (
              <button
                onClick={() => setStatus("approved")}
                disabled={statusSaving}
                className="bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-md shadow-md shadow-emerald-700/30 hover:shadow-lg transition-all duration-150 disabled:opacity-60"
              >
                {statusSaving ? "Approving…" : "✓ Approve trip"}
              </button>
            )}
            {statusError && <p className="text-xs text-red-600">{statusError}</p>}
          </div>
        </div>

        {approved && (
          <p className="mt-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-2.5">
            This trip is approved and locked. Move it back to draft to make changes.
          </p>
        )}
      </div>

      <div className={`grid gap-6 sm:grid-cols-2 items-start ${openDay ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
        {trip.days.map((day) => (
          <DayTile
            key={day.day}
            day={day}
            active={day.day === activeDay}
            onEdit={approved ? undefined : () => setActiveDay(day.day)}
          />
        ))}
      </div>

      <BookingsSection
        days={trip.days}
        onRefresh={approved ? undefined : refreshBookings}
        refreshing={refreshingBookings}
        refreshError={bookingsError}
      />

      {openDay && !approved && (
        <DayChatPanel
          key={openDay.day}
          tripId={trip.id}
          day={openDay}
          chat={chats[openDay.day] ?? emptyChatState}
          onChatChange={(chat) => setChats((c) => ({ ...c, [openDay.day]: chat }))}
          onDayUpdated={replaceDay}
          onClose={() => setActiveDay(null)}
        />
      )}
    </div>
  );
};

export default TripBoardPage;
