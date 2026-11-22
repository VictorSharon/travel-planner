import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../lib/api";

// ---------- Types ----------
type SingleSelectField =
  | "tripsPerYear"
  | "tripLength"
  | "travelWith"
  | "pace"
  | "spontaneity"
  | "budget"
  | "accommodation"
  | "spendingPriority"
  | "longestFlight"
  | "transportation";

type InterestKey =
  | "food" | "nature" | "beaches" | "mountains" | "hiking" | "museums"
  | "history" | "architecture" | "nightlife" | "shopping" | "photography"
  | "wildlife" | "adventureSports" | "festivals" | "themeParks"
  | "wellness" | "localCulture" | "roadTrips";

type ClimateKey = "warm" | "cold" | "snow" | "tropical" | "rain" | "dry";

interface FormState {
  name: string;
  email: string;
  homeLocation: string;
  tripsPerYear: string;
  tripLength: string;
  travelWith: string;
  pace: string;
  spontaneity: string;
  budget: string;
  accommodation: string;
  spendingPriority: string;
  interests: Record<InterestKey, number>;
  foodAdventurous: number;
  dietaryRestrictions: string;
  favoriteCuisines: string;
  streetVsFineDining: number;
  coffeeCulture: number;
  wineBreweries: number;
  climate: Record<ClimateKey, number>;
  longestFlight: string;
  transportation: string;
  bucketList: string[];
  bucketListOther: string;
  vacationGoals: string[];
  dislikes: string[];
  dislikesOther: string;
}

// ---------- Static option lists ----------
const tripsPerYearOptions = ["1", "2-3", "4-6", "7+"];
const tripLengthOptions = ["Weekend", "4–7 days", "1–2 weeks", "2+ weeks"];
const travelWithOptions = ["Solo", "Partner", "Friends", "Family"];
const paceOptions = ["Packed schedule", "Balanced", "Relaxed"];
const spontaneityOptions = ["Everything planned", "Some flexibility", "Completely spontaneous"];
const budgetOptions = ["<$500", "$500–1000", "$1000–2500", "$2500–5000", "$5000+"];
const accommodationOptions = ["Hostel", "Budget hotel", "Boutique hotel", "Resort", "Luxury", "Airbnb"];
const spendingPriorityOptions = ["Food", "Experiences", "Hotels", "Shopping", "Nightlife"];
const longestFlightOptions = ["<3 hours", "3–6", "6–10", "10+"];
const transportationOptions = ["Walk", "Public transit", "Rental car", "Train", "Doesn't matter"];

const interestLabels: { key: InterestKey; label: string }[] = [
  { key: "food", label: "Food" },
  { key: "nature", label: "Nature" },
  { key: "beaches", label: "Beaches" },
  { key: "mountains", label: "Mountains" },
  { key: "hiking", label: "Hiking" },
  { key: "museums", label: "Museums" },
  { key: "history", label: "History" },
  { key: "architecture", label: "Architecture" },
  { key: "nightlife", label: "Nightlife" },
  { key: "shopping", label: "Shopping" },
  { key: "photography", label: "Photography" },
  { key: "wildlife", label: "Wildlife" },
  { key: "adventureSports", label: "Adventure sports" },
  { key: "festivals", label: "Festivals" },
  { key: "themeParks", label: "Theme parks" },
  { key: "wellness", label: "Wellness" },
  { key: "localCulture", label: "Local culture" },
  { key: "roadTrips", label: "Road trips" },
];

const climateLabels: { key: ClimateKey; label: string }[] = [
  { key: "warm", label: "Warm" },
  { key: "cold", label: "Cold" },
  { key: "snow", label: "Snow" },
  { key: "tropical", label: "Tropical" },
  { key: "rain", label: "Rain" },
  { key: "dry", label: "Dry" },
];

const bucketListOptions = [
  "See the Northern Lights", "Safari", "Scuba diving", "Skiing",
  "Cherry blossom season", "Hot air balloon ride", "Hiking to waterfalls",
  "Visiting castles", "Ancient ruins", "National parks", "Island hopping",
  "Food markets", "Wine tasting", "Watching volcanoes", "Desert camping",
];

const vacationGoalOptions = [
  "Relax", "Adventure", "Learn history", "Eat amazing food", "Meet locals",
  "Beautiful photos", "Escape work", "Celebrate", "Explore new cultures",
  "Disconnect from technology",
];

