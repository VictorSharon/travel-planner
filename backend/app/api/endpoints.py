import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from google.genai import errors as genai_errors
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from app.auth.clerk import get_current_user_id
from app.database.db import get_db
from app.models.travel_profile import TravelProfile
from app.schemas.trip import (
    CreateTripRequest,
    DayChatRequest,
    DayChatResponse,
    DayContent,
    DayPlan,
    TripResponse,
    TripStatusUpdate,
    TripSummary,
)
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.profile import TravelProfileData
from app.schemas.recommendation import RecommendationsResponse
from app.services import recommendation_service, trip_service
from app.services.ai_service import MODEL, client

logger = logging.getLogger(__name__)

# Every route on this router requires a signed-in Clerk user
router = APIRouter(dependencies=[Depends(get_current_user_id)])

# Routes anyone can call (keep these cheap: no per-request AI calls)
public_router = APIRouter()


def _ai_failure(exc: Exception, detail: str) -> HTTPException:
    """Turns an AI error into a user-facing error, calling out usage limits specifically."""
    if isinstance(exc, genai_errors.APIError) and exc.code == 429:
        return HTTPException(
            status_code=429, detail="The AI assistant has reached its usage limit for now. Please try again later."
        )
    return HTTPException(status_code=502, detail=detail)

@router.post("/trips", response_model=TripResponse)
def create_trip(
    request: CreateTripRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Generates a planner board for a new trip with AI and saves it."""
    try:
        trip = trip_service.create_trip(db, user_id, request)
    except Exception as e:
        logger.exception("Failed to generate trip for %s", user_id)
        raise _ai_failure(e, "Couldn't generate your planner board. Please try again.")
    return TripResponse.model_validate(trip)


@router.get("/trips", response_model=List[TripSummary])
def list_trips(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return [TripSummary.model_validate(t) for t in trip_service.list_trips(db, user_id)]


@router.get("/trips/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    trip = trip_service.get_trip(db, user_id, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return TripResponse.model_validate(trip)


@router.put("/trips/{trip_id}/days/{day_number}", response_model=DayPlan)
def update_trip_day(
    trip_id: str,
    day_number: int,
    content: DayContent,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Replaces a single day tile on the planner board (used to undo AI edits)."""
    trip = _get_editable_trip(db, user_id, trip_id)
    day = trip_service.update_day(db, trip, day_number, content)
    if day is None:
        raise HTTPException(status_code=404, detail="Day not found")
    return day


@router.post("/trips/{trip_id}/days/{day_number}/chat", response_model=DayChatResponse)
def chat_edit_trip_day(
    trip_id: str,
    day_number: int,
    request: DayChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Edits one day tile through a chat with the AI assistant. Saves the day if the assistant changed it."""
    trip = _get_editable_trip(db, user_id, trip_id)
    try:
        result = trip_service.chat_edit_day(db, trip, day_number, request)
    except Exception as e:
        logger.exception("Failed to edit day %s of trip %s", day_number, trip_id)
        raise _ai_failure(e, "The assistant couldn't update this day. Please try again.")
    if result is None:
        raise HTTPException(status_code=404, detail="Day not found")
    reply, updated, day = result
    return DayChatResponse(reply=reply, updated=updated, day=day)


@router.post("/trips/{trip_id}/bookings/refresh", response_model=TripResponse)
def refresh_trip_bookings(trip_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Regenerates the bookings list for every day with AI, without changing the plan."""
    trip = _get_editable_trip(db, user_id, trip_id)
    try:
        trip = trip_service.refresh_bookings(db, trip)
    except Exception as e:
        logger.exception("Failed to refresh bookings for trip %s", trip_id)
        raise _ai_failure(e, "Couldn't update the bookings list. Please try again.")
    return TripResponse.model_validate(trip)


@router.put("/trips/{trip_id}/status", response_model=TripResponse)
def update_trip_status(
    trip_id: str,
    update: TripStatusUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Approves a trip, or moves it back to draft so it can be edited."""
    trip = trip_service.get_trip(db, user_id, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return TripResponse.model_validate(trip_service.set_status(db, trip, update.status))


def _get_editable_trip(db: Session, user_id: str, trip_id: str):
    trip = trip_service.get_trip(db, user_id, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    if not trip_service.is_editable(trip):
        raise HTTPException(status_code=409, detail="This trip is approved. Move it back to draft to edit it.")
    return trip


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    system_prompt = (
        "You are a helpful travel planning assistant for EaseTravel. "
        "Help the user build a personalized itinerary based on their preferences. "
        "Be concise, friendly, and practical."
    )
    if request.destination:
        system_prompt += f" The user is planning a trip to {request.destination}."
    if request.context:
        system_prompt += f" Here is what we know about their preferences: {request.context}"

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=f"{system_prompt}\n\nUser: {request.message}",
        )
        return ChatResponse(reply=response.text)
    except Exception as e:
        logger.exception("Chat request failed")
        raise _ai_failure(e, "Sorry, the assistant couldn't respond. Please try again.")

@router.get("/travel-profile", response_model=Optional[TravelProfileData])
def get_travel_profile(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Returns the signed-in user's travel profile, or null if they haven't saved one yet."""
    profile = db.get(TravelProfile, user_id)
    return TravelProfileData.model_validate(profile.data) if profile else None


@router.put("/travel-profile", response_model=TravelProfileData)
def save_travel_profile(
    data: TravelProfileData,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Creates or replaces the signed-in user's travel profile."""
    values = data.model_dump()
    stmt = insert(TravelProfile).values(user_id=user_id, data=values)
    stmt = stmt.on_conflict_do_update(
        index_elements=[TravelProfile.user_id],
        set_={"data": values, "updated_at": func.now()},
    )
    db.execute(stmt)
    db.commit()
    return data


@router.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Personalized destinations from the user's travel profile, or popular ones if it's still all defaults."""
    try:
        return recommendation_service.get_for_user(db, user_id)
    except Exception as e:
        logger.exception("Failed to generate recommendations for %s", user_id)
        raise _ai_failure(e, "Couldn't generate recommendations right now.")


@public_router.get("/recommendations/popular", response_model=RecommendationsResponse)
def get_popular_recommendations(db: Session = Depends(get_db)):
    """Generally popular destinations, for signed-out visitors. Cached, so Gemini is rarely called."""
    try:
        return recommendation_service.get_popular(db)
    except Exception as e:
        logger.exception("Failed to generate popular recommendations")
        raise _ai_failure(e, "Couldn't load recommendations right now.")
