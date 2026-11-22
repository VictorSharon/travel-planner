import uuid
from sqlalchemy import Column, Date, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from app.database.db import Base


class Trip(Base):
    """A planned trip and its planner board. Days are stored as JSON (one entry per day tile)."""

    __tablename__ = "trips"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)  # Clerk user ID
    destination = Column(String, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False, default="")
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    travelers = Column(Integer, nullable=False, default=1)
    origin = Column(String, nullable=False, default="", server_default="")  # traveling from, for flights
    pace = Column(String, nullable=False, default="")
    status = Column(String, nullable=False, default="draft")  # later: approved, booked
    days = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
