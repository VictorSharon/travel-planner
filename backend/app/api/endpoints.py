import os
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from app.auth.clerk import get_current_user_id
from app.schemas.trip import TripRequest, TripResponse
from app.schemas.chat import ChatRequest, ChatResponse

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