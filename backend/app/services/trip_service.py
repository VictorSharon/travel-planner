from datetime import timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.travel_profile import TravelProfile
from app.models.trip import Trip
from app.schemas.profile import TravelProfileData
from app.schemas.trip import CreateTripRequest, DayChatRequest, DayContent, DayPlan, TripStatus
from app.services.ai_service import edit_day_with_chat, generate_bookings, generate_trip_plan
from app.services.recommendation_service import has_preferences


def _load_profile(db: Session, user_id: str) -> Optional[TravelProfileData]:
    row = db.get(TravelProfile, user_id)
    if row is None:
        return None
    profile = TravelProfileData.model_validate(row.data)
    return profile if has_preferences(profile) else None


def create_trip(db: Session, user_id: str, request: CreateTripRequest) -> Trip:
    """Generates a planner board with AI and saves it as a new draft trip."""
    profile = _load_profile(db, user_id) if request.use_profile else None
    plan = generate_trip_plan(request, profile)

    days = [
        DayPlan(day=i + 1, date=request.start_date + timedelta(days=i), **content.model_dump())
        for i, content in enumerate(plan.days)
    ]
    trip = Trip(
        user_id=user_id,
        destination=request.destination,
        title=plan.title,
        summary=plan.summary,
        start_date=request.start_date,
        end_date=request.end_date,
        travelers=request.travelers,
        origin=request.origin.strip(),
        pace=request.pace,
        days=[d.model_dump(mode="json") for d in days],
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def get_trip(db: Session, user_id: str, trip_id: str) -> Optional[Trip]:
    """Returns the trip only if it belongs to this user."""
    trip = db.get(Trip, trip_id)
    return trip if trip is not None and trip.user_id == user_id else None


def list_trips(db: Session, user_id: str) -> List[Trip]:
    return db.query(Trip).filter(Trip.user_id == user_id).order_by(Trip.created_at.desc()).all()


def update_day(db: Session, trip: Trip, day_number: int, content: DayContent) -> Optional[DayPlan]:
    """Replaces one day tile's contents. Day number and date stay fixed."""
    days = [DayPlan.model_validate(d) for d in trip.days]
    index = next((i for i, d in enumerate(days) if d.day == day_number), None)
    if index is None:
        return None

    days[index] = DayPlan(day=day_number, date=days[index].date, **content.model_dump())
    trip.days = [d.model_dump(mode="json") for d in days]  # reassign so SQLAlchemy saves the change
    db.commit()
    return days[index]


def is_editable(trip: Trip) -> bool:
    """Approved trips are locked; move them back to draft to edit."""
    return trip.status == "draft"


def set_status(db: Session, trip: Trip, status: TripStatus) -> Trip:
    trip.status = status
    db.commit()
    db.refresh(trip)
    return trip


def chat_edit_day(db: Session, trip: Trip, day_number: int, request: DayChatRequest) -> Optional[Tuple[str, bool, DayPlan]]:
    """Applies a chat message to one day with AI. Returns (reply, updated, day), or None if the day doesn't exist."""
    days = [DayPlan.model_validate(d) for d in trip.days]
    day = next((d for d in days if d.day == day_number), None)
    if day is None:
        return None

    result = edit_day_with_chat(
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        travelers=trip.travelers,
        pace=trip.pace,
        origin=trip.origin,
        days=days,
        day=day,
        message=request.message,
        history=request.history,
    )
    if result.updated:
        day = update_day(db, trip, day_number, result.day)
    return result.reply, result.updated, day


def refresh_bookings(db: Session, trip: Trip) -> Trip:
    """Re-works out what needs booking for every day with AI, leaving the rest of the plan unchanged."""
    if not trip.origin:
        # Trips made before home location existed: start them from the profile's home location
        profile_row = db.get(TravelProfile, trip.user_id)
        if profile_row is not None:
            trip.origin = TravelProfileData.model_validate(profile_row.data).home_location.strip()
    days = [DayPlan.model_validate(d) for d in trip.days]
    bookings = generate_bookings(trip.destination, trip.start_date, trip.end_date, trip.travelers, trip.origin, days)
    for day in days:
        day.bookings = bookings.get(day.day, [])
    trip.days = [d.model_dump(mode="json") for d in days]  # reassign so SQLAlchemy saves the change
    db.commit()
    db.refresh(trip)
    return trip
