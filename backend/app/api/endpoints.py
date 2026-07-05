from fastapi import APIRouter
from app.schemas.trip import TripRequest, TripResponse

router = APIRouter()

@router.post("/plan-trip", response_model=TripResponse)
def plan_trip(request: TripRequest):
    # Placeholder for the travel planning logic
    return TripResponse(destination=request.destination, days=request.days, itinerary=[])