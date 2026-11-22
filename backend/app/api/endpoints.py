import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from app.auth.clerk import get_current_user_id
from app.database.db import get_db
from app.models.travel_profile import TravelProfile
from app.schemas.trip import TripRequest, TripResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.profile import TravelProfileData

# Every /api route requires a signed-in Clerk user
router = APIRouter(dependencies=[Depends(get_current_user_id)])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/plan-trip", response_model=TripResponse)
def plan_trip(request: TripRequest):
    return TripResponse(destination=request.destination, days=request.days, itinerary=[])


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
        model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        response = client.models.generate_content(
            model=model,
            contents=f"{system_prompt}\n\nUser: {request.message}",
        )
        return ChatResponse(reply=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
