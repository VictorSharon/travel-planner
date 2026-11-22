from typing import Annotated, Dict, List
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

Rating = Annotated[int, Field(ge=1, le=5)]  # 1-5 slider value


class TravelProfileData(BaseModel):
    """Travel profile answers. Uses camelCase over the API to match the frontend form."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = ""
    email: str = ""
    home_location: str = Field(default="", max_length=200)  # departure point for flights
    trips_per_year: str = ""
    trip_length: str = ""
    travel_with: str = ""
    pace: str = ""
    spontaneity: str = ""
    budget: str = ""
    accommodation: str = ""
    spending_priority: str = ""
    interests: Dict[str, Rating] = {}
    food_adventurous: Rating = 3
    dietary_restrictions: str = ""
    favorite_cuisines: str = ""
    street_vs_fine_dining: Rating = 3
    coffee_culture: Rating = 3
    wine_breweries: Rating = 3
    climate: Dict[str, Rating] = {}
    longest_flight: str = ""
    transportation: str = ""
    bucket_list: List[str] = []
    bucket_list_other: str = ""
    vacation_goals: List[str] = Field(default=[], max_length=3)
    dislikes: List[str] = []
    dislikes_other: str = ""
