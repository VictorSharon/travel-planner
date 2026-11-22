import os
from typing import List, Optional
from google import genai
from google.genai import types
from pydantic import BaseModel
from app.schemas.profile import TravelProfileData
from app.schemas.recommendation import Destination
from app.schemas.trip import Booking, ChatTurn, CreateTripRequest, DayContent, DayPlan

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

NUM_RECOMMENDATIONS = 6

# Recommendations don't need deep reasoning; minimal thinking is ~4x faster.
# Gemini 2.x models use a thinking budget instead of a thinking level.
FAST_THINKING = (
    types.ThinkingConfig(thinking_budget=0)
    if MODEL.startswith("gemini-2")
    else types.ThinkingConfig(thinking_level="MINIMAL")
)

POPULAR_PROMPT = f"""You are a travel expert for EaseTravel.
List {NUM_RECOMMENDATIONS} of the most popular travel destinations in the world right now.
Pick a varied mix of regions and trip styles (cities, beaches, nature, culture).
For each, give a short, inviting reason people love it."""

PERSONALIZED_PROMPT = """You are a travel expert for EaseTravel.
Recommend {count} travel destinations tailored to this traveler's profile.
Ratings are on a 1-5 scale (1 = not interested, 3 = neutral, 5 = very interested).
Strongly favor their high-rated interests, bucket list and goals, respect their budget and pace,
and avoid anything they dislike. If their home location is given, keep flight times within what they'll take.
For each destination, the reason should say why it fits *them*, referring to their preferences.

Traveler profile:
{profile}"""


class _DestinationList(BaseModel):
    destinations: List[Destination]


def describe_profile(profile: TravelProfileData) -> str:
    """Turns a profile into readable lines for the prompt, skipping unanswered questions."""
    lines = []

    def add(label: str, value) -> None:
        if value not in ("", [], {}, None):
            lines.append(f"- {label}: {value}")

    def ratings(values: dict) -> str:
        return ", ".join(f"{key} {rating}" for key, rating in values.items())

    def with_other(items: List[str], other: str) -> str:
        return ", ".join(items + ([other] if other else []))

    add("Home location", profile.home_location)
    add("Trips per year", profile.trips_per_year)
    add("Ideal trip length", profile.trip_length)
    add("Travels with", profile.travel_with)
    add("Pace", profile.pace)
    add("Planning style", profile.spontaneity)
    add("Budget per trip", profile.budget)
    add("Accommodation", profile.accommodation)
    add("Spends most on", profile.spending_priority)
    add("Interest ratings", ratings(profile.interests))
    add("Adventurous with food", profile.food_adventurous)
    add("Dietary restrictions", profile.dietary_restrictions)
    add("Favorite cuisines", profile.favorite_cuisines)
    add("Fine dining over street food", profile.street_vs_fine_dining)
    add("Coffee culture", profile.coffee_culture)
    add("Wineries and breweries", profile.wine_breweries)
    add("Climate ratings", ratings(profile.climate))
    add("Longest flight they'll take", profile.longest_flight)
    add("Preferred transportation", profile.transportation)
    add("Bucket list", with_other(profile.bucket_list, profile.bucket_list_other))
    add("Vacation goals", ", ".join(profile.vacation_goals))
    add("Dislikes", with_other(profile.dislikes, profile.dislikes_other))
    return "\n".join(lines)


def generate_destinations(profile: Optional[TravelProfileData] = None) -> List[Destination]:
    """Asks Gemini for destinations: personalized if a profile is given, otherwise generally popular."""
    if profile is None:
        prompt = POPULAR_PROMPT
    else:
        prompt = PERSONALIZED_PROMPT.format(count=NUM_RECOMMENDATIONS, profile=describe_profile(profile))

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_DestinationList,
            thinking_config=FAST_THINKING,
        ),
    )
    return _DestinationList.model_validate_json(response.text).destinations[:NUM_RECOMMENDATIONS]


