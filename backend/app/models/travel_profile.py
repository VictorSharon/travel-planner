from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from app.database.db import Base


class TravelProfile(Base):
    """One travel profile per Clerk user. Answers are stored as JSON so form questions can change without migrations."""

    __tablename__ = "user_travel_profiles"

    user_id = Column(String, primary_key=True)  # Clerk user ID, e.g. "user_2abc..."
    data = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
