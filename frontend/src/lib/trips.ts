export interface Stay {
  name: string;
  area: string;
  notes: string;
}

export interface Activity {
  time: string;
  title: string;
  details: string;
}

export interface FoodStop {
  meal: string;
  name: string;
  details: string;
}

// Something to reserve ahead. Hotels come from each day's stay instead.
export interface Booking {
  type:
    | "flight"
    | "train"
    | "bus"
    | "ferry"
    | "car_rental"
    | "transfer"
    | "tour"
    | "activity"
    | "restaurant"
    | "event"
    | "transport" // older trips, before the specific transport types
    | "other";
  name: string;
  details: string;
  required: boolean; // false = recommended
  bookAhead: string;
}

// The editable part of a day tile
export interface DayContent {
  title: string;
  stay: Stay;
  activities: Activity[];
  food: FoodStop[];
  bookings: Booking[];
}

export interface DayPlan extends DayContent {
  day: number;
  date: string | null; // "YYYY-MM-DD"
}

export type TripStatus = "draft" | "approved";

export interface TripSummary {
  id: string;
  destination: string;
  title: string;
  startDate: string;
  endDate: string;
  travelers: number;
  status: TripStatus;
  createdAt: string;
}

export interface Trip extends TripSummary {
  summary: string;
  origin: string; // traveling from
  pace: string;
  days: DayPlan[];
  updatedAt: string;
}

// AI chat for editing a day
export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface DayChatResponse {
  reply: string;
  updated: boolean; // false if the assistant only answered a question
  day: DayPlan;
}

// The editable fields of a day, e.g. to undo an AI change
export const contentOf = ({ title, stay, activities, food, bookings }: DayContent): DayContent => ({
  title,
  stay,
  activities,
  food,
  bookings,
});

// Consecutive days at the same place, i.e. one hotel booking
export interface StayGroup {
  stay: Stay;
  firstDay: DayPlan;
  lastDay: DayPlan;
}

export const groupStays = (days: DayPlan[]): StayGroup[] => {
  const groups: StayGroup[] = [];
  let current: StayGroup | null = null;
  for (const day of days) {
    if (!day.stay.name) {
      current = null; // e.g. an overnight train breaks the hotel booking
    } else if (current && current.stay.name === day.stay.name) {
      current.lastDay = day;
    } else {
      current = { stay: day.stay, firstDay: day, lastDay: day };
      groups.push(current);
    }
  }
  return groups;
};

export const MAX_TRIP_DAYS = 14;

// Parse "YYYY-MM-DD" as a local date (new Date("2027-04-10") would be UTC and can show the previous day)
export const parseDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const formatDate = (value: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  parseDate(value).toLocaleDateString(undefined, options);

export const daysBetween = (start: string, end: string) =>
  Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 86_400_000) + 1;
