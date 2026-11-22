import React from "react";
import { DayPlan, formatDate } from "../lib/trips";

// Header colors cycle across days so the board is easy to scan
const accents = ["bg-indigo-800", "bg-yellow-700", "bg-teal-700", "bg-rose-700", "bg-sky-700", "bg-emerald-700"];

export const accentFor = (dayNumber: number) => accents[(dayNumber - 1) % accents.length];

const SectionHeading: React.FC<{ emoji: string; children: React.ReactNode }> = ({ emoji, children }) => (
  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
    <span className="mr-1.5">{emoji}</span>
    {children}
  </h4>
);

interface DayTileProps {
  day: DayPlan;
  active: boolean; // its AI chat is open
  onEdit?: () => void; // omitted when the trip is locked (approved)
}

const DayTile: React.FC<DayTileProps> = ({ day, active, onEdit }) => {
  const accent = accentFor(day.day);

  return (
    <article
      className={`group bg-white rounded-md overflow-hidden flex flex-col transition-all duration-150 ${
        active ? "shadow-lg shadow-indigo-900/20 ring-2 ring-indigo-800" : "shadow-md shadow-slate-900/10 hover:shadow-lg"
      }`}
    >
      <div className={`${accent} text-white px-5 py-4`}>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/80">
          <span>Day {day.day}</span>
          {day.date && <span>{formatDate(day.date, { weekday: "short", month: "short", day: "numeric" })}</span>}
        </div>
        <h3 className="mt-1 text-lg font-bold leading-snug">{day.title}</h3>
      </div>

      <div className="p-5 space-y-5 flex-1">
        <section>
          <SectionHeading emoji="🏨">Stay</SectionHeading>
          <p className="text-sm font-semibold text-slate-900">{day.stay.name || "Not set"}</p>
          {day.stay.area && <p className="text-xs text-slate-500">{day.stay.area}</p>}
          {day.stay.notes && <p className="text-xs text-slate-500 mt-1">{day.stay.notes}</p>}
        </section>

        <section>
          <SectionHeading emoji="🗺️">Plan</SectionHeading>
          {day.activities.length === 0 ? (
            <p className="text-sm text-slate-400">Free day</p>
          ) : (
            <ol className="relative border-l-2 border-slate-200 ml-1 space-y-3">
              {day.activities.map((activity, i) => (
                <li key={i} className="pl-4 relative">
                  <span className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ${accent}`} />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{activity.time}</p>
                  <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                  {activity.details && <p className="text-xs text-slate-500">{activity.details}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <SectionHeading emoji="🍜">Food & snacks</SectionHeading>
          <ul className="space-y-2">
            {day.food.map((stop, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="shrink-0 mt-0.5 text-[10px] font-semibold uppercase tracking-wide bg-yellow-50 text-yellow-800 border border-yellow-200 rounded px-1.5 py-0.5">
                  {stop.meal}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{stop.name}</p>
                  {stop.details && <p className="text-xs text-slate-500">{stop.details}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {onEdit && (
        <div className="px-5 pb-4">
          <button
            onClick={onEdit}
            className={`text-sm font-semibold text-indigo-800 hover:underline transition-opacity ${
              active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
            }`}
          >
            ✨ {active ? "Editing with AI…" : "Edit with AI"}
          </button>
        </div>
      )}
    </article>
  );
};

export default DayTile;
