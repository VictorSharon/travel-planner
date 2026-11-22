from typing import List
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class Destination(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(description="Destination name, e.g. a city, island or region")
    country: str
    reason: str = Field(description="One or two sentences on why this destination fits, under 30 words")
    best_time_to_visit: str = Field(description="Short phrase, e.g. 'April to June'")


class RecommendationsResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    personalized: bool  # False when showing generally popular destinations
    destinations: List[Destination]
