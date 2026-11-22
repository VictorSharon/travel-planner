import datetime as dt
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

MAX_TRIP_DAYS = 14

TripStatus = Literal["draft", "approved"]


class CamelModel(BaseModel):
    """camelCase over the API to match the frontend. Can be built from database rows."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


# ---------- Planner board contents ----------

class Stay(CamelModel):
    name: str = Field(description="A real, specific hotel, guesthouse or rental")
    area: str = Field(description="Neighborhood or area it's in")
    notes: str = Field(default="", description="Why it's a good base for this day, under 20 words")


class Activity(CamelModel):
    time: str = Field(description="Time of day, e.g. 'Morning', '2:00 PM'")
    title: str
    details: str = Field(default="", description="One short sentence")


class FoodStop(CamelModel):
    meal: str = Field(description="Breakfast, Lunch, Dinner, Snack or Drinks")
    name: str = Field(description="A real place, or a local dish to try")
    details: str = Field(default="", description="What to order or why, one short sentence")


class Booking(CamelModel):
    """Something to reserve ahead of time. Hotels come from the day's stay, so they aren't listed here."""

    # "transport" is kept so trips saved before the specific types existed still load
    type: Literal[
        "flight", "train", "bus", "ferry", "car_rental", "transfer", "tour",
        "activity", "restaurant", "event", "transport", "other",
    ] = Field(
        description="flight, train, bus, ferry, car_rental, transfer (e.g. airport pickup), tour (guided, bus, walking, "
        "food, boat or day tours), activity (entry tickets), restaurant, event (shows, concerts, games) or other"
    )
    name: str = Field(description="What to book, e.g. 'Flight to Lisbon', 'Colosseum timed entry', 'Sintra day tour'")
    details: str = Field(default="", description="What exactly to reserve, e.g. 'Timed-entry tickets for 2', under 15 words")
    required: bool = Field(description="True if you likely can't go without booking; false if booking is just recommended")
    book_ahead: str = Field(default="", description="How far in advance to book, e.g. '2-3 weeks ahead'")


class DayContent(CamelModel):
    """The editable part of a day tile."""

    title: str = Field(description="Short theme for the day, e.g. 'Old town & tapas'")
    stay: Stay
    activities: List[Activity]
    food: List[FoodStop]
    bookings: List[Booking] = Field(
        default=[],
        description="Everything to book in advance for this day: flights and other transport, tours, tickets, "
        "restaurants, events. Exclude the hotel.",
    )


class DayPlan(DayContent):
    day: int
    date: Optional[dt.date] = None


# ---------- Requests / responses ----------

class CreateTripRequest(CamelModel):
    destination: str = Field(min_length=1, max_length=200)
    start_date: dt.date
    end_date: dt.date
    travelers: int = Field(default=1, ge=1, le=20)
    origin: str = Field(default="", max_length=200)  # where they're traveling from, for flights
    pace: str = Field(default="", max_length=100)
    use_profile: bool = True
    notes: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after the start date")
        if self.num_days > MAX_TRIP_DAYS:
            raise ValueError(f"Trips can be at most {MAX_TRIP_DAYS} days")
        return self

    @property
    def num_days(self) -> int:
        return (self.end_date - self.start_date).days + 1


class TripSummary(CamelModel):
    id: str
    destination: str
    title: str
    start_date: dt.date
    end_date: dt.date
    travelers: int
    status: TripStatus
    created_at: dt.datetime


class TripResponse(TripSummary):
    summary: str
    origin: str
    pace: str
    days: List[DayPlan]
    updated_at: dt.datetime


class TripStatusUpdate(CamelModel):
    status: TripStatus


# ---------- AI chat for editing a day ----------

class ChatTurn(CamelModel):
    role: Literal["user", "assistant"]
    text: str = Field(max_length=4000)


class DayChatRequest(CamelModel):
    message: str = Field(min_length=1, max_length=1000)
    history: List[ChatTurn] = Field(default=[], max_length=30)  # earlier messages in this day's chat


class DayChatResponse(CamelModel):
    reply: str
    updated: bool  # False if the assistant only answered a question
    day: DayPlan