def getting_there(origin: str, destination: str) -> str:
    """Booking guidance for getting to the destination and home again."""
    if origin:
        return (
            f"Getting there and back from {origin}: use the sensible option (usually a flight, but a train, bus or "
            f"drive if {origin} is close to {destination}). Add the outbound trip on day 1 and the return on the last "
            f"day, named like 'Flight from {origin} to {destination}', plus any airport transfer or rental car."
        )
    return (
        "Getting there and back: the flight to the destination on day 1 and the return flight on the last day "
        f"(their home city is unknown, so name them like 'Flight to {destination}'), plus any airport transfer or rental car."
    )


BOOKINGS_GUIDE = """Be thorough. List everything the traveler should book in advance for each day (not the hotel):
  - {getting_there}
  - Transport between places: flights, trains, buses and ferries.
  - Tickets for activities in the plan: timed entry, sold-out-prone attractions, shows, events, games.
  - Restaurants in the plan that need or recommend reservations.
  - Tours: guided, walking, food, boat, bus (e.g. hop-on hop-off) or day tours. Include tours that would make the
    day's activities better even if they aren't in the plan, marked as recommended.
  Mark each as required (you likely can't go without booking) or recommended, and say how far ahead to book."""


TRIP_PROMPT = """You are an expert travel planner for EaseTravel.
Create a {num_days}-day itinerary for {destination}, from {start_date} to {end_date}, for {travelers} traveler(s).{origin}
{extra}
For each day, in order, give:
- title: a short, evocative theme for the day.
- stay: where to sleep that night. A real, specific hotel, guesthouse or rental that fits their budget, plus its
  neighborhood. Keep the same place on consecutive nights unless changing base makes sense for the route.
- activities: 3-5 activities in time order, grouped so each day is geographically sensible. Account for travel time,
  the season of these dates, and a realistic arrival on day 1 and departure on the last day.
- food: breakfast, lunch and dinner plus 1-2 snacks or drinks along the way. Real places near that day's activities,
  or local dishes to try.
- bookings: {bookings_guide}
Also give a catchy trip title and a 1-2 sentence summary of the trip."""


class _TripPlan(BaseModel):
    title: str
    summary: str
    days: List[DayContent]


def generate_trip_plan(request: CreateTripRequest, profile: Optional[TravelProfileData] = None) -> _TripPlan:
    """Asks Gemini for a day-by-day plan. The caller adds day numbers and dates."""
    extra = []
    if request.pace:
        extra.append(f"Preferred pace: {request.pace}.")
    if request.notes:
        extra.append(f"Notes from the traveler: {request.notes}")
    if profile is not None:
        extra.append(
            "Tailor it to this traveler's profile (ratings are 1-5, 3 = neutral; avoid their dislikes):\n"
            + describe_profile(profile)
        )

    prompt = TRIP_PROMPT.format(
        num_days=request.num_days,
        destination=request.destination,
        start_date=request.start_date.strftime("%B %d, %Y"),
        end_date=request.end_date.strftime("%B %d, %Y"),
        travelers=request.travelers,
        origin=f" They're traveling from {request.origin}." if request.origin else "",
        extra="\n".join(extra),
        bookings_guide=BOOKINGS_GUIDE.format(getting_there=getting_there(request.origin, request.destination)),
    )
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_TripPlan,
            thinking_config=FAST_THINKING,
        ),
    )
    plan = _TripPlan.model_validate_json(response.text)
    if len(plan.days) < request.num_days:
        raise ValueError(f"AI returned {len(plan.days)} days, expected {request.num_days}")
    plan.days = plan.days[: request.num_days]
    return plan


