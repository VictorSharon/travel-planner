from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from app.database.db import Base


class RecommendationCache(Base):
    """Saved AI recommendations, so Gemini isn't called on every page load."""

    __tablename__ = "recommendation_cache"

    cache_key = Column(String, primary_key=True)  # "popular" or "user:<clerk user id>"
    fingerprint = Column(String, nullable=False)  # changes when the inputs (profile or prompt) change
    data = Column(JSONB, nullable=False)  # list of destinations
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