const dislikeOptions = [
  "Crowds", "Cold weather", "Humidity", "Long hikes", "Expensive cities",
  "Tourist attractions", "Camping", "Beaches", "Museums", "Nightlife", "Long flights",
];

const defaultInterests = interestLabels.reduce((acc, { key }) => {
  acc[key] = 3;
  return acc;
}, {} as Record<InterestKey, number>);

const defaultClimate = climateLabels.reduce((acc, { key }) => {
  acc[key] = 3;
  return acc;
}, {} as Record<ClimateKey, number>);

const defaultFormState: FormState = {
  name: "",
  email: "",
  homeLocation: "",
  tripsPerYear: "",
  tripLength: "",
  travelWith: "",
  pace: "",
  spontaneity: "",
  budget: "",
  accommodation: "",
  spendingPriority: "",
  interests: defaultInterests,
  foodAdventurous: 3,
  dietaryRestrictions: "",
  favoriteCuisines: "",
  streetVsFineDining: 3,
  coffeeCulture: 3,
  wineBreweries: 3,
  climate: defaultClimate,
  longestFlight: "",
  transportation: "",
  bucketList: [],
  bucketListOther: "",
  vacationGoals: [],
  dislikes: [],
  dislikesOther: "",
};

// Fill in defaults for anything missing from a saved profile (e.g. questions added later)
const withDefaults = (saved: Partial<FormState>): FormState => ({
  ...defaultFormState,
  ...saved,
  interests: { ...defaultInterests, ...saved.interests },
  climate: { ...defaultClimate, ...saved.climate },
});

// ---------- Reusable pieces ----------
const SectionCard: React.FC<{ emoji: string; title: string; subtitle?: string; children: React.ReactNode }> = ({
  emoji, title, subtitle, children,
}) => (
  <div className="bg-white rounded-md shadow-md shadow-slate-900/10 p-6 md:p-8">
    <h3 className="text-lg font-bold text-slate-900 mb-1">
      <span className="mr-2">{emoji}</span>{title}
    </h3>
    {subtitle && <p className="text-sm text-slate-500 mb-5">{subtitle}</p>}
    <div className="space-y-6">{children}</div>
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-sm font-medium text-slate-700 mb-2">{children}</label>
);

