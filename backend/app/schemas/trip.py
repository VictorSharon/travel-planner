from pydantic import BaseModel
from typing import List

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: str
    interests: List[str]

class ItineraryItem(BaseModel):
    day: int
    activities: List[str]

class TripResponse(BaseModel):
    destination: str
    days: int
    itinerary: List[ItineraryItem]