import React from "react";
import { Booking, DayPlan, formatDate, groupStays } from "../lib/trips";

const typeIcons: Record<Booking["type"], string> = {
  flight: "✈️",
  train: "🚆",
  bus: "🚌",
  ferry: "⛴️",
  car_rental: "🚗",
  transfer: "🚐",
  tour: "🧭",
  activity: "🎟️",
  restaurant: "🍽️",
  event: "🎭",
  transport: "🚆",
  other: "📌",
};

const dayRange = (first: DayPlan, last: DayPlan) => {
  const days = first.day === last.day ? `Day ${first.day}` : `Days ${first.day}–${last.day}`;
  const dates =
    first.date && last.date
      ? first.date === last.date
        ? formatDate(first.date)
        : `${formatDate(first.date)} – ${formatDate(last.date)}`
      : "";
  return dates ? `${days} · ${dates}` : days;
};

const Badge: React.FC<{ required: boolean }> = ({ required }) => (
  <span
    className={`shrink-0 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
      required ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
    }`}
  >
    {required ? "Required" : "Recommended"}
  </span>
);

interface BookingsSectionProps {
  days: DayPlan[];
  onRefresh?: () => void; // omitted when the trip is locked (approved)
  refreshing: boolean;
  refreshError: string | null;
}

const BookingsSection: React.FC<BookingsSectionProps> = ({ days, onRefresh, refreshing, refreshError }) => {
  const stays = groupStays(days);
  const daysWithBookings = days.filter((d) => d.bookings.length > 0);
  const total = stays.length + daysWithBookings.reduce((n, d) => n + d.bookings.length, 0);
  const requiredCount = stays.length + daysWithBookings.reduce((n, d) => n + d.bookings.filter((b) => b.required).length, 0);

  return (
    <section className="mt-10 bg-white rounded-md shadow-md shadow-slate-900/10 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            <span className="mr-2">📋</span>Bookings needed
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Reserve these ahead of your trip. Booking through EaseTravel is coming soon.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1.5">
          <p className="text-sm font-semibold text-slate-700">
            {total} to book · {requiredCount} required
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="text-sm font-semibold text-indigo-800 hover:underline disabled:opacity-60 disabled:no-underline"
            >
              {refreshing ? "Checking what to book…" : "✨ Update bookings"}
            </button>
          )}
          {refreshError && <p className="text-xs text-red-600">{refreshError}</p>}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">🏨 Hotels</h3>
          {stays.length === 0 ? (
            <p className="text-sm text-slate-400">No stays planned.</p>
          ) : (
            <ul className="space-y-3">
              {stays.map(({ stay, firstDay, lastDay }) => (
                <li key={firstDay.day} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{stay.name}</p>
                    <p className="text-xs text-slate-500">
                      {stay.area && `${stay.area} · `}
                      {dayRange(firstDay, lastDay)}
                    </p>
                  </div>
                  <Badge required />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">✈️ Flights, tours & reservations</h3>
          {daysWithBookings.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing else to book in advance.</p>
          ) : (
            <div className="space-y-4">
              {daysWithBookings.map((day) => (
                <div key={day.day}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                    {dayRange(day, day)}
                  </p>
                  <ul className="space-y-2.5">
                    {day.bookings.map((booking, i) => (
                      <li key={i} className="flex items-start justify-between gap-3">
                        <div className="flex gap-2">
                          <span aria-hidden>{typeIcons[booking.type] ?? typeIcons.other}</span>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{booking.name}</p>
                            {(booking.details || booking.bookAhead) && (
                              <p className="text-xs text-slate-500">
                                {booking.details}
                                {booking.details && booking.bookAhead && " · "}
                                {booking.bookAhead && <span className="font-medium text-slate-600">Book {booking.bookAhead}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge required={booking.required} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BookingsSection;