const ToggleGroup: React.FC<{
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}> = ({ options, selected, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = selected === opt;
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`px-4 py-2 rounded-md text-sm font-medium border transition-all duration-150 ${
            active
              ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/30"
              : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const PillMultiSelect: React.FC<{
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  max?: number;
}> = ({ options, selected, onToggle, max }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = selected.includes(opt);
      const disabled = !active && max !== undefined && selected.length >= max;
      return (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onToggle(opt)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
            active
              ? "bg-yellow-700 text-white border-yellow-700 shadow-md shadow-yellow-700/40"
              : disabled
              ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
              : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const RatingSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}> = ({ label, value, onChange, min = 1, max = 5 }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="text-sm font-semibold text-yellow-700">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-yellow-700"
    />
  </div>
);

// ---------- Main component ----------
const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load the user's saved answers
  useEffect(() => {
    let cancelled = false;
    api
      .get<Partial<FormState> | null>("/api/travel-profile")
      .then((res) => {
        if (cancelled) return;
        if (res.data) setFormData(withDefaults(res.data));
        setLoadState("ready");
      })
      .catch((err) => {
        console.error("Failed to load travel profile:", err);
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setSingleSelect = (field: SingleSelectField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setInterest = (key: InterestKey, value: number) => {
    setFormData((prev) => ({ ...prev, interests: { ...prev.interests, [key]: value } }));
  };

  const setClimateVal = (key: ClimateKey, value: number) => {
    setFormData((prev) => ({ ...prev, climate: { ...prev.climate, [key]: value } }));
  };

  const toggleInList = (field: "bucketList" | "vacationGoals" | "dislikes", value: string, max?: number) => {
    setFormData((prev) => {
      const list = prev[field];
      const exists = list.includes(value);
      if (exists) {
        return { ...prev, [field]: list.filter((v) => v !== value) };
      }
      if (max !== undefined && list.length >= max) {
        return prev;
      }
      return { ...prev, [field]: [...list, value] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await api.put("/api/travel-profile", formData);
      navigate("/");
    } catch (err) {
      console.error("Failed to save travel profile:", err);
      setSaveError("Couldn't save your profile. Please try again.");
      setSaving(false);
    }
  };

  // Don't show the form until saved answers have loaded, so an empty form can't overwrite them
  if (loadState !== "ready") {
    return (
      <div className="flex justify-center px-4 py-24 text-center text-slate-600">
        {loadState === "loading" ? (
          <p>Loading your travel profile…</p>
        ) : (
          <div>
            <p className="mb-4">We couldn't load your travel profile.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-700 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-orange-400 transition-all duration-150"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
        <div className="text-center mb-2">
          <h2 className="text-3xl font-bold text-slate-900">Build Your Travel Profile</h2>
          <p className="text-sm text-slate-500 mt-2">
            The more you tell us, the better we can match you with destinations you'll love.
          </p>
        </div>

        {/* Basic info */}
        <SectionCard emoji="👋" title="About You">
          <div>
            <FieldLabel>Name</FieldLabel>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setField("name", e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 transition-all"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setField("email", e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 transition-all"
              placeholder="you@example.com"
            />
            <p className="text-xs text-slate-400 mt-1">
              We'll only use this for recommendations and occasional promotions.
            </p>
          </div>
        </SectionCard>

        <SectionCard emoji="🏠" title="Home Location" subtitle="Where your trips start. We'll plan flights and transport from here.">
          <div>
            <FieldLabel>City</FieldLabel>
            <input
              type="text"
              value={formData.homeLocation}
              onChange={(e) => setField("homeLocation", e.target.value)}
              maxLength={200}
              className="w-full border border-slate-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 transition-all"
              placeholder="e.g. Chicago, IL"
            />
          </div>
        </SectionCard>

        {/* Travel style */}
        <SectionCard emoji="🧳" title="Travel Style" subtitle="How you like to travel.">
          <div>
            <FieldLabel>How many trips do you usually take per year?</FieldLabel>
            <ToggleGroup options={tripsPerYearOptions} selected={formData.tripsPerYear} onSelect={(v) => setSingleSelect("tripsPerYear", v)} />
          </div>
          <div>
            <FieldLabel>What's your ideal trip length?</FieldLabel>
            <ToggleGroup options={tripLengthOptions} selected={formData.tripLength} onSelect={(v) => setSingleSelect("tripLength", v)} />
          </div>
          <div>
            <FieldLabel>How do you usually travel?</FieldLabel>
            <ToggleGroup options={travelWithOptions} selected={formData.travelWith} onSelect={(v) => setSingleSelect("travelWith", v)} />
          </div>
          <div>
            <FieldLabel>How fast do you like to travel?</FieldLabel>
            <ToggleGroup options={paceOptions} selected={formData.pace} onSelect={(v) => setSingleSelect("pace", v)} />
          </div>
          <div>
            <FieldLabel>How spontaneous are you?</FieldLabel>
            <ToggleGroup options={spontaneityOptions} selected={formData.spontaneity} onSelect={(v) => setSingleSelect("spontaneity", v)} />
          </div>
        </SectionCard>

        {/* Budget */}
        <SectionCard emoji="💰" title="Budget">
          <div>
            <FieldLabel>Budget per trip</FieldLabel>
            <ToggleGroup options={budgetOptions} selected={formData.budget} onSelect={(v) => setSingleSelect("budget", v)} />
          </div>
          <div>
            <FieldLabel>Preferred accommodation</FieldLabel>
            <ToggleGroup options={accommodationOptions} selected={formData.accommodation} onSelect={(v) => setSingleSelect("accommodation", v)} />
          </div>
          <div>
            <FieldLabel>Biggest priority when spending money?</FieldLabel>
            <ToggleGroup options={spendingPriorityOptions} selected={formData.spendingPriority} onSelect={(v) => setSingleSelect("spendingPriority", v)} />
          </div>
        </SectionCard>

        {/* Interests */}
        <SectionCard emoji="🏞" title="Interests" subtitle="Rate how much you enjoy each, from 1 to 5.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {interestLabels.map(({ key, label }) => (
              <RatingSlider
                key={key}
                label={label}
                value={formData.interests[key]}
                onChange={(v) => setInterest(key, v)}
              />
            ))}
          </div>
        </SectionCard>

        {/* Food preferences */}
        <SectionCard emoji="🍽" title="Food Preferences">
          <RatingSlider
            label="How adventurous are you with food?"
            value={formData.foodAdventurous}
            onChange={(v) => setField("foodAdventurous", v)}
          />
          <div>
            <FieldLabel>Dietary restrictions</FieldLabel>
            <input
              type="text"
              value={formData.dietaryRestrictions}
              onChange={(e) => setField("dietaryRestrictions", e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 transition-all"
              placeholder="e.g. vegetarian, gluten-free, none"
            />
          </div>
          <div>
            <FieldLabel>Favorite cuisines</FieldLabel>
            <input
              type="text"
              value={formData.favoriteCuisines}
              onChange={(e) => setField("favoriteCuisines", e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 transition-all"
              placeholder="e.g. Thai, Italian, Mexican"
            />
          </div>
          <RatingSlider
            label="Street food ↔ Fine dining"
            value={formData.streetVsFineDining}
            onChange={(v) => setField("streetVsFineDining", v)}
          />
          <RatingSlider
            label="Coffee culture"
            value={formData.coffeeCulture}
            onChange={(v) => setField("coffeeCulture", v)}
          />
          <RatingSlider
            label="Wine & breweries"
            value={formData.wineBreweries}
            onChange={(v) => setField("wineBreweries", v)}
          />
        </SectionCard>

        {/* Climate */}
        <SectionCard emoji="🌤" title="Climate" subtitle="What weather makes you happiest?">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {climateLabels.map(({ key, label }) => (
              <RatingSlider
                key={key}
                label={label}
                value={formData.climate[key]}
                onChange={(v) => setClimateVal(key, v)}
              />
            ))}
          </div>
        </SectionCard>

        {/* Logistics */}
        <SectionCard emoji="🛫" title="Travel Logistics">
          <div>
            <FieldLabel>Longest flight you're comfortable taking</FieldLabel>
            <ToggleGroup options={longestFlightOptions} selected={formData.longestFlight} onSelect={(v) => setSingleSelect("longestFlight", v)} />
          </div>
          <div>
            <FieldLabel>Preferred transportation</FieldLabel>
            <ToggleGroup options={transportationOptions} selected={formData.transportation} onSelect={(v) => setSingleSelect("transportation", v)} />
          </div>
        </SectionCard>

        {/* Bucket list */}
        <SectionCard emoji="🎯" title="Bucket List Experiences" subtitle="Select any that you dream about.">
          <PillMultiSelect options={bucketListOptions} selected={formData.bucketList} onToggle={(v) => toggleInList("bucketList", v)} />
          <div>
            <FieldLabel>Other</FieldLabel>
            <input
              type="text"
              value={formData.bucketListOther}
              onChange={(e) => setField("bucketListOther", e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 transition-all"
              placeholder="Anything else on your list?"
            />
          </div>
        </SectionCard>

        {/* Vacation goals */}
        <SectionCard emoji="📸" title="Vacation Goals" subtitle={`Choose your top three (${formData.vacationGoals.length}/3 selected).`}>
          <PillMultiSelect options={vacationGoalOptions} selected={formData.vacationGoals} onToggle={(v) => toggleInList("vacationGoals", v, 3)} max={3} />
        </SectionCard>

        {/* Dislikes */}
        <SectionCard emoji="🚫" title="Things You Don't Enjoy">
          <PillMultiSelect options={dislikeOptions} selected={formData.dislikes} onToggle={(v) => toggleInList("dislikes", v)} />
          <div>
            <FieldLabel>Other</FieldLabel>
            <input
              type="text"
              value={formData.dislikesOther}
              onChange={(e) => setField("dislikesOther", e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 transition-all"
              placeholder="Anything else you'd rather skip?"
            />
          </div>
        </SectionCard>

        {saveError && <p className="text-sm text-red-600 text-center">{saveError}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-yellow-700 text-white font-semibold px-6 py-3.5 rounded-md shadow-md shadow-yellow-700/40 hover:bg-orange-400 hover:shadow-lg hover:shadow-yellow-700/50 transition-all duration-150 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save My Travel Profile"}
        </button>
      </form>
    </div>
  );
};

export default FormPage;