DAY_EDIT_PROMPT = """You are EaseTravel's trip-planning assistant, helping a traveler edit one day of their planner board by chat.

Trip: {destination}, {start_date} to {end_date}, {travelers} traveler(s).{origin}{pace}

Other days of the trip, for context. Don't repeat their activities or restaurants, and keep the stay consistent
with neighboring nights unless the traveler asks to change it:
{other_days}

Current plan for Day {day_number} ({date}), as JSON:
{day_json}

Conversation so far:
{history}
Traveler: {message}

Instructions:
- If the traveler asks for a change, apply it and return the FULL updated day, keeping everything they didn't ask
  to change. Set updated to true.
- If they're only asking a question, answer it, set updated to false and return the day unchanged.
- Keep places real and specific, and keep the day in a sensible time and geographic order.
- Keep bookings complete and in sync with the plan (everything except the hotel): flights and other transport,
  transfers, rental cars, tickets, restaurant reservations, events, and tours, including recommended tours that suit
  the day. Add bookings for anything new and remove ones for anything you took out. On the first and last day,
  include getting there and back.
- reply: 1-3 friendly sentences saying what you changed, or answering their question."""


class _DayEdit(BaseModel):
    reply: str
    updated: bool
    day: DayContent


def edit_day_with_chat(
    destination: str,
    start_date,
    end_date,
    travelers: int,
    pace: str,
    origin: str,
    days: List[DayPlan],
    day: DayPlan,
    message: str,
    history: List[ChatTurn],
) -> _DayEdit:
    """Asks Gemini to apply a chat request to one day of a trip."""
    other_days = "\n".join(
        f"- Day {d.day}: {d.title}. Stay: {d.stay.name}. "
        f"Activities: {', '.join(a.title for a in d.activities)}. Food: {', '.join(f.name for f in d.food)}"
        for d in days
        if d.day != day.day
    )
    transcript = "\n".join(
        f"{'Traveler' if turn.role == 'user' else 'Assistant'}: {turn.text}" for turn in history
    )
    prompt = DAY_EDIT_PROMPT.format(
        destination=destination,
        start_date=start_date.strftime("%B %d, %Y"),
        end_date=end_date.strftime("%B %d, %Y"),
        travelers=travelers,
        origin=f" Traveling from {origin}." if origin else "",
        pace=f" Preferred pace: {pace}." if pace else "",
        other_days=other_days or "(this is a one-day trip)",
        day_number=day.day,
        date=day.date.strftime("%A, %B %d") if day.date else "date not set",
        day_json=DayContent.model_validate(day.model_dump()).model_dump_json(indent=2),
        history=transcript or "(none yet)",
        message=message,
    )
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_DayEdit,
            thinking_config=FAST_THINKING,
        ),
    )
    return _DayEdit.model_validate_json(response.text)


BOOKINGS_PROMPT = """You are an expert travel planner for EaseTravel.
Here is a {num_days}-day trip to {destination}, {start_date} to {end_date}, for {travelers} traveler(s).{origin}
Work out what needs booking for each day WITHOUT changing the plan.

{days}

For each day, return its day number and its bookings. {bookings_guide}"""


class _DayBookings(BaseModel):
    day: int
    bookings: List[Booking]


class _TripBookings(BaseModel):
    days: List[_DayBookings]


def generate_bookings(
    destination: str, start_date, end_date, travelers: int, origin: str, days: List[DayPlan]
) -> dict:
    """Works out the bookings for an existing plan. Returns {day number: [Booking]}."""
    plan = "\n\n".join(
        f"Day {d.day} ({d.date.strftime('%A, %B %d') if d.date else 'date not set'}): {d.title}\n"
        f"Stay: {d.stay.name}, {d.stay.area}\n"
        f"Activities: {'; '.join(f'{a.time}: {a.title}' for a in d.activities)}\n"
        f"Food: {'; '.join(f'{f.meal}: {f.name}' for f in d.food)}"
        for d in days
    )
    prompt = BOOKINGS_PROMPT.format(
        num_days=len(days),
        destination=destination,
        start_date=start_date.strftime("%B %d, %Y"),
        end_date=end_date.strftime("%B %d, %Y"),
        travelers=travelers,
        origin=f" They're traveling from {origin}." if origin else "",
        days=plan,
        bookings_guide=BOOKINGS_GUIDE.format(getting_there=getting_there(origin, destination)),
    )
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_TripBookings,
            thinking_config=FAST_THINKING,
        ),
    )
    result = _TripBookings.model_validate_json(response.text)
    return {d.day: d.bookings for d in result.days}
